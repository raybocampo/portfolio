import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidToken } from "@/app/lib/auth";
import { askLimiter, cosineSim, embedTexts, type Chunk } from "@/app/lib/document-chat";

export const runtime = "nodejs";

// How many of the most relevant pieces we send to the model per question.
const TOP_K = 6;

export async function POST(req: NextRequest) {
  // Gate 1 — password.
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidToken(token)) {
    return NextResponse.json(
      { error: "Please enter the password to use this demo." },
      { status: 401 }
    );
  }

  // Gate 2 — keys.
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey || !anthropicKey || anthropicKey === "your-key-here") {
    return NextResponse.json(
      { error: "The demo is missing an API key. Check .env.local." },
      { status: 500 }
    );
  }

  // Gate 3 — read the request. The browser sends the question plus the pieces
  // and embeddings it has been holding for this document.
  let question: string;
  let sessionId: string;
  let chunks: Chunk[];
  let embeddings: number[][];
  try {
    const body = await req.json();
    question = (body.question ?? "").trim();
    sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    chunks = Array.isArray(body.chunks) ? body.chunks : [];
    embeddings = Array.isArray(body.embeddings) ? body.embeddings : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "Please type a question first." }, { status: 400 });
  }
  if (!sessionId || chunks.length === 0 || chunks.length !== embeddings.length) {
    return NextResponse.json(
      { error: "Please upload a document before asking a question." },
      { status: 400 }
    );
  }

  // Gate 4 — rate limit: 20 questions per session.
  const limiter = askLimiter();
  if (limiter) {
    const { success } = await limiter.limit(`session:${sessionId}`);
    if (!success) {
      return NextResponse.json(
        { error: "You've reached the question limit for this document (20). Upload it again to continue." },
        { status: 429 }
      );
    }
  }

  // Embed the question, then find the pieces that match it most closely.
  let queryEmbedding: number[];
  try {
    const [embedding] = await embedTexts([question], "query", voyageKey);
    queryEmbedding = embedding;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown embedding error.";
    return NextResponse.json({ error: `We couldn't process that question. ${message}` }, { status: 502 });
  }

  const ranked = chunks
    .map((chunk, i) => ({ chunk, score: cosineSim(queryEmbedding, embeddings[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  // Only the most relevant pieces go to the model — never the whole document.
  const context = ranked
    .map((r, i) => {
      const where = r.chunk.heading ? ` — from "${r.chunk.heading}"` : "";
      return `[Source ${i + 1}]${where}\n${r.chunk.text}`;
    })
    .join("\n\n---\n\n");

  const client = new Anthropic({ apiKey: anthropicKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are answering a question about a document the user uploaded. Use ONLY the numbered sources below. If the answer is not in them, say you could not find it in the document — do not use outside knowledge.

When you use information from a source, cite it inline with its number in square brackets, like [1] or [2].

Sources:
${context}

Question: ${question}

Answer clearly and concisely, citing the sources you used.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const answer = textBlock?.type === "text" ? textBlock.text.trim() : "";
    if (!answer) {
      return NextResponse.json(
        { error: "The model returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // Report back only the sources the answer actually cited, with a short
    // excerpt and where in the document it came from.
    const citedNumbers = new Set(
      Array.from(answer.matchAll(/\[(\d+)\]/g)).map((m) => Number(m[1]))
    );
    const sources = ranked
      .map((r, i) => ({ n: i + 1, heading: r.chunk.heading, excerpt: r.chunk.text }))
      .filter((s) => citedNumbers.has(s.n))
      .map((s) => ({
        n: s.n,
        heading: s.heading,
        excerpt: s.excerpt.length > 260 ? `${s.excerpt.slice(0, 260).trim()}…` : s.excerpt,
      }));

    return NextResponse.json({ answer, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error from the model.";
    return NextResponse.json({ error: `Model error: ${message}` }, { status: 502 });
  }
}
