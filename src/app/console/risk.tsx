export function RiskBadge({ score }: { score: number }) {
  const tone = score >= 70 ? "bg-danger/12 text-danger" : score >= 40 ? "bg-warn/12 text-warn" : "bg-line text-muted";
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${tone}`}>
      {label} · {score}
    </span>
  );
}

export const STATUS_NAMES: Record<string, string> = {
  open: "Needs review",
  outreach_sent: "Customer contacted",
  closed_no_action: "Closed, no action",
  closed_supported: "Closed, supported",
};
