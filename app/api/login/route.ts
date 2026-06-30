import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken, isCorrectPassword, isValidToken } from "@/app/lib/auth";

// Settings for the ticket cookie. "httpOnly" hides it from page code,
// "secure" sends it only over HTTPS once deployed, and it lasts 7 days.
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// POST = someone is trying to log in with a password.
export async function POST(req: NextRequest) {
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: "No password is set on the server. Open .env.local and set APP_PASSWORD." },
      { status: 500 }
    );
  }

  let password = "";
  try {
    const body = await req.json();
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isCorrectPassword(password)) {
    return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
  }

  // Correct password — hand the browser a sealed ticket.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, expectedToken(), COOKIE_OPTIONS);
  return res;
}

// GET = the page asking "is this visitor already logged in?"
export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return NextResponse.json({ authenticated: isValidToken(token) });
}

// DELETE = log out, by erasing the ticket.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
