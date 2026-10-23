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
