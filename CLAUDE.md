# CLAUDE.md

Guidance for this repo. Global rules (communication, verification, file safety, coding standards) live in `~/.claude/CLAUDE.md` and are not repeated here.

## What this is

Ray's personal portfolio. Next.js (App Router), deployed on Vercel. Live at https://www.rayocampo.com. GitHub `raybocampo/portfolio`, auto-deploys on push to `main`.

## Structure

- `/` - public landing (headshot, intro, About, "What's coming next" cards, Hobbies, Currently, Contact).
- `/demo` - the Client Email Drafter, behind a shared password gate. Demo password `hire-ray` is shown on the login screen on purpose. It is not a secret.
- `/projects` - project list (live + coming-soon cards).
- `/projects/email-drafter` - case study. Renders `Case-Study-Email-Drafter.md` (repo root) at build time via `marked`. To update the case study, edit that .md and push.

## Design system

Scoped under `.landing` in `globals.css`: cream bg `#F5EFE3`, ink `#2A2018`, Anton headings, Inter body, koa brown `#6E4522` and hibiscus red `#BE3A34` accents, deep green `#1E2A22` primary buttons. The `/demo` drafter keeps its own warm-paper/dark-console theme (Bricolage + IBM Plex). Do not mix the two.

## Secrets

`ANTHROPIC_API_KEY` and `APP_PASSWORD` live only in `.env.local` (git-ignored) and Vercel env vars. The Claude call is server-side only, in `app/api/draft-email/route.ts`. Never commit the key.

## Gotchas

- Vercel "Deployment Protection -> Vercel Authentication (Require Log In)" must be OFF, or the public site redirects everyone to a Vercel login. On the free plan only fully-off works for `.vercel.app` URLs.
- Large pushes (the 4.3MB headshot) needed `git config http.postBuffer 524288000` locally.
- Do not commit `.claude/` or `design-reference.html.html`.
