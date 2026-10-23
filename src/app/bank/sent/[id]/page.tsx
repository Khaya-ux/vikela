import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { rand } from "@/lib/format";

export default async function SentPage({ params }: PageProps<"/bank/sent/[id]">) {
  const { id } = await params;
  const me = await currentPersona();
  const [tx] = await sql<{ amount_cents: string; status: string; full_name: string }[]>`
    select t.amount_cents, t.status, c.full_name
    from transactions t join accounts a on a.id = t.to_account_id join customers c on c.id = a.customer_id
    where t.id = ${Number(id) || 0} and t.from_account_id = ${"a_" + me.slice(2)}`;
  if (!tx) notFound();

  // A held payment looks like an ordinary delay to the sender. Telling an abuser
  // "we blocked your message" could put the recipient at risk.
  const held = tx.status === "held";
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className={`flex size-14 items-center justify-center rounded-full text-2xl ${held ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"}`}>
        {held ? "…" : "✓"}
      </div>
      <h1 className="mt-4 text-xl font-semibold">{held ? "Payment processing" : "Payment sent"}</h1>
      <p className="mt-2 text-sm text-muted">
        {rand(tx.amount_cents)} to {tx.full_name}.
        {held ? " Some payments take up to 24 hours to clear." : ""}
      </p>
      <Link href="/bank" className="mt-8 rounded-xl border border-line px-5 py-2.5 text-sm font-medium">Done</Link>
      {held && (
        <p className="mt-10 rounded-lg border border-dashed border-line p-3 text-left text-xs text-muted">
          <strong className="text-foreground">Demo note:</strong> this payment was held for review. The sender is deliberately not told why.
          Next, <Link href="/" className="underline">check Lerato&rsquo;s phone</Link> or <Link href="/console" className="underline">open the bank console</Link>.
        </p>
      )}
    </div>
  );
}
