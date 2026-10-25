export function rand(cents: number | bigint | string) {
  const value = Number(cents) / 100;
  return "R" + value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function when(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// The bank app shows South African time, whatever the server's clock says.
const TZ = "Africa/Johannesburg";

export function clockTime(date: Date) {
  return date.toLocaleTimeString("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function dayLabel(date: Date) {
  const day = (d: Date) => d.toLocaleDateString("en-ZA", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" });
  const now = new Date();
  if (day(date) === day(now)) return "Today";
  if (day(date) === day(new Date(now.getTime() - 24 * 3600 * 1000))) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
}

// Transaction lists: recent days by name, older ones by month, like most banking apps.
export function activityGroup(date: Date) {
  const day = dayLabel(date);
  if (day === "Today" || day === "Yesterday") return day;
  return date.toLocaleDateString("en-ZA", { timeZone: TZ, month: "long", year: "numeric" });
}

export function activityStamp(date: Date) {
  const day = dayLabel(date);
  if (day === "Today" || day === "Yesterday") return clockTime(date);
  return date.toLocaleDateString("en-ZA", { timeZone: TZ, day: "numeric", month: "short" });
}

export function greeting() {
  const hour = Number(new Date().toLocaleString("en-ZA", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", zu: "isiZulu", xh: "isiXhosa", st: "Sesotho", tn: "Setswana", af: "Afrikaans", mixed: "Code-switched", other: "Other",
};

export const CATEGORY_NAMES: Record<string, string> = {
  none: "No concern",
  threat_violence: "Threat of violence",
  stalking_location: "Stalking / location",
  harassment_insult: "Harassment",
  sexual: "Sexual",
  coercion_control: "Coercion / control",
};
