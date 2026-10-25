import Link from "next/link";
import { sql } from "@/lib/db";
import { LANGUAGE_NAMES, when } from "@/lib/format";
import { isEscalating, PATTERN_SHORT } from "@/lib/cases";
import { AutoRefresh } from "./auto-refresh";
import { RiskScore, RiskStripe, StatusPill } from "./risk";

type QueueCase = {
  id: number; risk_score: number; status: string; updated_at: Date; sender: string; recipient: string; signals: number;
  severities: number[]; patterns: string[]; reference: string | null; translation: string | null; language: string | null;
};

const VIEWS = { open: "Open", closed: "Closed", all: "All" } as const;
type View = keyof typeof VIEWS;

export default async function CaseQueue({ searchParams }: PageProps<"/console">) {
  const { view: requested } = await searchParams;
  const view: View = requested === "closed" || requested === "all" ? requested : "open";

  // Each row carries what an analyst needs to triage without opening it: the latest reference,
  // the severity of every flag in order, and which money patterns fired.
  const [cases, [{ held }]] = await Promise.all([
    sql<QueueCase[]>`
      select c.id, c.risk_score, c.status, c.updated_at,
             s.full_name as sender, r.full_name as recipient,
             (select count(*)::int from case_events e where e.case_id = c.id and e.kind in ('reference_flag', 'pattern_hit')) as signals,
             array(select e.severity from case_events e where e.case_id = c.id and e.kind = 'reference_flag' and e.severity is not null order by e.created_at) as severities,
             array(select distinct e.detector from case_events e where e.case_id = c.id and e.kind = 'pattern_hit') as patterns,
             latest.reference, latest.translation, latest.language
      from cases c
      join customers s on s.id = c.sender_customer_id
      join customers r on r.id = c.recipient_customer_id
      left join lateral (
        select t.reference, e.translation, e.language
        from case_events e join transactions t on t.id = e.transaction_id
        where e.case_id = c.id and e.kind = 'reference_flag'
        order by e.created_at desc limit 1
      ) latest on true
      order by (c.status like 'closed%'), c.risk_score desc, c.updated_at desc`,
    sql<{ held: number }[]>`select count(*)::int as held from transactions where status = 'held'`,
  ]);

  const isClosed = (c: QueueCase) => c.status.startsWith("closed");
  const open = cases.filter((c) => !isClosed(c));
  const counts: Record<View, number> = { open: open.length, closed: cases.length - open.length, all: cases.length };
  const shown = view === "all" ? cases : cases.filter((c) => isClosed(c) === (view === "closed"));

  return (
    <div>
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Case queue</h1>
          <p className="mt-1 text-sm text-muted">Highest risk first. New cases appear on their own.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/12 px-2.5 py-1 text-xs font-medium text-ok">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-ok" />
          </span>
          Live
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open cases" value={open.length} />
        <Stat label="High risk" value={open.filter((c) => c.risk_score >= 70).length} tone="text-danger" />
        <Stat label="Payments held" value={held} note="never delivered" />
        <Stat label="Customers contacted" value={cases.filter((c) => c.status === "outreach_sent").length} note="in the app only" />
      </dl>

      <nav className="mt-6 flex gap-1 border-b border-line">
        {(Object.keys(VIEWS) as View[]).map((key) => (
          <Link
            key={key}
            href={key === "open" ? "/console" : `/console?view=${key}`}
            aria-current={view === key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${view === key ? "border-brand text-foreground" : "border-transparent text-muted"}`}
          >
            {VIEWS[key]} <span className="ml-1 text-xs tabular-nums text-muted">{counts[key]}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          {view === "closed" ? "No closed cases yet." : "No open cases. New ones appear here as soon as a payment is flagged."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
          {shown.map((c) => (
            <li key={c.id}>
              <Link href={`/console/cases/${c.id}`} className={`relative flex gap-4 p-4 pl-5 hover:bg-background ${isClosed(c) ? "opacity-60" : ""}`}>
                <RiskStripe score={c.risk_score} />
                <RiskScore score={c.risk_score} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="font-medium">{c.sender} <span className="text-muted">→</span> {c.recipient}</p>
                    <StatusPill status={c.status} />
                  </div>
                  {c.reference !== null ? (
                    <p className="mt-1 truncate text-sm">
                      &ldquo;{c.reference}&rdquo;
                      {c.translation && <span className="text-muted"> · {c.translation}</span>}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">No abusive words. Flagged by a money pattern alone.</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {isEscalating(c.severities) && <Chip tone="danger">Escalating</Chip>}
                    {c.patterns.map((p) => <Chip key={p}>{PATTERN_SHORT[p] ?? p}</Chip>)}
                    {c.language && c.language !== "en" && <Chip>{LANGUAGE_NAMES[c.language] ?? c.language}</Chip>}
                    <span className="text-xs text-muted">{c.signals} signal{c.signals === 1 ? "" : "s"} · updated {when(c.updated_at)}</span>
                  </div>
                </div>
                <Trend severities={c.severities} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, note, tone = "" }: { label: string; value: number; note?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</dd>
      {note && <dd className="text-xs text-muted">{note}</dd>}
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "danger" }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone === "danger" ? "bg-danger/12 text-danger" : "bg-card text-foreground ring-1 ring-line"}`}>
      {children}
    </span>
  );
}

// The last few flags, oldest to newest, same colours as the trend on the case page.
// With fewer than two flags there is no trend, but the column keeps its width so rows line up.
function Trend({ severities }: { severities: number[] }) {
  if (severities.length < 2) return <div className="hidden w-24 shrink-0 sm:block" />;
  const recent = severities.slice(-8);
  return (
    <div className="hidden w-24 shrink-0 flex-col items-end justify-center gap-1 sm:flex">
      <div className="flex h-8 items-end gap-0.5" role="img" aria-label={`Severity of recent references: ${recent.join(", ")} out of 5`}>
        {recent.map((s, i) => (
          <span key={i} className={`w-2 rounded-sm ${s >= 4 ? "bg-danger" : s >= 3 ? "bg-warn" : "bg-muted/40"}`} style={{ height: `${(s / 5) * 28 + 4}px` }} />
        ))}
      </div>
      <span className="text-[11px] text-muted">Severity trend</span>
    </div>
  );
}
