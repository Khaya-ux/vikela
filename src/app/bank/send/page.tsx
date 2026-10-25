import Link from "next/link";
import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { rand } from "@/lib/format";
import { sendPayment } from "@/app/actions";
import { Avatar, BackIcon, DemoNote } from "../ui";
import { SubmitButton } from "./submit-button";

export default async function SendPage({ searchParams }: PageProps<"/bank/send">) {
  const me = await currentPersona();
  const account = "a_" + me.slice(2);
  const { to } = await searchParams;

  const [{ balance_cents, account_no }] = await sql<{ balance_cents: string; account_no: string }[]>`
    select balance_cents, account_no from accounts where id = ${account}`;

  // Saved beneficiaries: the people this customer has paid before.
  const beneficiaries = await sql<{ id: string; full_name: string }[]>`
    select distinct c.id, c.full_name
    from transactions t
    join accounts a on a.id = t.to_account_id
    join customers c on c.id = a.customer_id
    where t.from_account_id = ${account} and c.id <> ${me}
    order by c.full_name
    limit 8`;
  const selected = beneficiaries.some((b) => b.id === to) ? to : beneficiaries[0]?.id;
  // The chosen person comes first so they're visible without scrolling the row.
  const ordered = [...beneficiaries].sort((a, b) => Number(b.id === selected) - Number(a.id === selected));

  return (
    <form action={sendPayment} className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/bank" aria-label="Back" className="-ml-2 rounded-full p-1"><BackIcon className="size-6" /></Link>
        <h1 className="text-xl font-semibold tracking-tight">Pay someone</h1>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-bank-soft px-4 py-3 text-sm">
        <span>
          <span className="block text-xs text-muted">From</span>
          Cheque account •••• {account_no.slice(-4)}
        </span>
        <span className="text-right">
          <span className="block text-xs text-muted">Available</span>
          <span className="tabular-nums">{rand(balance_cents)}</span>
        </span>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">To</legend>
        <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {ordered.map((b) => (
            <label key={b.id} className="flex w-20 shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-transparent p-2 text-center has-[:checked]:border-bank has-[:checked]:bg-bank-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bank">
              <input type="radio" name="recipient" value={b.id} defaultChecked={b.id === selected} required className="sr-only" />
              <Avatar name={b.full_name} className="size-12" />
              <span className="line-clamp-2 w-full text-xs leading-tight">{b.full_name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium">Amount</span>
        <span className="mt-2 flex items-center rounded-2xl border border-line px-4 focus-within:border-bank">
          <span className="text-2xl font-semibold text-muted">R</span>
          <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue="1" required className="w-full bg-transparent px-2 py-3 text-2xl font-semibold tabular-nums outline-none" />
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Reference</span>
        <input name="reference" maxLength={120} placeholder="Shows on their statement" className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-bank" />
      </label>

      <DemoNote>
        try a threat such as &ldquo;Ngiyazi lapho ukhona&rdquo; (isiZulu) or &ldquo;Ek weet waar jy bly&rdquo; (Afrikaans), or something ordinary like &ldquo;groceries&rdquo;.
      </DemoNote>

      <SubmitButton />
    </form>
  );
}
