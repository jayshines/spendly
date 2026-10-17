// Pure helpers for the monthly summary. No database access, so they are easy to test.
// All money maths is done in integer cents to avoid floating point drift.

export type SummaryRow = {
  amountCents: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
};

export type CategoryInfo = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const dollars = (cents: number) => cents / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function currentMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** [start, end) bounds of a month at UTC midnight, plus the previous month's. */
export function monthBounds(month: string) {
  const [y, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
    prevStart: new Date(Date.UTC(y, m - 2, 1)),
    daysInMonth: new Date(Date.UTC(y, m, 0)).getUTCDate(),
  };
}

export function buildSummary(args: {
  month: string;
  rows: SummaryRow[];
  categories: CategoryInfo[];
  previousTotalCents: number;
}) {
  const { month, rows, categories, previousTotalCents } = args;
  const { daysInMonth } = monthBounds(month);

  const totalCents = rows.reduce((s, r) => s + r.amountCents, 0);

  // Per category
  const byCat = new Map<string, { cents: number; count: number }>();
  for (const r of rows) {
    const cur = byCat.get(r.categoryId) ?? { cents: 0, count: 0 };
    cur.cents += r.amountCents;
    cur.count += 1;
    byCat.set(r.categoryId, cur);
  }
  const info = new Map(categories.map((c) => [c.id, c]));
  const byCategory = [...byCat.entries()]
    .map(([id, v]) => {
      const c = info.get(id);
      return {
        categoryId: id,
        name: c?.name ?? 'Unknown',
        color: c?.color ?? '#64748b',
        icon: c?.icon ?? 'ellipsis',
        total: dollars(v.cents),
        count: v.count,
        percent: totalCents === 0 ? 0 : round1((v.cents / totalCents) * 100),
      };
    })
    .sort((a, b) => b.total - a.total);

  // One entry per calendar day, including days with no spending
  const perDay = new Map<string, number>();
  for (const r of rows) perDay.set(r.date, (perDay.get(r.date) ?? 0) + r.amountCents);
  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { date, total: dollars(perDay.get(date) ?? 0) };
  });

  return {
    month,
    total: dollars(totalCents),
    previousTotal: dollars(previousTotalCents),
    // null when last month had no spending (a percentage would be meaningless)
    deltaPercent:
      previousTotalCents === 0
        ? null
        : round1(((totalCents - previousTotalCents) / previousTotalCents) * 100),
    count: rows.length,
    dailyAverage: dollars(Math.round(totalCents / daysInMonth)),
    byCategory,
    daily,
  };
}
