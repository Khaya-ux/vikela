import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { sendPayment } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export default async function SendPage({ searchParams }: PageProps<"/bank/send">) {
  const me = await currentPersona();
  const { to } = await searchParams;

  // Saved beneficiaries: the people this customer has paid before.
  const beneficiaries = await sql<{ id: string; full_name: string }[]>`
    select distinct c.id, c.full_name
    from transactions t
    join accounts a on a.id = t.to_account_id
    join customers c on c.id = a.customer_id
    where t.from_account_id = ${"a_" + me.slice(2)} and c.id <> ${me}
    order by c.full_name
    limit 8`;

  return (
    <form action={sendPayment} className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Pay someone</h1>

      <label className="block">
        <span className="text-sm font-medium">To</span>
        <select name="recipient" defaultValue={typeof to === "string" ? to : undefined} required className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5">
          {beneficiaries.map((b) => (
            <option key={b.id} value={b.id}>{b.full_name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Amount (R)</span>
        <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue="1" required className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 tabular-nums" />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Reference</span>
        <input name="reference" maxLength={120} placeholder="What the recipient sees" className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5" />
        <span className="mt-1 block text-xs text-muted">Demo: try &ldquo;Ngiyazi lapho ukhona&rdquo;, &ldquo;Ek weet waar jy bly&rdquo;, or &ldquo;groceries&rdquo;.</span>
      </label>

      <SubmitButton />
    </form>
  );
}
