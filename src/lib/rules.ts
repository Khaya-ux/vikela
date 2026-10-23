// Fast first-pass rules. They run on every payment, and they are the fallback when the
// model is unavailable, so they must never throw.
//
// SEED LIST ONLY. These phrases are a starting point and must be replaced or confirmed
// by native speakers before anything is claimed about accuracy.

import type { Classification } from "./classify";

type Rule = { pattern: RegExp; language: Classification["language"]; category: Classification["category"]; severity: number; gloss: string };

const RULES: Rule[] = [
  // English
  { pattern: /\b(i('| wi)ll|gonna|going to) (kill|hurt|end) you\b/i, language: "en", category: "threat_violence", severity: 5, gloss: "threat to kill or hurt" },
  { pattern: /\byou('| wi)ll (die|regret|pay)\b/i, language: "en", category: "threat_violence", severity: 4, gloss: "threat" },
  { pattern: /\bi know where you (are|live|stay|sleep)\b/i, language: "en", category: "stalking_location", severity: 4, gloss: "knows where you are" },
  { pattern: /\b(i('| wi)ll|gonna) find you\b/i, language: "en", category: "stalking_location", severity: 4, gloss: "will find you" },
  { pattern: /\b(last warning|watch your back)\b/i, language: "en", category: "threat_violence", severity: 3, gloss: "warning" },
  { pattern: /\b(answer (your|the) phone|unblock me|come back or)\b/i, language: "en", category: "coercion_control", severity: 3, gloss: "forcing contact" },
  // isiZulu
  { pattern: /ngizoku(bulala|limaza)/i, language: "zu", category: "threat_violence", severity: 5, gloss: "I will kill / hurt you" },
  { pattern: /\buzofa\b/i, language: "zu", category: "threat_violence", severity: 4, gloss: "you will die" },
  { pattern: /ngiya(kwazi|zi) lapho ukhona/i, language: "zu", category: "stalking_location", severity: 4, gloss: "I know where you are" },
  { pattern: /ngizokuthola/i, language: "zu", category: "stalking_location", severity: 4, gloss: "I will find you" },
  // Sesotho
  { pattern: /ke tla o (bolaya|utlwisa bohloko)/i, language: "st", category: "threat_violence", severity: 5, gloss: "I will kill / hurt you" },
  { pattern: /o tla shwa/i, language: "st", category: "threat_violence", severity: 4, gloss: "you will die" },
  { pattern: /moo o leng teng/i, language: "st", category: "stalking_location", severity: 4, gloss: "where you are" },
  // Afrikaans
  { pattern: /ek sal jou (doodmaak|seermaak)/i, language: "af", category: "threat_violence", severity: 5, gloss: "I will kill / hurt you" },
  { pattern: /jy gaan dood/i, language: "af", category: "threat_violence", severity: 4, gloss: "you are going to die" },
  { pattern: /ek weet waar jy (is|bly)/i, language: "af", category: "stalking_location", severity: 4, gloss: "I know where you are" },
];

// Signals that a phrase between friends is a joke. Rules only lower severity on these;
// the model makes the real call.
const JOKE = /\b(lol|lmao|haha+|😂|🤣)\b/i;

export function classifyWithRules(reference: string): Classification {
  const hits = RULES.filter((r) => r.pattern.test(reference));
  if (hits.length === 0) {
    return { language: "other", translation: "", category: "none", severity: 0, rationale: "No rule matched.", detector: "rules" };
  }
  const top = hits.reduce((a, b) => (b.severity > a.severity ? b : a));
  const joking = JOKE.test(reference);
  return {
    language: top.language,
    translation: hits.map((h) => h.gloss).join("; "),
    category: top.category,
    severity: joking ? Math.max(1, top.severity - 3) : top.severity,
    rationale: joking
      ? `Matched "${top.gloss}" but the message contains joke markers, so severity was lowered. Needs human review.`
      : `Matched known phrase: "${top.gloss}".`,
    detector: "rules",
  };
}
