"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clockTime } from "@/lib/format";
import { HomeIcon, LockIcon, PayIcon } from "./ui";

// The phone's own clock, in South African time like the rest of the app. Rendered empty on the
// server and filled in by the browser, so the two never disagree during hydration.
const subscribe = (tick: () => void) => {
  const timer = setInterval(tick, 15_000);
  return () => clearInterval(timer);
};
const now = () => clockTime(new Date());

export function StatusBar() {
  const time = useSyncExternalStore(subscribe, now, () => "");
  return (
    <div className="relative hidden h-11 shrink-0 items-center justify-between px-7 text-xs font-semibold sm:flex" aria-hidden>
      <span className="tabular-nums">{time}</span>
      <span className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-2.5" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg viewBox="0 0 16 12" className="h-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 4.5a9.5 9.5 0 0 1 13 0" /><path d="M4 7.3a6 6 0 0 1 8 0" /><circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" /></svg>
        <svg viewBox="0 0 26 12" className="h-3" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="22" height="11" rx="3" opacity="0.4" /><rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none" /><path d="M24.5 4v4" strokeLinecap="round" opacity="0.4" /></svg>
      </span>
    </div>
  );
}

const TABS = [
  { href: "/bank", label: "Home", Icon: HomeIcon, active: (path: string) => path === "/bank" },
  { href: "/bank/send", label: "Pay", Icon: PayIcon, active: (path: string) => path.startsWith("/bank/send") || path.startsWith("/bank/sent") },
  { href: "/bank/inbox", label: "Secure Inbox", Icon: LockIcon, active: (path: string) => path.startsWith("/bank/inbox") },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 grid shrink-0 grid-cols-3 border-t border-line bg-card pb-2 pt-1.5">
      {TABS.map(({ href, label, Icon, active }) => {
        const on = active(path);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${on ? "text-bank" : "text-muted"}`}>
            <Icon className="size-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
