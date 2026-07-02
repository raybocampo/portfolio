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

export default function DemoPage() {
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
      <a className="backlink" href="/">← Back to site</a>
      <div className="wrap gate-wrap">
        <div className="topline">
          <span className="dot" /> Live working demo
        </div>
        <h1 className="gate-title">Client Email Drafter</h1>

        <form className="gatecard" onSubmit={handleLogin}>
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

          <button className="run" type="submit" disabled={loading || !password.trim()}>
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
              {error}
            </div>
          )}

          <p className="demo-hint">
            Demo password: <code>hire-ray</code>
          </p>
        </form>
      </div>
    </main>
  );
}

function Drafter({ onLogout }: { onLogout: () => void }) {
  const [situation, setSituation] = useState("");
  const [goal, setGoal] = useState(GOALS[0].value);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [phase, setPhase] = useState<"input" | "questions">("input");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Step 1: ask the model for up to 3 clarifying questions.
  // If none come back — or anything fails — fall straight through to drafting.
  async function handleStart() {
    if (!situation.trim()) return;
    setLoading(true);
    setLoadingLabel("Thinking of a few questions…");
    setError("");
    setDraft("");

    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, goal }),
      });

      if (res.ok) {
        const data = await res.json();
        const qs: string[] = Array.isArray(data.questions)
          ? data.questions.slice(0, 3)
          : [];
        if (qs.length > 0) {
          setQuestions(qs);
          setAnswers(qs.map(() => ""));
          setPhase("questions");
          setLoading(false);
          setLoadingLabel("");
          return;
        }
      }
      // No questions, or the clarify call failed → draft directly.
      await doDraft([]);
    } catch {
      // Clarify unreachable → draft directly.
      await doDraft([]);
    }
  }

  // Step 2: draft the email, folding in any answers the user gave.
  async function doDraft(currentAnswers: string[]) {
    setLoading(true);
    setLoadingLabel("Drafting your email…");
    setError("");
    setDraft("");

    const payloadAnswers = questions.map((q, i) => ({
      question: q,
      answer: currentAnswers[i] ?? "",
    }));

    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, goal, answers: payloadAnswers }),
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
      setLoadingLabel("");
    }
  }

  // Changing the situation after questions appear restarts the flow.
  function handleSituationChange(value: string) {
    setSituation(value);
    if (phase === "questions") {
      setPhase("input");
      setQuestions([]);
      setAnswers([]);
    }
  }

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
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

  const hasDraft = Boolean(draft) && !loading;
  const outputText = loading
    ? loadingLabel || "Working…"
    : draft || "Your clean draft shows up here. Feed me the mess first.";

  return (
    <main className="page">
      <a className="backlink" href="/">← Back to site</a>
      <button className="logout" onClick={handleLogout}>
        Log out
      </button>

      <header className="wrap hero">
        <div className="topline">
          <span className="dot" /> Live working demo
        </div>
        <h1 className="hero-title">Client Email Drafter</h1>
        <p className="lede">
          Account managers lose hours turning a messy internal update into a clean
          client email. This tool does it in seconds. Type a situation, pick the goal,
          and a real model drafts it.
        </p>
      </header>

      <section className="wrap intro">
        <div className="console">
          <div className="console-bar">
            Client Email Drafter
            <span className="live-pill">
              <span className="dot" /> Live model
            </span>
          </div>

          <div className="console-body">
            <div className="pane input">
              <div className="field">
                <label htmlFor="situation">The messy situation</label>
                <textarea
                  id="situation"
                  placeholder="e.g. The client is asking why the invoice is higher than quoted. We added extra hours they didn't approve. I need to explain it without sounding defensive…"
                  value={situation}
                  onChange={(e) => handleSituationChange(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="field">
                <label htmlFor="goal">Goal of the email</label>
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

              {phase === "questions" && (
                <div className="clarify">
                  <p className="clarify-lead">
                    A few quick questions to sharpen the draft — answer what helps,
                    skip the rest.
                  </p>
                  {questions.map((q, i) => (
                    <div className="field" key={i}>
                      <label htmlFor={`clarify-${i}`}>{q}</label>
                      <input
                        id={`clarify-${i}`}
                        type="text"
                        value={answers[i] ?? ""}
                        onChange={(e) => setAnswer(i, e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                className="run"
                onClick={phase === "questions" ? () => doDraft(answers) : handleStart}
                disabled={loading || !situation.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    {loadingLabel || "Working…"}
                  </>
                ) : (
                  "Draft the email"
                )}
              </button>

              <span className="hint">Runs on a real model, not a screenshot. Give it a few seconds to think.</span>

              {error && (
                <div className="error-box" role="alert">
                  {error}
                </div>
              )}
            </div>

            <div className="pane output-pane">
              <label>Drafted email</label>
              <div className={hasDraft ? "output" : "output placeholder"}>
                {outputText}
              </div>
              {hasDraft && (
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? "Copied" : "Copy to clipboard"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
