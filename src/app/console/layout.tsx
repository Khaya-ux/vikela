import Link from "next/link";

export default function ConsoleLayout({ children }: LayoutProps<"/console">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/console" className="flex items-center gap-2 font-semibold tracking-tight">
            {/* Vikela means "protect" in isiZulu. */}
            <svg viewBox="0 0 24 24" className="size-6 text-brand" aria-hidden>
              <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.6 7.5 10 4.4-1.4 7.5-5.4 7.5-10v-6L12 2.5Z" fill="currentColor" />
              <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="var(--brand-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Vikela <span className="font-normal text-muted">· Ubuntu Bank customer care</span></span>
          </Link>
          <Link href="/" className="text-sm text-muted underline underline-offset-2">Demo guide</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
