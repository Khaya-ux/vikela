# Handoff: where Vikela stands

Last updated: Friday 23 October 2026, evening. Written so work can continue on another machine in a fresh Claude Code session.

## The idea in one line

Abusers use bank payments to reach people who have blocked them everywhere else (R1 with "I know where you are" in the reference). Vikela is a module a bank plugs in: it screens payment references in South African languages, holds abusive ones before delivery without tipping off the sender, detects economic abuse with no words (salary swept to one person within the hour), and hands every case to a person at the bank who reaches out safely through the in-app Secure Inbox.

Proof it's real: Australia's Commonwealth Bank built this (English only) and has blocked nearly 1 million abusive payment messages since 2020. We found no South African bank doing it. FNB sponsors and judges the hackathon, and FNB is exactly the kind of bank that would buy it.

## Hackathon rules that matter

- Runs Fri 23 Oct 12:45 to **final submission Mon 26 Oct 23:59**. No mentors on Monday.
- **No live presentations.** Judges test the app alone using the deck and a demo login, so the app must guide them (it does: the home page is a 3-step judge guide).
- Web apps must be **hosted live** and process data in real time. No static sites or mock-ups.
- Final submission: deck (user journey story, technical architecture, demo account link and login), Git repo link, Lean Business Canvas, SSDLC.
- Judging: 7 criteria at 10 points each: Product, Creativity, Usability, Sustainability, Impact, Presentation, Intelligence. Nothing says "realistic", but market need, traction and path to revenue are judged.
- The programme PDF was on the old machine at `Desktop/wallpaper/FNB AOTY Hackathon 2026 - Programme.pdf`. Sonke is the hackathon platform.

## Deadlines

| When | What | Status |
|---|---|---|
| Fri 20:00 | Team profile on Sonke | Done |
| Sat 12:00 | SSDLC on Sonke | **Done** (submitted early) |
| Fri and Sat 23:00 to 00:00 | Progress update on Sonke (needed for the progress gates) | Fri: check. Sat: to do |
| Sat 12:00 (PDF also says 13:30) | 20-second HustleWindow pitch video | To do |
| Sun 12:00 | Lean Business Canvas on Sonke | Drafted in `docs/lean-canvas.txt`, not submitted |
| Mon 23:59 | Final submission | To do |

## What's built (all verified in a browser locally)

- Mock bank app: Jabu sends Lerato a payment. An abusive reference is held; Jabu sees "Payment processing"; Lerato sees nothing.
- Analyst console: live case queue (refreshes every 3 s), case page with translation, explainable risk score, severity trend, timeline, "send discreet message" and "close with no action".
- Secure Inbox in the bank app receives the outreach.
- Detectors: abusive reference (model plus rules floor), tiny payments used as messages, salary sweep, escalation.
- Seed: 58 customers, about 820 transactions, 4 stories (Jabu to Lerato, live demo pair; Kagiso to Zanele, escalating R1 payments, risk 100; Vusi to Nomsa, salary sweep; Ayanda to Neo, a joke correctly closed with no action).
- Security tests run and passed (see `docs/SSDLC.md`): SQL injection, script injection, prompt injection, negative amount, number redaction, sender and recipient privacy, dependency scan.

## What's NOT done, in priority order

1. **Analyst sign-in, role check on every console action, and an audit log.** Biggest open risk in the SSDLC. Currently anyone with the link can open the console, and personas are switched with an unsigned cookie.
2. **Deploy.** Khaya creates a personal Supabase project and Vercel account (Khaya-ux, never Omniado). Then: run `db/schema.sql` and the seed against Supabase (`DATABASE_SSL` unset so SSL is required; use the pooler URL; `prepare: false` is already set), set env vars in Vercel, make sure `/console` stays dynamic.
3. **Add `ANTHROPIC_API_KEY`** and test the classifier on real phrases. Model is `claude-opus-5-5` at effort `low` with structured output and `fallbacks: "default"`.
4. **Native-speaker phrases.** Khaya is asking isiZulu, Sesotho and Afrikaans speakers for about 10 threatening references and 10 harmless joking ones each. Use them to replace the seed rules in `src/lib/rules.ts` (currently unverified) and as a test set. Then update the Lean Canvas traction line.
5. Friendly validation errors on the send form (a bad amount currently shows a generic error page).
6. Make the GitHub repo **public** before final submission (it's private now). Consider removing this handoff file first.
7. Deck: user journey (Lerato's story), architecture diagram, demo logins, business case.

## Decisions already made (don't re-litigate)

- Bank-side detection, not a survivor app (survivor apps and NGO case tools already exist; the field will be flooded).
- Hold, never block or reverse. A person decides every action.
- Fictional bank name "Ubuntu Bank". Never FNB branding.
- **Framing for production:** the stack (Next.js, Vercel, Supabase) is a hackathon prototype. In production, rules and a small in-house classifier screen every payment inside the bank; only flagged payments go to an LLM, for translation and the analyst's explanation. Pitch line: "The LLM is how we got multilingual detection working in a weekend. In production it becomes the analyst's assistant."
- Pricing in the canvas: R300 000 3-month pilot, R0.10 per active customer per month, R500 000 setup. Costs about R300 000 a month. Break-even about 3 million customers.
- Keep everything judges read short and plain. Khaya prefers readable over complete.

## HustleWindow video (20 s, "sell to passengers at a traffic light", not a demo)

Recommended, YC-style (say what it is first):

> Vikela stops abusers from using bank payments to send threats.
> When she blocks him everywhere, he sends her R1 with "I know where you are" in the reference. The bank delivers it.
> We catch those messages, in South African languages, before they arrive.
> Australia's biggest bank has blocked a million of them. Here, they still get through.

Emotional alternative:

> Thandi blocked him. His number. His WhatsApp. Everything.
> Then her phone buzzes. One rand. Reference: "I know where you are."
> (2-second pause)
> Her bank delivered it.
> Vikela stops that message before she ever sees it. In isiZulu, Sesotho, Afrikaans and English.
> Because some messages should never arrive.

Delivery: hook in the first 3 seconds, no "Hi, my name is", slow down on "I know where you are", add subtitles, no tech words, no graphic content.

## Use the weekend like a founder

FNB is the customer, not just the judge. In mentor calls ask: does FNB see abusive payment references today, and who owns customer vulnerability or financial crime? Ask for one introduction. Write down every reaction (it's traction for the canvas). Follow up on Monday.

## Setting up on a new machine

1. `gh auth login` as Khaya-ux, then `gh repo clone Khaya-ux/vikela`.
2. In the clone: `git config user.name "Khaya-ux"` and `git config user.email "186346430+Khaya-ux@users.noreply.github.com"`.
3. Install Node 24 and Postgres (or use the Supabase database directly), then follow the commands in `CLAUDE.md`.
