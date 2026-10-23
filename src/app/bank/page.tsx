import Link from "next/link";
import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { rand, when } from "@/lib/format";

export default async function BankHome() {
  const me = await currentPersona();
  const account = "a_" + me.slice(2);

  const [{ balance_cents }] = await sql<{ balance_cents: string }[]>`select balance_cents from accounts where id = ${account}`;
  const [{ unread }] = await sql<{ unread: number }[]>`
    select count(*)::int as unread from outreach_messages where customer_id = ${me} and read_at is null`;

  // Held incoming payments are invisible to the recipient. The sender sees their own as "processing".
  const rows = await sql<{ id: number; amount_cents: string; reference: string; status: string; created_at: Date; incoming: boolean; other: string | null }[]>`
    select t.id, t.amount_cents, t.reference, t.status, t.created_at,
           t.to_account_id = ${account} as incoming,
           c.full_name as other
    from transactions t
    left join accounts oa on oa.id = case when t.to_account_id = ${account} then t.from_account_id else t.to_account_id end
    left join customers c on c.id = oa.customer_id
    where (t.to_account_id = ${account} and t.status in ('posted', 'released'))
       or t.from_account_id = ${account}
    order by t.created_at desc
    limit 12`;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-muted">Cheque account</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{rand(balance_cents)}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/bank/send" className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-medium text-brand-ink">Pay someone</Link>
        <Link href="/bank/inbox" className="relative rounded-xl border border-line px-4 py-3 text-center text-sm font-medium">
          Secure Inbox
          {unread > 0 && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand" aria-label={`${unread} unread`} />}
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted">Recent activity</h2>
        <ul className="mt-2 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.other ?? (r.incoming ? "Salary" : "Payment")}</p>
                <p className="truncate text-xs text-muted">
                  {r.reference || "No reference"} · {when(r.created_at)}
                  {!r.incoming && r.status === "held" && <span className="text-warn"> · Processing</span>}
                </p>
              </div>
              <span className={`shrink-0 text-sm tabular-nums ${r.incoming ? "text-ok" : ""}`}>
                {r.incoming ? "+" : "−"}{rand(r.amount_cents)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
