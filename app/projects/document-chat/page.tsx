"use client";

import { useEffect, useRef, useState } from "react";

// Keep these in step with the server; used only for a friendly early warning.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

type Chunk = { index: number; text: string; heading: string };
type Source = { n: number; heading: string; excerpt: string };
type Turn = { question: string; answer: string; sources: Source[] };

type LoadedDoc = {
  sessionId: string;
  filename: string;
  chunks: Chunk[];
  embeddings: number[][];
  largeDoc: boolean;
};

export default function DocumentChatPage() {
  // null = still checking, false = locked, true = unlocked
  const [authed, setAuthed] = useState<boolean | null>(null);

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

  return <DocChat onLogout={() => setAuthed(false)} />;
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
      <a className="backlink" href="/projects">← All projects</a>
      <div className="wrap gate-wrap">
        <div className="topline">
          <span className="dot" /> Live working demo
        </div>
        <h1 className="gate-title">Chat with your documents</h1>

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

function DocChat({ onLogout }: { onLogout: () => void }) {
  const [doc, setDoc] = useState<LoadedDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogout() {
    await fetch("/api/login", { method: "DELETE" });
    onLogout();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError("");
    setAskError("");

    // Friendly early checks (the server checks again, authoritatively).
    const lower = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setUploadError(
        "That file type isn't supported. Please upload a PDF, Word, or text file."
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("That file is too large. Please upload a file under 4 MB.");
      return;
    }

    setUploading(true);
    setDoc(null);
    setTurns([]);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/document-chat/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "We couldn't process that file. Please try another.");
        return;
      }
      setDoc({
        sessionId: data.sessionId,
        filename: data.filename,
        chunks: data.chunks,
        embeddings: data.embeddings,
        largeDoc: Boolean(data.largeDoc),
      });
    } catch {
      setUploadError("Could not reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || !doc) return;
    setAsking(true);
    setAskError("");

    try {
      const res = await fetch("/api/document-chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: doc.sessionId,
          question: q,
          chunks: doc.chunks,
          embeddings: doc.embeddings,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setTurns((prev) => [
        ...prev,
        { question: q, answer: data.answer, sources: data.sources ?? [] },
      ]);
      setQuestion("");
    } catch {
      setAskError("Could not reach the server. Check your connection and try again.");
    } finally {
      setAsking(false);
    }
  }

  function resetDoc() {
    setDoc(null);
    setTurns([]);
    setQuestion("");
    setAskError("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="page">
      <a className="backlink" href="/projects">← All projects</a>
      <button className="logout" onClick={handleLogout}>
        Log out
      </button>

      <header className="wrap hero">
        <div className="topline">
          <span className="dot" /> Live working demo
        </div>
        <h1 className="hero-title">Chat with your documents</h1>
        <p className="lede">
          Upload a document and ask questions about it. Answers come straight from the
          file, with a pointer back to the part they came from. Supports PDF, Word, and
          text files.
        </p>
      </header>

      <section className="wrap intro">
        <div className="console">
          <div className="console-bar">
            Document Chat
            <span className="live-pill">
              <span className="dot" /> Live model
            </span>
          </div>

          <div className="console-body dc-body">
            {!doc ? (
              <div className="pane">
                <input
                  ref={fileInputRef}
                  id="dc-file"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="dc-file-input"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  disabled={uploading}
                />
                <label htmlFor="dc-file" className={`dc-drop${uploading ? " is-busy" : ""}`}>
                  {uploading ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      <span className="dc-drop-title">Reading your document…</span>
                      <span className="dc-drop-sub">This can take a few seconds.</span>
                    </>
                  ) : (
                    <>
                      <span className="dc-drop-title">Choose a document</span>
                      <span className="dc-drop-sub">
                        PDF, Word, or text · up to 4&nbsp;MB
                      </span>
                    </>
                  )}
                </label>
                <p className="hint">Accepts PDF, Word, and text files up to 4 MB.</p>

                {uploadError && (
                  <div className="error-box" role="alert">
                    {uploadError}
                  </div>
                )}
              </div>
            ) : (
              <div className="pane">
                <div className="dc-docchip">
                  <span className="dc-docchip-name" title={doc.filename}>
                    {doc.filename}
                  </span>
                  <button className="dc-reset" onClick={resetDoc}>
                    Use a different file
                  </button>
                </div>

                {doc.largeDoc && (
                  <p className="dc-note">
                    This is a big document — answers will focus on the most relevant
                    sections rather than the whole file.
                  </p>
                )}

                <div className="field">
                  <label htmlFor="dc-question">Ask a question</label>
                  <textarea
                    id="dc-question"
                    rows={3}
                    placeholder="e.g. What are the payment terms? When does this contract end?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAsk();
                    }}
                  />
                </div>

                <button className="run" onClick={handleAsk} disabled={asking || !question.trim()}>
                  {asking ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Reading the document…
                    </>
                  ) : (
                    "Ask"
                  )}
                </button>
                <span className="hint">
                  Answers are drawn only from your file. Press ⌘/Ctrl + Enter to ask.
                </span>

                {askError && (
                  <div className="error-box" role="alert">
                    {askError}
                  </div>
                )}

                {turns.length > 0 && (
                  <div className="dc-transcript">
                    {[...turns].reverse().map((turn, i) => (
                      <div className="dc-turn" key={turns.length - i}>
                        <p className="dc-q">{turn.question}</p>
                        <div className="dc-a">{turn.answer}</div>
                        {turn.sources.length > 0 && (
                          <div className="dc-sources">
                            <p className="dc-sources-label">Where this came from</p>
                            {turn.sources.map((s) => (
                              <div className="dc-source" key={s.n}>
                                <span className="dc-source-tag">
                                  {s.n}
                                  {s.heading ? ` · ${s.heading}` : ""}
                                </span>
                                <span className="dc-source-text">{s.excerpt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
