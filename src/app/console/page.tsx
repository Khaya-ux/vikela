import Link from "next/link";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { when } from "@/lib/format";
import { AutoRefresh } from "./auto-refresh";
import { RiskBadge, STATUS_NAMES } from "./risk";

export default async function CaseQueue() {
  // No cookies or params here, so tell Next this page must render per request.
  await connection();
  const cases = await sql<{ id: number; risk_score: number; status: string; summary: string; updated_at: Date; sender: string; recipient: string; flags: number }[]>`
    select c.id, c.risk_score, c.status, c.summary, c.updated_at,
           s.full_name as sender, r.full_name as recipient,
           (select count(*)::int from case_events e where e.case_id = c.id and e.kind in ('reference_flag', 'pattern_hit')) as flags
    from cases c
    join customers s on s.id = c.sender_customer_id
    join customers r on r.id = c.recipient_customer_id
    order by (c.status like 'closed%'), c.risk_score desc, c.updated_at desc`;

  const open = cases.filter((c) => !c.status.startsWith("closed")).length;

  return (
    <div>
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Case queue</h1>
          <p className="mt-1 text-sm text-muted">{open} open · highest risk first · updates live</p>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
        {cases.map((c) => (
          <li key={c.id}>
            <Link href={`/console/cases/${c.id}`} className={`flex flex-col gap-2 px-4 py-4 hover:bg-background sm:flex-row sm:items-center sm:gap-4 ${c.status.startsWith("closed") ? "opacity-60" : ""}`}>
              <div className="w-28 shrink-0"><RiskBadge score={c.risk_score} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.sender} → {c.recipient}</p>
                <p className="truncate text-sm text-muted">{c.summary}</p>
              </div>
              <div className="shrink-0 text-sm text-muted sm:text-right">
                <p>{STATUS_NAMES[c.status]}</p>
                <p className="text-xs">{c.flags} signal{c.flags === 1 ? "" : "s"} · {when(c.updated_at)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
