import Link from "next/link";

export default function ConsoleLayout({ children }: LayoutProps<"/console">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/console" className="font-semibold tracking-tight">
            Vikela <span className="font-normal text-muted">· Ubuntu Bank customer care</span>
          </Link>
          <Link href="/" className="text-sm text-muted underline underline-offset-2">Demo guide</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
