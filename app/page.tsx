"use client";

import { useState, useEffect } from "react";

const GOALS = [
  { value: "apologize", label: "Apologize for a mistake or delay" },
  { value: "follow_up", label: "Follow up on something outstanding" },
  { value: "decline", label: "Decline politely" },
  { value: "request", label: "Ask for something (info, payment, approval)" },
  { value: "update", label: "Give a project status update" },
  { value: "complaint", label: "Raise a concern or complaint" },
];

export default function Home() {
  // null = still checking with the server, false = locked, true = unlocked
  const [authed, setAuthed] = useState<boolean | null>(null);

  // When the page first loads, ask the server: is this visitor logged in?
  useEffect(() => {
    fetch("/api/login")
      .then((res) => res.json())
      .then((data) => setAuthed(Boolean(data.authenticated)))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <main className="page">
        <p className="checking">Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return <LoginGate onUnlock={() => setAuthed(true)} />;
  }

  return <Drafter onLogout={() => setAuthed(false)} />;
}

function LoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not log in. Please try again.");
        return;
      }
      onUnlock();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Client Email Drafter</h1>
        <p>A portfolio demo by Ray. Enter the password to try it out.</p>
      </header>

      <form className="card gate" onSubmit={handleLogin}>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter the demo password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        <button className="btn" type="submit" disabled={loading || !password.trim()}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Checking…
            </>
          ) : (
            "Enter"
          )}
        </button>

        {error && (
          <div className="error-box" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <p className="demo-hint">
          Demo password: <code>hire-ray</code>
        </p>
      </form>
    </main>
  );
}

function Drafter({ onLogout }: { onLogout: () => void }) {
  const [situation, setSituation] = useState("");
  const [goal, setGoal] = useState(GOALS[0].value);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleDraft() {
    if (!situation.trim()) return;
    setLoading(true);
    setError("");
    setDraft("");

    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, goal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDraft(data.draft);
    } catch {
      setError("Could not reach the server. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/login", { method: "DELETE" });
    onLogout();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const goalLabel = GOALS.find((g) => g.value === goal)?.label ?? "";

  return (
    <main className="page">
      <button className="logout" onClick={handleLogout}>
        Log out
      </button>

      <header className="header">
        <h1>Client Email Drafter</h1>
        <p>
          Describe your situation in plain language — even if it&apos;s messy —
          and get a polished, ready-to-send email in seconds.
        </p>
      </header>

      <div className="card">
        <div className="field">
          <label htmlFor="situation">What&apos;s going on?</label>
          <textarea
            id="situation"
            placeholder="e.g. The client is asking why the invoice is higher than quoted. We added extra hours they didn't approve. I need to explain it without sounding defensive…"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={5}
          />
          <span className="hint">Write as if you&apos;re venting to a colleague. The messier, the better.</span>
        </div>

        <div className="field">
          <label htmlFor="goal">What does this email need to do?</label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn"
          onClick={handleDraft}
          disabled={loading || !situation.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Drafting…
            </>
          ) : (
            "Draft the email"
          )}
        </button>

        {error && (
          <div className="error-box" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {draft && (
        <div className="result">
          <p className="result-label">Your draft · {goalLabel}</p>
          <div className="result-card">{draft}</div>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      )}
    </main>
  );
}
