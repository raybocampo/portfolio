import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidToken } from "@/app/lib/auth";

const GOAL_DESCRIPTIONS: Record<string, string> = {
  apologize: "apologize sincerely for a mistake or delay",
  follow_up: "follow up professionally on something outstanding",
  decline: "decline politely while preserving the relationship",
  request: "ask clearly and professionally for something (information, payment, or approval)",
  update: "give a clear, reassuring project status update",
  complaint: "raise a concern or complaint firmly but diplomatically",
};

export async function POST(req: NextRequest) {
  // Gatekeeper: refuse unless the visitor showed a valid ticket.
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidToken(token)) {
    return NextResponse.json(
      { error: "Please enter the password to use the email drafter." },
      { status: 401 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Open .env.local and paste your key." },
      { status: 500 }
    );
  }

  let situation: string;
  let goal: string;

  try {
    const body = await req.json();
    situation = (body.situation ?? "").trim();
    goal = body.goal ?? "follow_up";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!situation) {
    return NextResponse.json({ error: "Please describe the situation first." }, { status: 400 });
  }

  const goalDescription = GOAL_DESCRIPTIONS[goal] ?? "communicate professionally";

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert business writer. Draft a professional client email based on the situation below.

Goal: ${goalDescription}

Situation (written informally — the sender is thinking out loud):
${situation}

Write only the email itself — subject line first, then a blank line, then the body. No commentary, no explanations, no preamble. Use a warm but professional tone. Keep it concise and clear.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const draft = textBlock?.type === "text" ? textBlock.text.trim() : "";

    if (!draft) {
      return NextResponse.json({ error: "Claude returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ draft });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error from Anthropic API.";
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }
}
