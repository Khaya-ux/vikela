function riskLevel(score: number) {
  if (score >= 70) return { label: "High", tone: "bg-danger/12 text-danger", bar: "bg-danger" };
  if (score >= 40) return { label: "Medium", tone: "bg-warn/12 text-warn", bar: "bg-warn" };
  return { label: "Low", tone: "bg-line text-muted", bar: "bg-muted/50" };
}

export function RiskBadge({ score }: { score: number }) {
  const { label, tone } = riskLevel(score);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${tone}`}>
      {label} · {score}
    </span>
  );
}

// The queue's big score tile: the number first, then the level in words.
export function RiskScore({ score }: { score: number }) {
  const { label, tone } = riskLevel(score);
  return (
    <span className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl ${tone}`}>
      <span className="text-2xl font-semibold leading-none tabular-nums">{score}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-wide">{label}</span>
    </span>
  );
}

export function RiskStripe({ score }: { score: number }) {
  return <span className={`absolute inset-y-0 left-0 w-1 ${riskLevel(score).bar}`} aria-hidden />;
}

export const STATUS_NAMES: Record<string, string> = {
  open: "Needs review",
  outreach_sent: "Customer contacted",
  closed_no_action: "Closed, no action",
  closed_supported: "Closed, supported",
};

const STATUS_TONES: Record<string, string> = {
  open: "bg-warn/12 text-warn",
  outreach_sent: "bg-brand/12 text-brand",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[status] ?? "bg-line text-muted"}`}>
      {STATUS_NAMES[status] ?? status}
    </span>
  );
}
