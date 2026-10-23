import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { CATEGORY_NAMES, LANGUAGE_NAMES, rand, when } from "@/lib/format";
import { PATTERN_LABELS } from "@/lib/cases";
import { closeCase, sendOutreach } from "@/app/actions";
import { AutoRefresh } from "../../auto-refresh";
import { RiskBadge, STATUS_NAMES } from "../../risk";

const OUTREACH_TEMPLATE = `Hi, this is the Ubuntu Bank care team. We noticed some payments to your account that may have upset you, and we have held them.

If you would like to talk, reply here or call our care line at any time. You can also reach the GBV Command Centre on 0800 428 428, free, 24 hours.

You don't need to do anything. This message is only visible inside the app.`;

export default async function CaseDetail({ params }: PageProps<"/console/cases/[id]">) {
  const { id } = await params;
  const caseId = Number(id) || 0;

  const [c] = await sql<{ id: number; risk_score: number; status: string; summary: string; opened_at: Date; sender: string; recipient: string; sender_id: string; recipient_id: string }[]>`
    select c.*, s.full_name as sender, r.full_name as recipient, s.id as sender_id, r.id as recipient_id
    from cases c join customers s on s.id = c.sender_customer_id join customers r on r.id = c.recipient_customer_id
    where c.id = ${caseId}`;
  if (!c) notFound();

  const events = await sql<{ id: number; kind: string; severity: number | null; category: string | null; language: string | null; translation: string | null; rationale: string | null; detector: string | null; actor: string; created_at: Date; reference: string | null; amount_cents: string | null; tx_status: string | null }[]>`
    select e.*, t.reference, t.amount_cents, t.status as tx_status
    from case_events e left join transactions t on t.id = e.transaction_id
    where e.case_id = ${caseId}
    order by e.created_at desc`;

  const flags = events.filter((e) => e.kind === "reference_flag" && e.severity !== null).reverse();
  const closed = c.status.startsWith("closed");

  return (
    <div>
      <AutoRefresh seconds={5} />
      <Link href="/console" className="text-sm text-muted underline underline-offset-2">← Case queue</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.sender} → {c.recipient}</h1>
          <p className="mt-1 text-sm text-muted">Case #{c.id} · opened {when(c.opened_at)} · {STATUS_NAMES[c.status]}</p>
        </div>
        <RiskBadge score={c.risk_score} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="text-sm font-medium text-muted">Why this score</h2>
            <p className="mt-1">{c.summary}.</p>
            {flags.length > 1 && <SeverityTrend points={flags.map((f) => ({ severity: f.severity!, at: f.created_at }))} />}
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted">Timeline</h2>
            <ol className="mt-2 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="rounded-xl border border-line bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>{eventLabel(e)}</span>
                    <span>{when(e.created_at)}</span>
                  </div>
                  {e.reference !== null && (
                    <div className="mt-2">
                      <p className="font-medium">&ldquo;{e.reference}&rdquo;</p>
                      {e.translation && <p className="text-sm text-muted">Translation: {e.translation}</p>}
                      <p className="mt-1 text-xs text-muted">
                        {rand(e.amount_cents!)} · {e.tx_status === "held" ? "held, not delivered" : "delivered"}
                        {e.language && ` · ${LANGUAGE_NAMES[e.language] ?? e.language}`}
                        {e.detector && ` · by ${e.detector === "llm" ? "model" : e.detector}`}
                      </p>
                    </div>
                  )}
                  {e.rationale && <p className="mt-2 text-sm">{e.rationale}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-semibold">Reach out safely</h2>
            <p className="mt-1 text-sm text-muted">
              Goes to {c.recipient.split(" ")[0]}&rsquo;s Secure Inbox only. No SMS, no push notification, nothing on the lock screen.
            </p>
            <form action={sendOutreach} className="mt-3 space-y-3">
              <input type="hidden" name="caseId" value={c.id} />
              <textarea name="body" rows={9} defaultValue={OUTREACH_TEMPLATE} className="w-full rounded-lg border border-line bg-background p-3 text-sm" />
              <button disabled={closed} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-ink disabled:opacity-50">Send discreet message</button>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-semibold">Not a concern?</h2>
            <form action={closeCase} className="mt-3 space-y-3">
              <input type="hidden" name="caseId" value={c.id} />
              <input name="note" placeholder="Reason, e.g. friends joking" className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm" />
              <button disabled={closed} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-50">Close with no action</button>
            </form>
          </section>

          <p className="text-xs text-muted">
            A person decides every action. Vikela never contacts customers, freezes accounts or reports anyone automatically.
          </p>
        </aside>
      </div>
    </div>
  );
}

function eventLabel(e: { kind: string; severity: number | null; category: string | null; detector: string | null; actor: string }) {
  switch (e.kind) {
    case "reference_flag":
      return `Payment reference · severity ${e.severity}/5 · ${CATEGORY_NAMES[e.category ?? "none"] ?? e.category}`;
    case "pattern_hit":
      return `Pattern · ${PATTERN_LABELS[e.detector ?? ""] ?? e.detector}`;
    case "outreach":
      return "Analyst · message sent";
    case "status_change":
      return "Analyst · status changed";
    default:
      return "Analyst · note";
  }
}

// Bars for each flagged reference, oldest to newest, so escalation is visible at a glance.
function SeverityTrend({ points }: { points: { severity: number; at: Date }[] }) {
  return (
    <figure className="mt-4">
      <div className="flex h-20 items-end gap-1.5" role="img" aria-label={`Severity over time: ${points.map((p) => p.severity).join(", ")}`}>
        {points.map((p, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full max-w-10 rounded-t ${p.severity >= 4 ? "bg-danger" : p.severity >= 3 ? "bg-warn" : "bg-muted/40"}`}
              style={{ height: `${(p.severity / 5) * 64 + 4}px` }}
            />
          </div>
        ))}
      </div>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>{when(points[0].at)}</span>
        <span>Severity of each flagged reference</span>
        <span>{when(points[points.length - 1].at)}</span>
      </figcaption>
    </figure>
  );
}
