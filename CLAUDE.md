@AGENTS.md

# Vikela: notes for Claude Code

Khaya's solo entry for the FNB App of the Year Hackathon 2026 (problem statement: "Safer communities and gender-based violence response"). Read `docs/HANDOFF.md` first: it has the status, deadlines, decisions and what to do next.

## Rules for this repo

- **No Claude attribution.** No `Co-Authored-By: Claude` trailer in commits and no "Generated with Claude Code" line in PRs. Khaya asked for this.
- **Personal accounts only.** Commit as `Khaya-ux` with `186346430+Khaya-ux@users.noreply.github.com`, set in this repo's local git config (a fresh clone needs it set again). The global git and `gh` identity on Khaya's machines is the Omniado work account, so check `gh auth status` shows Khaya-ux active before pushing. Never use Omniado's GitHub org, Supabase projects or Vercel team.
- **No em dashes** in any text, code comments or docs.
- **Synthetic data only.** Every person, account and transaction is invented. Never add real customer data.
- Write plain, readable text for anything judges will read. Short beats complete.

## Stack and commands

Next.js 16.4 (App Router; `cacheComponents` is deliberately OFF), plain Postgres via the `postgres` driver (works locally and on Supabase), Tailwind 4, `@anthropic-ai/sdk` for the classifier.

```bash
npm install
cp .env.example .env.local   # set DATABASE_URL; DATABASE_SSL=disable for a local Postgres
npm run db:reset             # drops, recreates and seeds everything (db/schema.sql + scripts/seed.ts)
npm run dev
npm run typecheck && npm run lint && npm run build   # run all three before committing
```

`ANTHROPIC_API_KEY` is optional. Without it the classifier uses rules only (`src/lib/rules.ts`).

## Where things are

| Part | Path |
|---|---|
| Judge-mode guide (home page) | `src/app/page.tsx` |
| Mock bank app (Jabu sends, Lerato receives) | `src/app/bank` |
| Analyst console | `src/app/console` |
| Server actions (send payment, outreach, close case, switch persona) | `src/app/actions.ts` |
| Classifier: model + rules floor + number redaction | `src/lib/classify.ts`, `src/lib/rules.ts` |
| Cases, risk score, salary-sweep and payment-messaging detectors | `src/lib/cases.ts` (no runtime imports, so the seed script can use it) |
| Schema and seed (4 planted stories) | `db/schema.sql`, `scripts/seed.ts` |
| SSDLC (full, and plain text for the Sonke boxes) | `docs/SSDLC.md`, `docs/SSDLC-form.txt` |
| Lean Canvas (plain text for the Sonke boxes) | `docs/lean-canvas.txt` |
