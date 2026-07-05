# Case study: Chat with your documents (RAG)

**TL;DR.** Upload a document, ask questions, get answers pulled straight from the file with a pointer back to where they came from. If the answer is not in the document, the tool says so instead of inventing one. It runs live on this site. The most distinctive choice: nothing is stored. Your document lives in your browser for one session and is gone when you close the tab. No database, no disk, no retention.

Try it live on this site. Password is on the demo page.

---

## The problem

The number one reason enterprises do not trust AI is that it makes things up. Ask a plain model about your contract and it will answer from memory, confidently inventing a clause that was never there. For a business, a plausible wrong answer is worse than no answer, because someone acts on it.

I saw the trust version of this problem for four years in client success. Clients do not want a confident guess. They want an answer they can verify against the source. RAG, retrieval-augmented generation, is the pattern that delivers exactly that: the model answers only from the actual document, and it shows its work.

Industry data backs the stakes. An MIT NANDA study found that 95 percent of enterprise AI projects fail, and a large share of that is trust and reliability, tools that sound right but cannot be checked. Grounding an answer in a named source, with a pointer back to it, is how you cross that gap.

## What it does

You upload a PDF, Word, or text file, up to 4MB. You ask a question in plain language. The tool returns an answer drawn from the file, with a pointer back to the part it came from. Ask something the document does not cover, and it tells you it could not find the answer rather than guessing.

## How it works

Six steps, from raw file to cited answer. This is the technical section. A non-technical reader can skim it and lose nothing from the story above.

1. **Extract the text.** PDFs go through `unpdf`, Word files through `markitdown-ts` (which converts to markdown), and plain text and markdown are read as-is.
2. **Chunk it.** The text is split into pieces by a paragraph-aware packer, not blind fixed-size slicing. It breaks the text on blank lines, then fills a buffer with whole paragraphs until adding the next one would pass about 1,600 characters, roughly 400 tokens. Each chunk carries about 200 characters of overlap from the one before it, and stores the nearest markdown heading above it for context. A single oversized block, like a giant table, gets hard-split into 1,600-character slices with the same overlap. The whole document is capped at 400 chunks.
3. **Embed it.** Each chunk becomes a vector using Voyage AI's `voyage-3` model, called directly over HTTPS, no SDK. Stored chunks are embedded with the hint `input_type: "document"`, and the question later uses `input_type: "query"`, because Voyage uses that distinction to match questions to passages more accurately. Worth naming plainly: Anthropic has no embedding model, so Claude writes the final answer, but Voyage does all the vectorizing.
4. **Store it, and this is the unusual part.** There is no database and no disk. The upload returns the chunks and their vectors straight to your browser, which holds them in memory for that one session and sends them back with each question. Close the tab and they are gone.
5. **Retrieve.** For each question, the query is embedded, every chunk is scored by cosine similarity in a plain brute-force scan, and the top 6 are taken. At 400 chunks or fewer, brute-force is fast enough that an index would be overkill.
6. **Generate with citations.** The answer is written by `claude-sonnet-4-6`. The 6 retrieved chunks are numbered `[Source 1]` through `[Source 6]`, each with its heading when one exists, and the prompt instructs Claude to answer only from those sources and to cite inline as `[1]`, `[2]`. The pointer back to the source is then rebuilt after the answer is written: the code scans the finished answer for `[n]` markers, keeps only the chunks that were actually cited, and returns each one as its heading plus a short excerpt, capped at about 260 characters. So a citation resolves to the exact passage the model drew from, not a page number.

## The decisions that mattered

Anyone can follow a RAG tutorial. The judgment shows in the choices, so here are the real ones.

**Nothing is stored.** The document never touches a database or a disk. It lives in your browser for one session and disappears when you close the tab. That is a deliberate privacy-first design: there is no data-retention liability, nothing to leak, and nothing to delete later. The honest tradeoff is that it does not persist across sessions and you re-upload each time. For a demo where trust and privacy are the whole point, that tradeoff is the right one. For a production tool serving the same documents to many users, I would add a real vector store, covered in limits below.

**Paragraph-aware chunking, not fixed-size.** Slicing every 1,600 characters blindly would cut sentences and ideas in half, and half an idea retrieves badly. Packing whole paragraphs keeps ideas intact. The 200-character overlap means a fact that lands on a chunk boundary still shows up complete in at least one chunk. Storing the nearest heading gives each chunk a breadcrumb of where it sits in the document.

**Grounding enforced by the prompt, not just retrieval.** The tool always sends the 6 closest chunks, with no score threshold, even when the best match is weak. The guardrail against a confident off-topic answer is not a cutoff, it is the instruction: answer only from these sources, and if the answer is not here, say so. That is an honest description of how it works, a prompt-level safeguard rather than a hard filter, and it is exactly the kind of tradeoff worth naming in a room full of engineers.

**Citations resolve to the exact passage, not a page number.** Claude cites its sources inline as it writes, `[1]`, `[2]`. After the answer is finished, the code scans it for those markers, keeps only the chunks that were actually cited, and returns each as the real text excerpt the model used. So clicking a citation shows you the precise passage the answer came from, which is a stronger form of "show your work" than a page reference you still have to go hunting through. It also means a source only appears if it genuinely contributed to the answer.

**The 4MB upload cap.** That is not arbitrary. It is the practical ceiling for a request on Vercel's serverless platform, which caps request bodies at 4.5MB. I set the limit just under it so a large file fails politely at the door instead of crashing mid-request.

## Built to fail gracefully

Same philosophy as everything else I ship: assume it breaks, decide in advance how it behaves.

- A password gate sits in front, so strangers and bots cannot burn API credits.
- Each stage, extraction, embedding, retrieval, handles its own failure and returns a readable message instead of a crash.
- The "not in the document" case is handled on purpose. When the answer is not in the file, the tool says so. That is the single most important failure mode for a grounding tool, because the whole promise is that it will not make things up.

## The honest limits

This is a strong demo, not a production system, and naming the gap is more useful than pretending it is not there. For real scale I would add:

- **A real vector store**, such as pgvector or Pinecone, for persistence across sessions and to go past 400 chunks. Brute-force cosine similarity is fine at this size and would crawl at 100,000 chunks.
- **Reranking and a score threshold**, so low-relevance chunks get dropped instead of always sending 6.
- **Evals**, a fixed set of question and answer pairs to measure retrieval quality and answer faithfulness repeatedly, instead of trusting one good demo.
- **Bigger files and multi-document search**, so it can reason across a whole folder, not one file at a time.
- **Better section labels for PDFs.** Citations show a named section only when the extracted text has real markdown headings. Word and markdown files usually do, plain PDFs often do not, so most PDF citations show the excerpt without a section name. The excerpt still points to the exact passage, but the named-section label is hit or miss on PDFs.

These are on the roadmap, not waved away. Knowing the ceiling is part of the job.

## What it demonstrates

I built and shipped a full RAG pipeline end to end: text extraction across three file types, paragraph-aware chunking, real embeddings, similarity retrieval, and grounded generation with citations. I made a deliberate privacy-first architecture choice and I can defend the tradeoff. I know where it would break at scale and what I would add to fix it.

That is the pitch for the roles I want. I can turn "the model cannot be trusted" into a working tool that answers only from the source and shows its work, and I can explain every decision to the person deciding whether to buy it.
