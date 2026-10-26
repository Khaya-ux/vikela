import "server-only";
import { askClaude, askGroq, type ModelVerdict } from "./models";
import { classifyWithRules } from "./rules";

export type Classification = ModelVerdict & { detector: "llm" | "rules" };

// Severity at or above this holds the payment and opens a case.
export const HOLD_THRESHOLD = 3;

// Which model reads references. LLM_PROVIDER picks one explicitly; otherwise whichever key is set,
// Claude first. With no key at all the rules work alone.
function provider(): "anthropic" | "groq" | null {
  const chosen = process.env.LLM_PROVIDER;
  if (chosen === "anthropic" || chosen === "groq") return chosen;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  return null;
}

export async function classifyReference(reference: string): Promise<Classification> {
  const text = reference.trim();
  if (!text) return { language: "other", translation: "", category: "none", severity: 0, rationale: "Empty reference.", detector: "rules" };

  const rules = classifyWithRules(text);
  const which = provider();
  if (!which) return rules;

  try {
    const parsed = which === "groq" ? await askGroq(text) : await askClaude(text);
    if (!parsed) return rules;

    const severity = Math.min(5, Math.max(0, parsed.severity));
    // Rules catch known phrases even if the model under-reads a dialect; keep the higher score.
    if (rules.severity > severity) return rules;
    return { ...parsed, severity, detector: "llm" };
  } catch (error) {
    console.error(`classifyReference: ${which} call failed, using rules`, error instanceof Error ? error.message : error);
    return rules;
  }
}
