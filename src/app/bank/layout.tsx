import Link from "next/link";
import { currentPersona, PERSONAS } from "@/lib/persona";

// The mock banking app. Phone-sized on any screen so judges see what a customer sees.
export default async function BankLayout({ children }: LayoutProps<"/bank">) {
  const persona = PERSONAS[await currentPersona()];
  return (
    <div className="flex flex-1 flex-col items-center bg-background sm:py-8">
      <div className="mb-3 hidden w-full max-w-sm items-center justify-between px-1 text-xs text-muted sm:flex">
        <Link href="/" className="underline underline-offset-2">← Demo guide</Link>
        <span>Viewing as {persona.name} ({persona.role.toLowerCase()})</span>
      </div>
      <div className="flex w-full max-w-sm flex-1 flex-col overflow-hidden bg-card sm:flex-none sm:rounded-[2rem] sm:border sm:border-line sm:shadow-sm" style={{ minHeight: "min(780px, 100dvh)" }}>
        <header className="flex items-center justify-between bg-brand px-5 py-4 text-brand-ink">
          <Link href="/bank" className="font-semibold tracking-tight">Ubuntu Bank</Link>
          <span className="text-sm opacity-90">{persona.name.split(" ")[0]}</span>
        </header>
        <div className="flex-1 px-5 py-5">{children}</div>
        <Link href="/" className="border-t border-line py-3 text-center text-xs text-muted sm:hidden">← Demo guide</Link>
      </div>
    </div>
  );
}
