import "server-only";
import { cookies } from "next/headers";

// Demo personas a judge can switch between. Real sign-in comes later; until then the
// console and bank app are demo-only and hold synthetic data only.
export const PERSONAS = {
  c_jabu: { name: "Jabu Nkosi", role: "Sender" },
  c_lerato: { name: "Lerato Mokoena", role: "Recipient" },
} as const;

export type PersonaId = keyof typeof PERSONAS;

export async function currentPersona(): Promise<PersonaId> {
  const value = (await cookies()).get("persona")?.value;
  return value && value in PERSONAS ? (value as PersonaId) : "c_jabu";
}
