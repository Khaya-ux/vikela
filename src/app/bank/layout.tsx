import Link from "next/link";
import { switchPersona } from "@/app/actions";
import { currentPersona, PERSONAS, type PersonaId } from "@/lib/persona";
import { BottomNav, StatusBar } from "./chrome";
import { Avatar, BankLogo } from "./ui";

// The mock banking app. On a computer it sits in a phone frame so judges see what a customer sees.
// Demo controls stay outside the phone, so the bank's own screens look like a real bank.
export default async function BankLayout({ children }: LayoutProps<"/bank">) {
  const me = await currentPersona();
  const persona = PERSONAS[me];
  const otherId = (Object.keys(PERSONAS) as PersonaId[]).find((id) => id !== me)!;
  return (
    <div className="flex flex-1 flex-col items-center bg-background sm:py-6">
      <div className="flex w-full max-w-sm items-center justify-between gap-3 px-4 py-2 text-xs text-muted sm:mb-3 sm:px-1 sm:py-0">
        <Link href="/" className="underline underline-offset-2">← Demo guide</Link>
        <form action={switchPersona} className="flex items-center gap-2">
          <span>{persona.name.split(" ")[0]}&rsquo;s phone ({persona.role.toLowerCase()})</span>
          <input type="hidden" name="persona" value={otherId} />
          <input type="hidden" name="next" value="/bank" />
          <button className="rounded-full border border-line bg-card px-2.5 py-1 font-medium text-foreground">
            Switch to {PERSONAS[otherId].name.split(" ")[0]}
          </button>
        </form>
      </div>

      <div className="flex min-h-dvh w-full max-w-sm flex-col bg-card sm:h-[min(812px,calc(100dvh_-_6rem))] sm:min-h-0 sm:overflow-hidden sm:rounded-[3rem] sm:border-[10px] sm:border-black sm:shadow-2xl sm:ring-1 sm:ring-line">
        <StatusBar />
        <header className="sticky top-0 z-10 flex items-center justify-between bg-card px-5 py-3">
          <Link href="/bank" className="flex items-center gap-2 font-semibold tracking-tight">
            <BankLogo />
            Ubuntu Bank
          </Link>
          <Avatar name={persona.name} className="size-9" />
        </header>
        <main className="flex-1 px-5 pb-6 pt-2 sm:overflow-y-auto sm:[scrollbar-width:none]">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
