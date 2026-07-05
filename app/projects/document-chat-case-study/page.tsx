import fs from "fs";
import path from "path";
import { marked } from "marked";

export const metadata = {
  title: "Chat with your documents — Case Study — Ray Ocampo",
};

// Read the markdown case study from the project folder and turn it into HTML.
// Runs at build time, so editing the .md and redeploying updates this page.
async function getCaseStudyHtml(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "Case-Study-RAG-Document-Chat.md");
    const markdown = fs.readFileSync(filePath, "utf8");
    return await marked.parse(markdown);
  } catch {
    return "<p>The case study content could not be loaded.</p>";
  }
}

export default async function CaseStudy() {
  const html = await getCaseStudyHtml();

  return (
    <main className="landing">
      <div className="lp-wrap lp-topbar">
        <a className="lp-back" href="/projects">← All projects</a>
      </div>

      <article className="lp-wrap cs">
        <div className="cs-prose" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="cs-cta">
          <a className="lp-btn-primary" href="/projects/document-chat">
            Try the live demo
          </a>
        </div>
      </article>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          Built by Ray Ocampo. No screenshots were harmed, or used, in making this page.
        </div>
      </footer>
    </main>
  );
}
