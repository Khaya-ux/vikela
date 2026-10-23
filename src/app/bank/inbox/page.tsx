import { sql } from "@/lib/db";
import { currentPersona } from "@/lib/persona";
import { when } from "@/lib/format";

// Secure Inbox: only visible after signing in to the app. Nothing here is ever pushed or sent by SMS,
// so someone glancing at the lock screen sees nothing.
export default async function InboxPage() {
  const me = await currentPersona();
  const messages = await sql<{ id: number; body: string; created_at: Date }[]>`
    select id, body, created_at from outreach_messages where customer_id = ${me} order by created_at desc`;
  await sql`update outreach_messages set read_at = now() where customer_id = ${me} and read_at is null`;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Secure Inbox</h1>
      {messages.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No messages.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-xl border border-line p-4">
              <p className="text-xs text-muted">Ubuntu Bank Care · {when(m.created_at)}</p>
              <p className="mt-2 whitespace-pre-line text-sm">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
