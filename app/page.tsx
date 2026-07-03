import { Hibiscus } from "./Hibiscus";
import { COMING_SOON } from "./lib/projects";

export default function Home() {
  return (
    <main className="landing">
      {/* HERO */}
      <section className="lp-wrap lp-hero">
        <div className="lp-hero-text">
          <p className="lp-eyebrow">
            Portfolio <Hibiscus className="lp-hibiscus-sep" /> Live work inside
          </p>
          <h1 className="lp-name">RAY OCAMPO</h1>
          <p className="lp-intro">
            I spent four years explaining technology to the people who sign the
            checks. Now I build the technology too.
          </p>
          <p className="lp-role">AI Solutions Consultant · Portland, OR</p>
          <p className="lp-hero-links">
            <a className="lp-textlink" href="/projects">View all projects →</a>
          </p>
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
          delivery across 40-plus B2B accounts. My job was translating technical
          reality into language a client trusts, then turning a vague problem into
          a plan a team could ship. I cut client churn by 22%, held 95% retention,
          and generated over $250K in expansion revenue by spotting gaps and
          connecting the right people to close them. That was the job. Before that,
          a decade running operations and public-sector programs, the process-heavy
          environments where deployments actually live or die. Now I build the AI
          tools myself, and I can explain every line of them to the person signing
          the check.
        </p>
        <a className="lp-btn-outline" href="/resume.pdf" download>
          Download resume (PDF)
        </a>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* SECTION 1: LIVE AND RUNNING */}
      <section className="lp-wrap lp-section">
        <h2 className="lp-heading">Live and running</h2>
        <div className="lp-live-cards">
          {/* Card A: Client Email Drafter */}
          <article className="lp-live-card">
            <div className="lp-live-head">
              <span className="lp-card-tag">Prompting</span>
              <span className="lp-live-label">Live</span>
            </div>
            <h3 className="lp-card-title">Client Email Drafter</h3>
            <p className="lp-card-desc">
              Turns a messy client situation into a polished, ready-to-send email.
              Now asks a few clarifying questions first.
            </p>
            <div className="lp-live-actions">
              <a className="lp-btn-green" href="/demo">Try the live demo</a>
              <a className="lp-textlink" href="/projects/email-drafter">
                Read the case study →
              </a>
            </div>
          </article>

          {/* Card B: Chat with your documents */}
          <article className="lp-live-card">
            <div className="lp-live-head">
              <span className="lp-card-tag">RAG</span>
              <span className="lp-live-label">Live</span>
            </div>
            <h3 className="lp-card-title">Chat with your documents</h3>
            <p className="lp-card-desc">
              Answers grounded in your own uploaded files, with citations.
            </p>
            <div className="lp-live-actions">
              <a className="lp-btn-green" href="/projects/document-chat">
                Try the live demo
              </a>
            </div>
          </article>
        </div>
      </section>

      <div className="lp-wrap">
        <div className="lp-divider" />
      </div>

      {/* SECTION 2: WHAT'S COMING NEXT */}
      <section className="lp-wrap lp-section">
        <h2 className="lp-heading">What&apos;s coming next</h2>
        <div className="lp-next-cards">
          {COMING_SOON.map((item) => (
            <article className="lp-next-card" key={item.tag}>
              <div className="lp-next-head">
                <span className="lp-card-tag">{item.tag}</span>
                <span className="lp-next-label">Coming next</span>
              </div>
              <h3 className="lp-card-title">{item.title}</h3>
              <p className="lp-card-desc">{item.desc}</p>
            </article>
          ))}
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
          <Hibiscus className="lp-hibiscus" />
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
          <Hibiscus className="lp-hibiscus-sep" />
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lp-footer-palms" src="/palms.svg" alt="" aria-hidden="true" />
        <div className="lp-wrap lp-footer-inner">
          Built by Ray Ocampo. No screenshots were harmed, or used, in making this page.
        </div>
      </footer>
    </main>
  );
}
