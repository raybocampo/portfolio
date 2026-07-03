import { MarkItDown } from "markitdown-ts";
import { extractText, getDocumentProxy } from "unpdf";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AUTH_COOKIE, isValidToken } from "@/app/lib/auth";
import {
  MAX_CHUNKS,
  chunkMarkdown,
  embedTexts,
  estimateTokens,
  getClientIp,
  LARGE_DOC_TOKEN_THRESHOLD,
  uploadLimiter,
  validateUpload,
} from "@/app/lib/document-chat";

// Reading and embedding a large PDF can take a while — give it up to a minute.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Gate 1 — password: refuse unless the visitor is logged in.
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidToken(token)) {
    return NextResponse.json(
      { error: "Please enter the password to use this demo." },
      { status: 401 }
    );
  }

  // Gate 2 — keys must be present.
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey) {
    return NextResponse.json(
      { error: "VOYAGE_API_KEY is not set. Open .env.local and paste your key." },
      { status: 500 }
    );
  }
  if (!anthropicKey || anthropicKey === "your-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Open .env.local and paste your key." },
      { status: 500 }
    );
  }

  // Gate 3 — rate limit: 5 uploads per hour per IP.
  const limiter = uploadLimiter();
  if (limiter) {
    const { success } = await limiter.limit(getClientIp(req));
    if (!success) {
      return NextResponse.json(
        { error: "You've reached the upload limit (5 per hour). Please try again later." },
        { status: 429 }
      );
    }
  }

  // Gate 4 — read the uploaded file out of the form.
  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ error: "Invalid upload. Please try again." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  // Gate 5 — file type and size (the authoritative check; the page checks too).
  const check = validateUpload(file.name, file.size);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Turn the file into text.
  //  - PDF: unpdf, a serverless-native PDF reader (no canvas / DOMMatrix).
  //  - .txt / .md: read the bytes directly.
  //  - .docx: markitdown (Word -> markdown via mammoth, pure JS).
  let markdown = "";
  try {
    if (check.ext === ".pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      markdown = (Array.isArray(text) ? text.join("\n\n") : text).trim();
    } else if (check.ext === ".txt" || check.ext === ".md") {
      markdown = buffer.toString("utf8").trim();
    } else {
      const result = await new MarkItDown().convertBuffer(buffer, { file_extension: check.ext });
      markdown = (result?.markdown ?? "").trim();
    }
  } catch (err) {
    // Return a clean JSON error (not a 500 HTML page) so the page can show it.
    const detail = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: `We couldn't read text from that file. ${detail}`.trim() },
      { status: 422 }
    );
  }
  if (!markdown) {
    return NextResponse.json(
      { error: "We couldn't read any text from that file. It may be scanned images or empty." },
      { status: 422 }
    );
  }

  // Cut into pieces (bounded so one huge file can't run up the bill).
  const allChunks = chunkMarkdown(markdown);
  if (allChunks.length === 0) {
    return NextResponse.json(
      { error: "We couldn't find any readable text in that file." },
      { status: 422 }
    );
  }
  const capped = allChunks.length > MAX_CHUNKS;
  const chunks = capped ? allChunks.slice(0, MAX_CHUNKS) : allChunks;

  // Turn each piece into an embedding.
  let embeddings: number[][];
  try {
    embeddings = await embedTexts(
      chunks.map((c) => c.text),
      "document",
      voyageKey
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown embedding error.";
    return NextResponse.json(
      { error: `We couldn't process that document. ${message}` },
      { status: 502 }
    );
  }

  const largeDoc = capped || estimateTokens(markdown) > LARGE_DOC_TOKEN_THRESHOLD;

  // Hand everything back to the browser. The file buffer goes out of scope here
  // and is never written to disk or a database.
  return NextResponse.json({
    sessionId: crypto.randomUUID(),
    filename: file.name,
    chunks,
    embeddings,
    largeDoc,
  });
}
