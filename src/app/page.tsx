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
      <p className="mt-2 text-xs text-muted">All people, accounts and transactions in this demo are invented.</p>
    </main>
  );
}

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
