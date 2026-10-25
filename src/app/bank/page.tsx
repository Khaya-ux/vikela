import Link from "next/link";
import { sql } from "@/lib/db";
import { currentPersona, PERSONAS } from "@/lib/persona";
import { activityGroup, activityStamp, greeting, rand } from "@/lib/format";
import { Avatar, LockIcon, PayIcon, SalaryIcon } from "./ui";

type Row = { id: number; amount_cents: string; reference: string; status: string; created_at: Date; incoming: boolean; other: string | null };

export default async function BankHome() {
  const me = await currentPersona();
  const account = "a_" + me.slice(2);

  const [{ balance_cents, account_no }] = await sql<{ balance_cents: string; account_no: string }[]>`
    select balance_cents, account_no from accounts where id = ${account}`;
  const [{ unread }] = await sql<{ unread: number }[]>`
    select count(*)::int as unread from outreach_messages where customer_id = ${me} and read_at is null`;

  // Held incoming payments are invisible to the recipient. The sender sees their own as "processing".
  const rows = await sql<Row[]>`
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

  const days: { label: string; rows: Row[] }[] = [];
  for (const r of rows) {
    const label = activityGroup(r.created_at);
    if (days.at(-1)?.label !== label) days.push({ label, rows: [] });
    days.at(-1)!.rows.push(r);
  }

  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold tracking-tight">{greeting()}, {PERSONAS[me].name.split(" ")[0]}</p>

      <section className="rounded-3xl bg-linear-to-br from-bank-card-from to-bank-card-to p-5 text-white shadow-lg shadow-bank/20">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Cheque account</span>
          <span className="tabular-nums opacity-75">•••• {account_no.slice(-4)}</span>
        </div>
        <p className="mt-6 text-xs opacity-75">Available balance</p>
        <p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">{rand(balance_cents)}</p>
      </section>

      {unread > 0 && (
        <Link href="/bank/inbox" className="flex items-center gap-3 rounded-2xl bg-bank-soft p-4 text-sm">
          <LockIcon className="size-5 shrink-0 text-bank" />
          <span className="flex-1">You have {unread === 1 ? "a new message" : `${unread} new messages`} in your Secure Inbox</span>
          <span className="font-medium text-bank">Open</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <QuickAction href="/bank/send" label="Pay someone" icon={<PayIcon className="size-5" />} />
        <QuickAction href="/bank/inbox" label="Secure Inbox" icon={<LockIcon className="size-5" />} dot={unread > 0} />
      </div>

      <section>
        <h2 className="font-semibold">Recent transactions</h2>
        {days.map((d) => (
          <div key={d.label} className="mt-4">
            <h3 className="text-xs font-medium text-muted">{d.label}</h3>
            <ul className="mt-1 divide-y divide-line">
              {d.rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  {r.other ? (
                    <Avatar name={r.other} />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bank-soft text-bank"><SalaryIcon className="size-5" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.other ?? (r.incoming ? "Salary" : "Payment")}</p>
                    <p className="truncate text-xs text-muted">{r.reference || "No reference"} · {activityStamp(r.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-medium tabular-nums ${r.incoming ? "text-ok" : ""}`}>
                      {r.incoming ? "+" : "−"}{rand(r.amount_cents)}
                    </p>
                    {!r.incoming && r.status === "held" && (
                      <span className="mt-0.5 inline-block rounded-full bg-warn/12 px-2 py-0.5 text-[11px] font-medium text-warn">Processing</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function QuickAction({ href, label, icon, dot }: { href: string; label: string; icon: React.ReactNode; dot?: boolean }) {
  return (
    <Link href={href} className="relative flex flex-col items-center gap-2 rounded-2xl border border-line p-4 text-sm font-medium">
      <span className="flex size-10 items-center justify-center rounded-full bg-bank text-bank-ink">{icon}</span>
      {label}
      {dot && <span className="absolute right-3 top-3 size-2.5 rounded-full bg-bank-accent" aria-label="Unread messages" />}
    </Link>
  );
}
