import crypto from "crypto";

// The name of the cookie (the "ticket") we store in the visitor's browser.
export const AUTH_COOKIE = "portfolio_auth";

// Builds the one valid ticket, derived from your secret password.
// Because it's a one-way HMAC, nobody can produce this value without
// knowing APP_PASSWORD — so the ticket can't be forged.
export function expectedToken(): string {
  const password = process.env.APP_PASSWORD ?? "";
  return crypto.createHmac("sha256", password).update("logged-in").digest("hex");
}

// Compares two strings without leaking timing information.
// Returns false safely if either side is missing or a different length.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Is the ticket the browser showed us the genuine one?
export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  return safeEqual(token, expectedToken());
}

// Is the typed password the correct one?
export function isCorrectPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD ?? "";
  if (!password) return false;
  return safeEqual(input, password);
}
