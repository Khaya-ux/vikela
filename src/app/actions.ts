"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { classifyReference, HOLD_THRESHOLD } from "@/lib/classify";
import { addEvent, detectPaymentMessaging, recomputeRisk, upsertCase } from "@/lib/cases";
import { currentPersona, PERSONAS } from "@/lib/persona";

export async function switchPersona(formData: FormData) {
  const id = String(formData.get("persona"));
  if (!(id in PERSONAS)) throw new Error("Unknown persona");
  (await cookies()).set("persona", id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(String(formData.get("next") ?? "/bank"));
}

export async function sendPayment(formData: FormData) {
  const senderId = await currentPersona();
  const recipientId = String(formData.get("recipient"));
  const amountRand = Number(formData.get("amount"));
  const reference = String(formData.get("reference") ?? "").slice(0, 120);

  if (!Number.isFinite(amountRand) || amountRand <= 0 || amountRand > 50_000) throw new Error("Enter an amount between R0.01 and R50 000");
  const [recipient] = await sql<{ id: string }[]>`select id from customers where id = ${recipientId}`;
  if (!recipient || recipientId === senderId) throw new Error("Choose a recipient");

  const verdict = await classifyReference(reference);
  const held = verdict.severity >= HOLD_THRESHOLD;

  const txId = await sql.begin(async (tx) => {
    const [row] = await tx<{ id: number }[]>`
      insert into transactions (from_account_id, to_account_id, amount_cents, reference, channel, status)
      values (${"a_" + senderId.slice(2)}, ${"a_" + recipientId.slice(2)}, ${Math.round(amountRand * 100)}, ${reference}, 'payshap', ${held ? "held" : "posted"})
      returning id`;
    const id = Number(row.id);

    // Anything above "ordinary" goes on a case so analysts see the full history, held or not.
    if (verdict.severity >= 1) {
      const caseId = await upsertCase(tx, senderId, recipientId);
      await addEvent(tx, caseId, {
        kind: "reference_flag",
        transactionId: id,
        severity: verdict.severity,
        category: verdict.category,
        language: verdict.language,
        translation: verdict.translation,
        rationale: verdict.rationale,
        detector: verdict.detector,
      });
      await detectPaymentMessaging(tx, senderId, recipientId, caseId);
      await recomputeRisk(tx, caseId);
    }
    return id;
  });

  revalidatePath("/console");
  redirect(`/bank/sent/${txId}`);
}

export async function sendOutreach(formData: FormData) {
  const caseId = Number(formData.get("caseId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Message is empty");
  await sql.begin(async (tx) => {
    const [c] = await tx<{ recipient_customer_id: string }[]>`select recipient_customer_id from cases where id = ${caseId}`;
    await tx`insert into outreach_messages (case_id, customer_id, body) values (${caseId}, ${c.recipient_customer_id}, ${body})`;
    await tx`update cases set status = 'outreach_sent', updated_at = now() where id = ${caseId}`;
    await addEvent(tx, caseId, { kind: "outreach", actor: "analyst", rationale: "Discreet message sent to the customer's Secure Inbox. No SMS or push notification." });
  });
  revalidatePath(`/console/cases/${caseId}`);
}

export async function closeCase(formData: FormData) {
  const caseId = Number(formData.get("caseId"));
  const note = String(formData.get("note") ?? "").trim() || "No action needed";
  await sql.begin(async (tx) => {
    await tx`update cases set status = 'closed_no_action', updated_at = now() where id = ${caseId}`;
    await addEvent(tx, caseId, { kind: "status_change", actor: "analyst", rationale: `Closed: ${note}` });
  });
  revalidatePath(`/console/cases/${caseId}`);
}
