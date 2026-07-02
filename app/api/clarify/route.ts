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
  // Safety net 1 — password gate: refuse unless the visitor showed a valid ticket.
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidToken(token)) {
    return NextResponse.json(
      { error: "Please enter the password to use the email drafter." },
      { status: 401 }
    );
  }

  // Safety net 2 — key check.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Open .env.local and paste your key." },
      { status: 500 }
    );
  }

  // Safety net 3 — request-body check.
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

  // Safety net 4 — try/catch around the model call.
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You help account managers write client emails. Read the situation and the email's goal, then decide what you would most need to know to write a noticeably better email.

Return UP TO 3 short clarifying questions — only ones that would meaningfully improve the email (for example: the client's current mood, whether there is a hard deadline, or the history of the relationship). Ask fewer if fewer matter. If the situation is already clear enough to write a strong email, return an empty list.

Respond with ONLY valid JSON, no other text, in exactly this shape:
{"questions": ["first question", "second question"]}

Goal: ${goalDescription}

Situation:
${situation}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    // Parse defensively: pull out the JSON object and read its questions.
    let questions: string[] = [];
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions
          .filter((q: unknown): q is string => typeof q === "string" && q.trim().length > 0)
          .map((q: string) => q.trim())
          .slice(0, 3); // hard cap of 3, never more
      }
    } catch {
      questions = []; // unparseable → no questions, the app will draft directly
    }

    return NextResponse.json({ questions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error from Anthropic API.";
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }
}
