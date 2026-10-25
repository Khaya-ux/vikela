// Shared pieces of the Ubuntu Bank mock app. Plain components, safe in server and client code.
import type { ReactNode, SVGProps } from "react";

// A person held inside a "U": ubuntu, "I am because we are".
export function BankLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--bank)" />
      <path d="M9.5 11v5.5a6.5 6.5 0 0 0 13 0V11" fill="none" stroke="var(--bank-ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="10.5" r="2.6" fill="var(--bank-accent)" />
    </svg>
  );
}

export function Avatar({ name, className = "size-10" }: { name: string; className?: string }) {
  const parts = name.split(" ");
  const initials = (parts[0][0] + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-bank-soft text-xs font-semibold text-bank ${className}`} aria-hidden>
      {initials}
    </span>
  );
}

// Anything only judges need to know sits in a dashed box, so it never looks like part of the bank.
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-3 text-xs text-muted">
      <strong className="text-foreground">Demo note:</strong> {children}
    </div>
  );
}

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v11h14V9" /><path d="M10 20v-6h4v6" /></Icon>;
export const PayIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></Icon>;
export const LockIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><rect x="4" y="10.5" width="16" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Icon>;
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
export const ClockIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icon>;
export const SalaryIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" /><path d="M3.5 12.5h17" /></Icon>;
export const BackIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m14.5 6-6 6 6 6" /></Icon>;
