// Seeds synthetic customers, six months of ordinary transactions, and the planted stories
// the demo walks through. Run: npm run db:reset
// Every name and number here is invented.
import postgres from "postgres";
import { addEvent, detectPaymentMessaging, detectSalarySweeps, recomputeRisk, upsertCase } from "../src/lib/cases.ts";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
  prepare: false,
  onnotice: () => {},
});

// Deterministic randomness so every reset gives the same demo.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const daysAgo = (d: number, hour = 12, minute = 0) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(hour, minute, 0, 0);
  return t;
};

const FIRST = ["Thandeka", "Sizwe", "Palesa", "Bongani", "Naledi", "Mpho", "Karabo", "Lindiwe", "Tshepo", "Ayanda", "Refilwe", "Sibusiso", "Anele", "Pieter", "Annelie", "Tumi", "Kamogelo", "Nokuthula", "Lwazi", "Dineo", "Themba", "Busisiwe", "Johan", "Precious", "Mandla"];
const LAST = ["Dlamini", "Mokoena", "Nkosi", "Khumalo", "Botha", "Mahlangu", "Ndlovu", "Molefe", "van der Merwe", "Sithole", "Zulu", "Mathebula", "Pretorius", "Radebe", "Mabuza"];
const ORDINARY_REFS = ["rent", "groceries", "for the kids", "school fees", "taxi money", "stokvel", "airtime", "electricity", "thanks for lunch", "INV 2291", "Mama's birthday", "uniform", "burial society", "data bundle", "petrol"];

// The planted people. Ids are readable on purpose: the console shows them.
const STORY_PEOPLE = [
  { id: "c_jabu", name: "Jabu Nkosi", phone: "4417" },        // demo sender
  { id: "c_lerato", name: "Lerato Mokoena", phone: "2093" },  // demo recipient
  { id: "c_kagiso", name: "Kagiso Molefe", phone: "8820" },
  { id: "c_zanele", name: "Zanele Khumalo", phone: "1156" },
  { id: "c_vusi", name: "Vusi Mahlangu", phone: "6634" },
  { id: "c_nomsa", name: "Nomsa Sithole", phone: "3071" },
  { id: "c_ayanda", name: "Ayanda Zulu", phone: "5528" },
  { id: "c_neo", name: "Neo Radebe", phone: "9902" },
];

async function main() {
  await sql.file("db/schema.sql");

  const people = [...STORY_PEOPLE];
  for (let i = 0; i < 50; i++) {
    people.push({ id: `c_${String(i).padStart(3, "0")}`, name: `${pick(FIRST)} ${pick(LAST)}`, phone: String(1000 + Math.floor(rand() * 9000)) });
  }

  for (const p of people) {
    await sql`insert into customers (id, full_name, phone_last4) values (${p.id}, ${p.name}, ${p.phone})`;
    await sql`insert into accounts (id, customer_id, account_no, kind, balance_cents)
              values (${"a_" + p.id.slice(2)}, ${p.id}, ${String(62000000000 + Math.floor(rand() * 9e8))}, 'cheque', ${Math.floor(2000 + rand() * 30000) * 100})`;
  }
  const acct = (customerId: string) => "a_" + customerId.slice(2);

  type Tx = { from: string | null; to: string; cents: number; ref: string; channel?: string; status?: string; at: Date };
  const insertTx = async (t: Tx) => {
    const [row] = await sql<{ id: number }[]>`
      insert into transactions (from_account_id, to_account_id, amount_cents, reference, channel, status, created_at)
      values (${t.from ? acct(t.from) : null}, ${acct(t.to)}, ${t.cents}, ${t.ref}, ${t.channel ?? "eft"}, ${t.status ?? "posted"}, ${t.at})
      returning id`;
    return Number(row.id);
  };

  // Background noise: ordinary payments between random people, plus salaries.
  const background = people.slice(STORY_PEOPLE.length);
  for (let d = 180; d >= 1; d--) {
    for (let k = 0; k < 4; k++) {
      const from = pick(people), to = pick(background);
      if (from.id === to.id) continue;
      await insertTx({ from: from.id, to: to.id, cents: Math.floor(50 + rand() * 2500) * 100, ref: pick(ORDINARY_REFS), channel: pick(["eft", "eft", "payshap", "ewallet"]), at: daysAgo(d, 8 + Math.floor(rand() * 12), Math.floor(rand() * 60)) });
    }
  }
  for (const p of background.slice(0, 20)) {
    for (const d of [145, 115, 85, 55, 25]) {
      await insertTx({ from: null, to: p.id, cents: Math.floor(8000 + rand() * 20000) * 100, ref: "SALARY", channel: "salary", at: daysAgo(d, 7) });
    }
  }

  // Story 1, the live demo pair: Jabu -> Lerato. Ordinary history, then two flagged references.
  await insertTx({ from: "c_jabu", to: "c_lerato", cents: 150000, ref: "rent share", at: daysAgo(70) });
  await insertTx({ from: "c_jabu", to: "c_lerato", cents: 150000, ref: "rent share", at: daysAgo(40) });
  {
    const caseId = await upsertCase(sql, "c_jabu", "c_lerato");
    const flagged = [
      { d: 12, ref: "Answer your phone", severity: 3, category: "coercion_control", language: "en", translation: "", rationale: "Pressure to make contact, sent through a payment because other channels are likely blocked." },
      { d: 5, ref: "You'll regret leaving me", severity: 4, category: "threat_violence", language: "en", translation: "", rationale: "Implied threat tied to the relationship ending." },
    ];
    for (const f of flagged) {
      const txId = await insertTx({ from: "c_jabu", to: "c_lerato", cents: 100, ref: f.ref, status: "held", at: daysAgo(f.d, 21, 14) });
      await addEvent(sql, caseId, { kind: "reference_flag", transactionId: txId, severity: f.severity, category: f.category, language: f.language, translation: f.translation, rationale: f.rationale, detector: "llm", createdAt: daysAgo(f.d, 21, 14) });
    }
    await recomputeRisk(sql, caseId);
  }

  // Story 2: Kagiso -> Zanele. R1 payments used as a messaging channel, escalating over three weeks.
  {
    const caseId = await upsertCase(sql, "c_kagiso", "c_zanele");
    const history = [
      { d: 21, ref: "Answer your phone", severity: 3, category: "coercion_control", language: "en", translation: "" },
      { d: 15, ref: "Why did you block me", severity: 2, category: "harassment_insult", language: "en", translation: "" },
      { d: 10, ref: "Unblock me or else", severity: 3, category: "coercion_control", language: "en", translation: "" },
      { d: 6, ref: "Ngiyazi lapho ukhona", severity: 4, category: "stalking_location", language: "zu", translation: "I know where you are" },
      { d: 2, ref: "Ngizokuthola. Last warning", severity: 5, category: "threat_violence", language: "mixed", translation: "I will find you. Last warning" },
    ];
    for (const h of history) {
      const at = daysAgo(h.d, 23, 2);
      const txId = await insertTx({ from: "c_kagiso", to: "c_zanele", cents: 100, ref: h.ref, channel: "payshap", status: h.severity >= 3 ? "held" : "posted", at });
      await addEvent(sql, caseId, { kind: "reference_flag", transactionId: txId, severity: h.severity, category: h.category, language: h.language, translation: h.translation, detector: "llm", createdAt: at,
        rationale: h.severity >= 4 ? "Location or violence threat in a tiny payment, following earlier pressure to make contact." : "Repeated contact pressure through payment references." });
    }
    await detectPaymentMessaging(sql, "c_kagiso", "c_zanele", caseId);
    await recomputeRisk(sql, caseId);
  }

  // Story 3: Nomsa's salary is swept to Vusi within minutes, every month. No bad words anywhere.
  for (const d of [85, 55, 25]) {
    await insertTx({ from: null, to: "c_nomsa", cents: 1420000, ref: "SALARY ACME RETAIL", channel: "salary", at: daysAgo(d, 7, 0) });
    await insertTx({ from: "c_nomsa", to: "c_vusi", cents: 1280000, ref: "", at: daysAgo(d, 7, 18) });
    await insertTx({ from: "c_vusi", to: "c_nomsa", cents: 50000, ref: "pocket money", at: daysAgo(d - 3, 18) });
  }
  await detectSalarySweeps(sql);

  // Story 4, the false positive: friends joking. Flagged low, reviewed, closed with no action.
  {
    const at = daysAgo(3, 19, 40);
    const txId = await insertTx({ from: "c_ayanda", to: "c_neo", cents: 25000, ref: "Ngizokubulala lol uyeke ukudla ukudla kwami", at });
    const caseId = await upsertCase(sql, "c_ayanda", "c_neo");
    await addEvent(sql, caseId, { kind: "reference_flag", transactionId: txId, severity: 1, category: "none", language: "zu", translation: "I'll kill you lol, stop eating my food", detector: "llm", createdAt: at,
      rationale: "Contains 'I'll kill you' but in an obvious joke about food, with a laughing marker, between people with a long history of ordinary payments. Not held." });
    await addEvent(sql, caseId, { kind: "analyst_note", actor: "analyst", rationale: "Reviewed: friends joking about food. No action.", createdAt: daysAgo(3, 20, 5) });
    await addEvent(sql, caseId, { kind: "status_change", actor: "analyst", rationale: "Closed: no action needed", createdAt: daysAgo(3, 20, 5) });
    await recomputeRisk(sql, caseId);
    await sql`update cases set status = 'closed_no_action' where id = ${caseId}`;
  }

  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from transactions`;
  const cases = await sql`select sender_customer_id, recipient_customer_id, risk_score, status, summary from cases order by risk_score desc`;
  console.log(`Seeded ${people.length} customers, ${n} transactions, ${cases.length} cases:`);
  console.table(cases);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
