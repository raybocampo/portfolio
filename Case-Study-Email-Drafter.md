# Case study: the Client Email Drafter

**TL;DR.** Account managers lose real time turning a messy internal update into a clean client email that lands right. I built a live tool that does it in seconds, running on a real model, with the client-communication rules I learned over four years in enterprise client success baked in. It works, it is built to fail gracefully, and I can explain every line of it.

Try it live on this site. Password is on the demo page.

---

## The problem

I spent four years in enterprise client success at INFUSE, running 40-plus B2B accounts. A big, quiet part of that job is writing delicate emails. Telling a client a campaign slipped. Asking for one more week without sounding like you are making excuses. Pushing back on a bad request while keeping the relationship warm.

These emails are slow to write and high-stakes. A good one buys you trust and time. A bad one, too apologetic, too vague, too full of "just circling back," costs you both. Most account managers rewrite the same kinds of emails over and over, starting from a blank page and a knot in their stomach every time.

The tool solves that specific pain: turn a messy situation into a polished, ready-to-send client email in seconds, written on the rules that actually work.

## What it does

You type the messy situation in plain language. For example: "Campaign for the client is two weeks behind because the integration team flagged a targeting issue. Client is anxious. I need to tell them, keep them calm, and ask for one more week."

You pick the goal of the email from a short list: deliver a delay, ask for something, follow up after silence, push back, decline gracefully, or share good news.

A real model then drafts the email, following a set of communication rules, and returns something you can send.

## The judgment behind it

Any model can write an email badly. The value here is the rules it follows, which come from what actually lands with clients:

- Lead, do not apologize. Open with the point, never "just checking in" or "sorry for the delay."
- Be specific and confident. Replace "I think" with "my recommendation is." Replace "I'll try" with "I'll deliver by Thursday."
- When you ask for something, reduce the pressure with freedom-of-choice language. "It is completely up to you" gets a yes more often than a hard ask.
- Cut the weak filler. No "touch base," no "circle back," no "no-brainer." State the next step instead.
- End with the clear next step or the exact thing you need.

That is domain knowledge encoded into a prompt. It is the difference between a generic email generator and a tool that writes the way a strong account manager writes.

## How it is built

The stack is deliberately simple and current: a Next.js app, the Claude API for the model, deployed on Vercel, on my own domain through GoDaddy.

The one build decision worth calling out: the model call runs on the server, not in the browser. The file that talks to the model sits in the app's API layer, so my API key never reaches the client. Anyone can open the page source and find nothing sensitive. That single choice is the difference between a safe app and a key leak, and it is the first thing a technical reviewer checks.

## Built to fail gracefully

I assume things break, and I decide in advance how the app behaves when they do. The tool has four safety nets, each catching a specific failure and returning a readable message instead of a crash:

1. A password gate, so strangers and bots cannot run the tool and burn API credits. This protects the wallet.
2. A key check, so a missing key returns a clear message instead of a confusing error.
3. A request check, so an empty or malformed submission gets a helpful prompt instead of sending garbage to the model.
4. A try/catch around the model call, so a dropped connection, a timeout, or an out-of-credits moment shows the real reason instead of a broken page.

The pattern is the same across all four: check one thing, and when it fails, say something useful and stop. That is the gap between a demo that works once in a controlled room and something a business can actually put in front of users. Industry research backs this up. An MIT NANDA study found that 95 percent of enterprise AI projects fail, and a large share of that is exactly this kind of fragility, tools that fall apart the moment a real person does something unexpected.

## The honest limits

This is a strong demo, not a production system, and I would rather name the gap than oversell it. For real scale I would add:

- Retries, so a single failed call tries again before giving up.
- Rate limiting, so one user cannot hammer the API.
- Logging, so I can see what broke and how often.
- Evals, so I can measure output quality repeatedly instead of trusting one good result.

Those are on my build roadmap, not hand-waved away. Knowing the ceiling is part of the job, not just knowing the floor.

## What this demonstrates

I built and shipped a working AI tool end to end: the model call, the interface, the reliability, the deployment, the domain. I understand every piece well enough to explain it in plain English, and I made the security and failure-handling decisions myself. Most important, I built the right thing, because I lived the problem it solves.

That is the whole pitch. I can turn a real business pain into a working tool, build it so it does not fall over, and explain it to the person signing the check.
