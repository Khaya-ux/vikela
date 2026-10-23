# Vikela

Abuse detection for South African banks. Built for the FNB App of the Year Hackathon 2026, "Safer communities and gender-based violence response".

Abusers use payment references to reach people who have blocked them everywhere else: a R1 payment with "I know where you are" in the reference gets delivered today. Vikela:

- **Screens payment references** in English, isiZulu, Sesotho, Afrikaans and code-switched text, and holds abusive ones before they reach the recipient. The sender only sees "processing".
- **Spots economic-abuse patterns** with no words involved, such as a salary swept to one person within the hour every month, or tiny payments used as a messaging channel.
- **Hands every case to a person** at the bank, with a risk score that explains itself, the full history between the two people, and a way to reach the customer through the in-app Secure Inbox only (no SMS, no push).

All people, accounts and transactions are synthetic.

## Run locally

Needs Node 24 and Postgres.

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL
npm run db:reset             # creates tables and seeds the demo data
npm run dev
```

Without `ANTHROPIC_API_KEY` the classifier runs on the built-in rules only. With a key, a Claude model classifies each reference and the rules act as a floor and a fallback.

## How it fits together

| Part | Where |
|---|---|
| Demo guide (judge mode) | `src/app/page.tsx` |
| Mock banking app | `src/app/bank` |
| Analyst console | `src/app/console` |
| Reference classifier (model + rules) | `src/lib/classify.ts`, `src/lib/rules.ts` |
| Cases, risk score, pattern detectors | `src/lib/cases.ts` |
| Schema and seed | `db/schema.sql`, `scripts/seed.ts` |

## Security notes (work in progress)

- Payment references are attacker-controlled text. They go to the model wrapped as data, with structured output only and no tools, so an injected instruction can't change what the system does.
- Long digit runs (account, card and phone numbers) are redacted before any text leaves the system.
- The sender is never told a payment was held, so the system can't tip off an abuser.
- A person makes every decision. Nothing contacts customers, freezes accounts or reports anyone automatically.
- **Not done yet:** real sign-in for the console and the bank app (the demo uses persona switching), row-level security, and an access audit log.
