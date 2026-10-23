import Link from "next/link";
import { switchPersona } from "./actions";

// Judge mode. Judges test alone, so the walkthrough lives in the app.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <p className="text-sm font-medium text-brand">Vikela · demo</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Abusers use bank payments to reach people who have blocked them.
      </h1>
      <p className="mt-4 text-muted">
        A R1 payment with &ldquo;I know where you are&rdquo; in the reference is delivered by every bank today.
        Vikela screens payment references in South African languages and spots economic-abuse patterns,
        then hands each case to a trained person at the bank who reaches out safely.
      </p>

      <ol className="mt-10 space-y-4">
        <Step n={1} title="Send a threatening payment as Jabu" body="Try a reference like “Ngiyazi lapho ukhona” (isiZulu: I know where you are), or anything you like.">
          <form action={switchPersona}>
            <input type="hidden" name="persona" value="c_jabu" />
            <input type="hidden" name="next" value="/bank/send?to=c_lerato" />
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink">Open Jabu&rsquo;s banking app</button>
          </form>
        </Step>
        <Step n={2} title="Check Lerato’s phone" body="The payment was held. Lerato never sees the message, and nothing on her phone gives the case away.">
          <form action={switchPersona}>
            <input type="hidden" name="persona" value="c_lerato" />
            <input type="hidden" name="next" value="/bank" />
            <button className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-medium">Open Lerato&rsquo;s banking app</button>
          </form>
        </Step>
        <Step n={3} title="Review the case as a bank analyst" body="See the translation, the risk score and why, the history between these two people, and send Lerato a discreet message.">
          <Link href="/console" className="inline-block rounded-lg border border-line bg-card px-4 py-2 text-sm font-medium">Open the bank console</Link>
        </Step>
      </ol>

      <p className="mt-10 text-sm text-muted">
        Also in the console: a salary that leaves for one person within minutes every month (no abusive words at all),
        and a joke between friends that was correctly let through.
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">How Vikela meets the judging criteria</h2>
        <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
          {CRITERIA.map((c) => (
            <div key={c.name} className="grid gap-1 p-5 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-brand">{c.name}</dt>
              <dd className="text-sm text-muted">
                {c.body}
                {c.look && <span className="mt-1.5 block text-foreground">See it: {c.look}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-xs text-muted">All people, accounts and transactions in this demo are invented.</p>
    </main>
  );
}

// One short answer per judging criterion. Facts and numbers match docs/lean-canvas.txt.
const CRITERIA: { name: string; body: string; look?: string }[] = [
  {
    name: "Product",
    body: "Works end to end, live: screen, hold, review, reach out. The need is proven: Australia’s Commonwealth Bank has blocked nearly 1 million abusive payment messages since 2020. No South African bank we found does this yet.",
    look: "steps 1 to 3 above.",
  },
  {
    name: "Creativity",
    body: "Protection that asks nothing of the victim: no app to install, no report to file. Abusive payments are held, not bounced, so the sender only sees “processing” and is never tipped off.",
    look: "what Jabu sees after sending, and what Lerato doesn’t.",
  },
  {
    name: "Usability",
    body: "Three steps for judges, one queue sorted by risk for bank staff, and nothing new for customers until someone reaches out safely in their Secure Inbox.",
    look: "the bank console.",
  },
  {
    name: "Sustainability",
    body: "Banks pay, customers never do. R300 000 for a 3-month pilot, then R0.10 per customer per month. One large bank, about 3 million customers, covers the running costs. Every bank that joins grows a South African-language abuse dataset no one else has.",
  },
  {
    name: "Impact",
    body: "24% of South African women, about 3.4 million, have experienced violence from an intimate partner, and 1 in 8 has experienced financial abuse (HSRC, 2024). Once a bank switches Vikela on, every one of its customers is covered.",
  },
  {
    name: "Presentation",
    body: "One story, seen from all three sides. Lerato blocked Jabu everywhere, so he used her bank account. You play him, her, and the bank.",
  },
  {
    name: "Intelligence",
    body: "Reads patterns, not just words. It reads threats in isiZulu, Sesotho, Afrikaans and mixed-language messages, notices when they are escalating so the case climbs the queue before the next one, and flags a salary that leaves for the same person within the hour every month, with no words at all. Every score explains itself.",
    look: "the Kagiso and Zanele case (escalating) and the Vusi and Nomsa case (salary sweep) in the console.",
  },
];

function Step({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-xl border border-line bg-card p-5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">{n}</span>
      <div className="min-w-0">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{body}</p>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}
