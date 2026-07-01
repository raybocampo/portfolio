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
      <div className="wrap gate-wrap">
        <div className="topline">
          <span className="dot" /> Portfolio · Live working demo inside
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

  const hasDraft = Boolean(draft) && !loading;
  const outputText = loading
    ? "Drafting your email…"
    : draft || "Your clean, ready-to-send draft appears here.";

  return (
    <main className="page">
      <button className="logout" onClick={handleLogout}>
        Log out
      </button>

      <header className="wrap hero">
        <div className="topline">
          <span className="dot" /> Portfolio · Live working demo inside
        </div>
        <h1 className="hero-title">
          I make AI work where it usually <span className="accent">breaks</span>: inside a real business.
        </h1>
        <p className="lede">
          Four years running enterprise accounts, plus years in public-sector
          operations. Now I build and deploy AI that survives contact with reality.
        </p>
        <p className="who">Ray Ocampo · AI Solutions Consultant · Portland, OR</p>
      </header>

      <section className="wrap intro">
        <p className="eyebrow">Live work, not screenshots</p>
        <h2 className="section-title">Built, and running right now</h2>
        <p className="blurb">
          Account managers lose hours turning a messy internal update into a clean
          client email. This tool does it in seconds. Type a situation, pick the goal,
          and a real model drafts it.
        </p>

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
                  onChange={(e) => setSituation(e.target.value)}
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

              <button
                className="run"
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

              <span className="hint">Runs on a live model. Takes a few seconds.</span>

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

      <div className="wrap">
        <div className="rule" />
      </div>

      <section className="wrap section">
        <p className="eyebrow">In progress</p>
        <h2 className="section-title">What&apos;s coming next</h2>
        <p className="blurb">
          Each one proves a broad, in-demand skill, and each ships with a written
          case study and an eval.
        </p>
        <div className="nextgrid">
          <div className="nextcard">
            <div className="tag">RAG</div>
            <h3>Chat with your documents</h3>
            <p>Answers grounded in a company&apos;s own files, with citations.</p>
          </div>
          <div className="nextcard">
            <div className="tag">Agents</div>
            <h3>A task-running agent</h3>
            <p>Takes actions across steps, not just chat.</p>
          </div>
          <div className="nextcard">
            <div className="tag">Extraction</div>
            <h3>Smart extractor</h3>
            <p>Turns messy text into clean, structured data.</p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="rule" />
      </div>

      <section className="wrap section">
        <p className="eyebrow">Who I am</p>
        <h2 className="section-title">The translator between the tech and the buyer</h2>
        <p className="about-text">
          I spent four years in enterprise client success, running 40-plus B2B
          accounts, where my job was turning technical reality into language a
          client trusts and turning a vague problem into a plan a team can ship.
          Before that, years in operations and public-sector administration, the
          complex and process-heavy environments where AI deployments actually
          live or die. I build the tools, I understand how they work, and I can
          explain them to the person signing the check.
        </p>
      </section>

      <div className="wrap">
        <div className="rule" />
      </div>

      <footer className="wrap site-footer">
        Built by Ray Ocampo. This page runs a live model, not a screenshot.
        <div className="contact">
          <a href="mailto:raybocampo@gmail.com">raybocampo@gmail.com</a>
          {" · "}
          <a href="https://www.linkedin.com/in/raybocampo/" target="_blank" rel="noopener noreferrer">
            linkedin.com/in/raybocampo
          </a>
          {" · "}
          Portland, OR
        </div>
      </footer>
    </main>
  );
}
