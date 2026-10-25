import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { when } from "@/lib/format";
import { BankLogo, LockIcon } from "../ui";

// Secure Inbox: only visible after signing in to the app. Nothing here is ever pushed or sent by SMS,
// so someone glancing at the lock screen sees nothing.
export default async function InboxPage() {
  const me = await currentPersona();
  const messages = await sql<{ id: number; body: string; created_at: Date }[]>`
    select id, body, created_at from outreach_messages where customer_id = ${me} order by created_at desc`;
  await sql`update outreach_messages set read_at = now() where customer_id = ${me} and read_at is null`;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Secure Inbox</h1>
      <p className="flex gap-2 rounded-2xl bg-bank-soft p-3 text-xs">
        <LockIcon className="size-4 shrink-0 text-bank" />
        Only Ubuntu Bank can send messages here. We never send them by SMS or notification.
      </p>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-sm text-muted">
          <LockIcon className="size-8" />
          <p className="mt-3">No messages yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-2">
                <BankLogo className="size-7" />
                <span className="flex-1 text-sm font-medium">Ubuntu Bank Care</span>
                <span className="text-xs text-muted">{when(m.created_at)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
