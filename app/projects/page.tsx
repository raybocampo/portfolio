import { COMING_SOON } from "@/app/lib/projects";

export const metadata = {
  title: "Projects · Ray Ocampo",
};

export default function Projects() {
  return (
    <main className="landing">
      <div className="lp-wrap lp-topbar">
        <a className="lp-back" href="/">← Back to home</a>
      </div>

      <section className="lp-wrap lp-page-head">
        <p className="lp-eyebrow">Projects</p>
        <h1 className="lp-page-title">Things I&apos;ve built</h1>
        <p className="lp-intro">
          Real, working tools I designed, built, and shipped end to end.
        </p>
      </section>

      <section className="lp-wrap lp-section">
        <div className="proj-list">
          {/* Featured, live project */}
          <article className="proj-card proj-card-featured">
            <p className="proj-status proj-live">Live · Built</p>
            <h2 className="proj-title">Client Email Drafter</h2>
            <p className="proj-desc">
              Turns a messy internal update into a polished, ready-to-send client
              email in seconds, running on a real model, with the
              client-communication rules I learned over four years in enterprise
              client success baked in.
            </p>
            <div className="proj-actions">
              <a className="lp-btn-primary" href="/demo">
                Try the live demo
              </a>
              <a className="lp-textlink" href="/projects/email-drafter">
                Read the full case study →
              </a>
            </div>
          </article>

          {/* Featured, live project */}
          <article className="proj-card proj-card-featured">
            <p className="proj-status proj-live">Live · Built</p>
            <h2 className="proj-title">Chat with your documents</h2>
            <p className="proj-desc">
              Upload a PDF, Word, or text file and ask questions about it. Answers
              are grounded in the file itself, with a pointer back to the section
              each one came from.
            </p>
            <div className="proj-actions">
              <a className="lp-btn-primary" href="/projects/document-chat">
                Try the live demo
              </a>
              <a className="lp-textlink" href="/projects/document-chat-case-study">
                Read the full case study →
              </a>
            </div>
          </article>

          {/* Coming soon */}
          {COMING_SOON.map((p) => (
            <article className="proj-card" key={p.tag}>
              <p className="proj-status proj-soon">Coming soon</p>
              <span className="lp-card-tag">{p.tag}</span>
              <h2 className="proj-title proj-title-sm">{p.title}</h2>
              <p className="proj-desc">{p.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          Built by Ray Ocampo. No screenshots were harmed, or used, in making this page.
        </div>
      </footer>
    </main>
  );
}
