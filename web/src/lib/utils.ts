export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const money = (n: number) => usd.format(n);

/** Splits an amount for display: "$1,234" + ".56" (cents rendered smaller). */
export function moneyParts(n: number) {
  const [whole, cents] = usd.format(n).split(".");
  return { whole, cents: cents ?? "00" };
}

/* ---------- Month helpers (months are "YYYY-MM" strings) ---------- */

export function thisMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, opts?: { short?: boolean }) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: opts?.short ? "short" : "long",
    year: opts?.short ? undefined : "numeric",
    timeZone: "UTC",
  });
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

export function todayISO(now = new Date()) {
  return `${thisMonth(now)}-${String(now.getDate()).padStart(2, "0")}`;
}

/** "Today", "Yesterday" or "Tue, Oct 13" for a YYYY-MM-DD date. */
export function dayLabel(date: string, now = new Date()) {
  const today = todayISO(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (date === today) return "Today";
  if (date === todayISO(y)) return "Yesterday";
  const [yy, mm, dd] = date.split("-").map(Number);
  return new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
