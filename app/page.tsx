export default function Home() {
  return (
    <main className="landing">
      {/* HERO */}
      <section className="lp-wrap lp-hero">
        <div className="lp-hero-text">
          <p className="lp-eyebrow">Portfolio · Live work inside</p>
          <h1 className="lp-name">RAY OCAMPO</h1>
          <p className="lp-intro">
            I spent four years explaining technology to the people who sign the
            checks. Now I build the technology too.
          </p>
          <p className="lp-role">AI Solutions Consultant · Portland, OR</p>
          <a className="lp-btn-primary" href="/demo">
            Try the live demo
          </a>
        </div>

        <div className="lp-headshot-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lp-headshot" src="/headshot.jpg" alt="Ray Ocampo" />
        </div>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* ABOUT */}
      <section className="lp-wrap lp-section">
        <h2 className="lp-heading">The translator between the tech and the buyer</h2>
        <p className="lp-body">
          I spent four years in enterprise client success at INFUSE, coordinating
          delivery across 40-plus B2B accounts. My job was turning technical
          reality into language a client trusts, and turning a vague problem into a
          plan a team can ship. I cut client churn by 22%, held 95% retention, and
          generated over $250K in expansion revenue by spotting gaps and connecting
          the right people to close them. Before that, a decade running operations
          and public-sector programs, the process-heavy environments where
          deployments actually live or die. Now I build the AI tools myself, and I
          can explain every line of them to the person signing the check.
        </p>
        <a className="lp-btn-outline" href="/resume.pdf" download>
          Download resume (PDF)
        </a>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* WHAT'S COMING NEXT */}
      <section className="lp-wrap lp-section">
        <h2 className="lp-heading">What&apos;s coming next</h2>
        <div className="lp-cards">
          <div className="lp-card">
            <span className="lp-card-tag">RAG</span>
            <h3 className="lp-card-title">Chat with your documents</h3>
            <p className="lp-card-desc">
              Answers grounded in a company&apos;s own files, with citations.
            </p>
          </div>
          <div className="lp-card">
            <span className="lp-card-tag">Agents</span>
            <h3 className="lp-card-title">A task-running agent</h3>
            <p className="lp-card-desc">
              Takes actions across steps, not just chat.
            </p>
          </div>
          <div className="lp-card">
            <span className="lp-card-tag">Extraction</span>
            <h3 className="lp-card-title">Smart extractor</h3>
            <p className="lp-card-desc">
              Turns messy text into clean, structured data.
            </p>
          </div>
        </div>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* HOBBIES */}
      <section className="lp-wrap lp-section">
        <h2 className="lp-heading">Off the clock</h2>
        <p className="lp-body">
          I&apos;m slowly trying to eat at every restaurant in Portland, a mission
          with no realistic end date. When I&apos;m not eating, I&apos;m hiking it
          back off, and I&apos;ve gone deep enough into health and longevity to have
          opinions about sleep and zone 2 cardio. University of Oregon journalism
          grad, which explains why I can&apos;t write a sentence without editing it
          four times.
        </p>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* CURRENTLY */}
      <section className="lp-wrap lp-section">
        <p className="lp-currently">
          <span className="lp-currently-label">Currently:</span> building{" "}
          <a href="https://www.scoredthreads.com" target="_blank" rel="noopener noreferrer">
            ScoredThreads
          </a>
          , tracking price drops, and pretending my aloha shirt collection has
          room for one more.
        </p>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* CONTACT */}
      <section className="lp-wrap lp-section">
        <p className="lp-eyebrow">Contact</p>
        <div className="lp-contact">
          <a href="mailto:raybocampo@gmail.com">raybocampo@gmail.com</a>
          <span className="lp-sep">·</span>
          <a
            href="https://www.linkedin.com/in/raybocampo/"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin.com/in/raybocampo
          </a>
        </div>
      </section>

      {/* FOOTER — solid koa band for now; a wood image can drop in later */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          Built by Ray Ocampo. No screenshots were harmed, or used, in making this page.
        </div>
      </footer>
    </main>
  );
}
