// Case logic and pattern detectors. Takes the sql client as an argument and imports
// nothing at runtime, so the seed script can reuse it outside Next.
import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

export type CaseEventInput = {
  kind: "reference_flag" | "pattern_hit" | "analyst_note" | "outreach" | "status_change";
  transactionId?: number | null;
  severity?: number | null;
  category?: string | null;
  language?: string | null;
  translation?: string | null;
  rationale?: string | null;
  detector?: string | null;
  actor?: string;
  createdAt?: Date;
};

export async function upsertCase(sql: Sql, senderId: string, recipientId: string): Promise<number> {
  const [row] = await sql<{ id: number }[]>`
    insert into cases (sender_customer_id, recipient_customer_id)
    values (${senderId}, ${recipientId})
    on conflict (sender_customer_id, recipient_customer_id)
      do update set updated_at = now(),
        status = case when cases.status like 'closed%' then 'open' else cases.status end
    returning id`;
  return Number(row.id);
}

export async function addEvent(sql: Sql, caseId: number, e: CaseEventInput) {
  await sql`
    insert into case_events (case_id, transaction_id, kind, severity, category, language, translation, rationale, detector, actor, created_at)
    values (${caseId}, ${e.transactionId ?? null}, ${e.kind}, ${e.severity ?? null}, ${e.category ?? null}, ${e.language ?? null},
            ${e.translation ?? null}, ${e.rationale ?? null}, ${e.detector ?? null}, ${e.actor ?? "system"}, ${e.createdAt ?? new Date()})`;
}

// A salary sweep carries more weight on its own because it has no words to flag.
const PATTERN_WEIGHTS: Record<string, number> = { "pattern:salary_sweep": 40, "pattern:payment_messaging": 15 };
export const PATTERN_LABELS: Record<string, string> = {
  "pattern:salary_sweep": "salary swept to one person within the hour",
  "pattern:payment_messaging": "tiny payments used as a messaging channel",
};

// Explainable score: every point comes from something an analyst can see on the timeline.
export async function recomputeRisk(sql: Sql, caseId: number) {
  const flags = await sql<{ severity: number; created_at: Date }[]>`
    select severity, created_at from case_events
    where case_id = ${caseId} and kind = 'reference_flag' and severity is not null
    order by created_at`;
  const patternRows = await sql<{ detector: string }[]>`
    select distinct detector from case_events where case_id = ${caseId} and kind = 'pattern_hit'`;
  const patterns = patternRows.map((p) => p.detector);

  const maxSeverity = Math.max(0, ...flags.map((f) => f.severity));
  const since = Date.now() - 30 * 24 * 3600 * 1000;
  const recentFlags = flags.filter((f) => f.severity >= 3 && f.created_at.getTime() > since).length;
  const escalating = isEscalating(flags.map((f) => f.severity));

  const patternPoints = patterns.reduce((sum, d) => sum + (PATTERN_WEIGHTS[d] ?? 15), 0);
  const score = Math.min(100, maxSeverity * 12 + Math.min(recentFlags, 5) * 5 + patternPoints + (escalating ? 10 : 0));

  const parts: string[] = [];
  if (maxSeverity > 0) parts.push(`highest reference severity ${maxSeverity}/5`);
  if (recentFlags > 1) parts.push(`${recentFlags} serious references in 30 days`);
  if (escalating) parts.push("severity is escalating");
  for (const d of patterns) parts.push(PATTERN_LABELS[d] ?? d);
  const summary = parts.length ? parts.join(", ") : "no strong signals yet";

  await sql`update cases set risk_score = ${score}, summary = ${summary}, updated_at = now() where id = ${caseId}`;
  return { score, summary };
}

// Escalating = the later half of the flags averages at least one level higher than the earlier half.
export function isEscalating(severities: number[]) {
  if (severities.length < 3) return false;
  const mid = Math.floor(severities.length / 2);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return avg(severities.slice(mid)) - avg(severities.slice(0, mid)) >= 1;
}

// Pattern: small payments used as a messaging channel. Three or more payments under R10
// with a reference, to the same person, in 14 days.
export async function detectPaymentMessaging(sql: Sql, senderId: string, recipientId: string, caseId: number) {
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from transactions t
    join accounts fa on fa.id = t.from_account_id
    join accounts ta on ta.id = t.to_account_id
    where fa.customer_id = ${senderId} and ta.customer_id = ${recipientId}
      and t.amount_cents < 1000 and length(trim(t.reference)) > 0
      and t.created_at > now() - interval '14 days'`;
  if (n < 3) return false;

  const [{ recent }] = await sql<{ recent: number }[]>`
    select count(*)::int as recent from case_events
    where case_id = ${caseId} and detector = 'pattern:payment_messaging' and created_at > now() - interval '1 day'`;
  if (recent > 0) return false;

  await addEvent(sql, caseId, {
    kind: "pattern_hit",
    detector: "pattern:payment_messaging",
    severity: 3,
    category: "coercion_control",
    rationale: `${n} payments under R10 with a message in the last 14 days. Tiny payments like this are a known way to reach someone who has blocked every other channel.`,
  });
  return true;
}

// Pattern: salary sweep. Most of an incoming salary leaves for one account within an hour,
// in at least two separate months. Runs across all customers.
export async function detectSalarySweeps(sql: Sql) {
  const sweeps = await sql<{ earner: string; taker: string; months: number; avg_pct: number; avg_minutes: number }[]>`
    with salary as (
      select t.id, t.to_account_id, t.amount_cents, t.created_at, a.customer_id as earner
      from transactions t join accounts a on a.id = t.to_account_id
      where t.channel = 'salary' and t.created_at > now() - interval '180 days'
    ),
    swept as (
      select s.earner, ta.customer_id as taker, s.id as salary_id, s.amount_cents as salary,
             sum(o.amount_cents) as out_cents,
             extract(epoch from max(o.created_at) - s.created_at) / 60 as minutes
      from salary s
      join transactions o on o.from_account_id = s.to_account_id
        and o.created_at between s.created_at and s.created_at + interval '60 minutes'
        and o.status = 'posted'
      join accounts ta on ta.id = o.to_account_id
      where ta.customer_id <> s.earner
      group by s.earner, ta.customer_id, s.id, s.amount_cents, s.created_at
    )
    select earner, taker, count(*)::int as months,
           round(avg(out_cents::numeric / salary) * 100)::int as avg_pct,
           round(avg(minutes))::int as avg_minutes
    from swept
    where out_cents >= salary * 0.8
    group by earner, taker
    having count(*) >= 2`;

  for (const s of sweeps) {
    const caseId = await upsertCase(sql, s.taker, s.earner);
    const [{ existing }] = await sql<{ existing: number }[]>`
      select count(*)::int as existing from case_events where case_id = ${caseId} and detector = 'pattern:salary_sweep'`;
    if (existing > 0) continue;
    await addEvent(sql, caseId, {
      kind: "pattern_hit",
      detector: "pattern:salary_sweep",
      severity: 3,
      category: "coercion_control",
      rationale: `In ${s.months} separate months, about ${s.avg_pct}% of this customer's salary went to the same person within ${s.avg_minutes} minutes of landing. That can be ordinary household budgeting, or a sign someone else controls their money. No abusive words were involved.`,
    });
    await recomputeRisk(sql, caseId);
  }
  return sweeps.length;
}
