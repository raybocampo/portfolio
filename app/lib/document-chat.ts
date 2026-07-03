// Shared helpers for the "Chat with your documents" demo.
//
// Design note: nothing here writes to disk or a database. A visitor uploads one
// file; we turn it into text, cut it into small pieces, and turn each piece into
// a list of numbers (an "embedding") that captures its meaning. Those pieces and
// numbers are handed back to the visitor's browser and live only there, for that
// one session. When the tab closes, they're gone. This keeps the feature working
// in a serverless environment, where each request can land on a different machine.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// ---------- File rules ----------

export const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — Vercel caps request bodies at ~4.5 MB
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"] as const;

// Anything longer than this (very roughly measured) counts as a "big" document,
// and we tell the visitor answers will focus on the most relevant sections.
export const LARGE_DOC_TOKEN_THRESHOLD = 50_000;

// Cap how many pieces we ever embed, so one enormous file can't run up a bill.
export const MAX_CHUNKS = 400;

export function getExtension(filename: string): string {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

export function validateUpload(
  filename: string,
  size: number
): { ok: true; ext: string } | { ok: false; error: string } {
  const ext = getExtension(filename);
  if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error:
        "That file type isn't supported. Please upload a PDF, Word (.docx), or text (.txt, .md) file.",
    };
  }
  if (size > MAX_FILE_BYTES) {
    return { ok: false, error: "That file is too large. Please upload a file under 4 MB." };
  }
  if (size === 0) {
    return { ok: false, error: "That file looks empty. Please choose a different file." };
  }
  return { ok: true, ext };
}

// A very rough token count — good enough to decide "big document" messaging.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------- Chunking ----------

export type Chunk = {
  index: number;
  text: string;
  heading: string; // the nearest markdown heading above this piece, for citations
};

// Break the markdown into overlapping pieces of a manageable size, remembering
// the most recent heading so a citation can say "from the Payment Terms section."
export function chunkMarkdown(markdown: string, maxChars = 1600, overlap = 200): Chunk[] {
  const clean = markdown.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  const blocks = clean
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buffer = "";
  let heading = "";
  let bufferHeading = "";

  const flush = () => {
    const text = buffer.trim();
    if (text) chunks.push({ index: chunks.length, text, heading: bufferHeading });
    buffer = "";
  };

  for (const block of blocks) {
    const headingMatch = block.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) heading = headingMatch[1].trim();

    // A single oversized block (e.g. a giant table) gets hard-split on its own.
    if (block.length > maxChars) {
      flush();
      for (let i = 0; i < block.length; i += maxChars - overlap) {
        const slice = block.slice(i, i + maxChars).trim();
        if (slice) chunks.push({ index: chunks.length, text: slice, heading });
      }
      continue;
    }

    // Starting a fresh piece would overflow — flush, then carry a little overlap.
    if (buffer && buffer.length + block.length + 2 > maxChars) {
      const tail = buffer.slice(-overlap);
      flush();
      buffer = tail.trim();
      bufferHeading = heading;
    }
    if (!buffer) bufferHeading = heading;
    buffer += (buffer ? "\n\n" : "") + block;
  }
  flush();

  return chunks.map((chunk, index) => ({ ...chunk, index }));
}

// ---------- Embeddings (Voyage AI) ----------

type VoyageItem = { embedding: number[]; index: number };

// Turn pieces of text into embeddings. "document" for stored chunks, "query"
// for a visitor's question — Voyage uses the hint to improve matching.
export async function embedTexts(
  texts: string[],
  inputType: "document" | "query",
  apiKey: string
): Promise<number[][]> {
  const out: number[][] = [];
  const BATCH = 128; // Voyage accepts up to 128 inputs per call

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: batch, model: "voyage-3", input_type: inputType }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Voyage API error (${res.status}): ${detail.slice(0, 200)}`);
    }

    const json = (await res.json()) as { data: VoyageItem[] };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    for (const item of sorted) out.push(item.embedding);
  }

  return out;
}

// Cosine similarity — how closely two embeddings point in the same direction.
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------- Rate limiting (Upstash) ----------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // not configured (e.g. some local setups) → skip limiting
  }
  redis = Redis.fromEnv();
  return redis;
}

const limiters: Record<string, Ratelimit> = {};

// 5 uploads per hour per IP address.
export function uploadLimiter(): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  limiters.upload ??= new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "docchat:upload",
  });
  return limiters.upload;
}

// 20 questions per session (a session lasts as long as the uploaded document).
export function askLimiter(): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  limiters.ask ??= new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(20, "24 h"),
    prefix: "docchat:ask",
  });
  return limiters.ask;
}

// Best-effort visitor IP for per-IP limits.
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
