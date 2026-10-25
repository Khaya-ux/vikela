import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { clockTime, dayLabel, rand } from "@/lib/format";
import { CheckIcon, ClockIcon, DemoNote } from "../../ui";

export default async function SentPage({ params }: PageProps<"/bank/sent/[id]">) {
  const { id } = await params;
  const me = await currentPersona();
  const [tx] = await sql<{ amount_cents: string; reference: string; status: string; created_at: Date; full_name: string }[]>`
    select t.amount_cents, t.reference, t.status, t.created_at, c.full_name
    from transactions t join accounts a on a.id = t.to_account_id join customers c on c.id = a.customer_id
    where t.id = ${Number(id) || 0} and t.from_account_id = ${"a_" + me.slice(2)}`;
  if (!tx) notFound();

  // A held payment looks like an ordinary delay to the sender. Telling an abuser
  // "we blocked your message" could put the recipient at risk.
  const held = tx.status === "held";
  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col items-center text-center">
        <span className={`flex size-16 items-center justify-center rounded-full ${held ? "bg-warn/12 text-warn" : "bg-ok/12 text-ok"}`}>
          {held ? <ClockIcon className="size-8" /> : <CheckIcon className="size-8" />}
        </span>
        <h1 className="mt-4 text-xl font-semibold">{held ? "Payment processing" : "Payment successful"}</h1>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{rand(tx.amount_cents)}</p>
        {held && <p className="mt-2 text-sm text-muted">Some payments take up to 24 hours to clear.</p>}
      </div>

      <dl className="divide-y divide-line rounded-2xl border border-line text-sm">
        <Detail label="To" value={tx.full_name} />
        <Detail label="Reference" value={tx.reference || "No reference"} />
        <Detail label="Date" value={`${dayLabel(tx.created_at)}, ${clockTime(tx.created_at)}`} />
        <Detail label="Status" value={held ? "Processing" : "Paid"} />
      </dl>

      <Link href="/bank" className="block rounded-2xl bg-bank px-4 py-3.5 text-center text-sm font-semibold text-bank-ink">Done</Link>

      {held && (
        <DemoNote>
          this payment was held for review. The sender is deliberately not told why.
          Next, <Link href="/" className="underline">check Lerato&rsquo;s phone</Link> or <Link href="/console" className="underline">open the bank console</Link>.
        </DemoNote>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
    </div>
  );
}
