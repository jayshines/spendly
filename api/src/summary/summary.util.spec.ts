import {
  buildSummary,
  currentMonth,
  MONTH_RE,
  monthBounds,
  SummaryRow,
} from './summary.util';

const categories = [
  { id: 'food', name: 'Food', color: '#f97316', icon: 'utensils' },
  { id: 'bus', name: 'Transport', color: '#3b82f6', icon: 'bus' },
  { id: 'fun', name: 'Fun', color: '#8b5cf6', icon: 'clapperboard' },
];

const row = (categoryId: string, amountCents: number, date: string): SummaryRow => ({
  categoryId,
  amountCents,
  date,
});

describe('monthBounds', () => {
  it('returns [start, end) at UTC midnight', () => {
    const b = monthBounds('2026-02');
    expect(b.start.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(b.end.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(b.prevStart.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(b.daysInMonth).toBe(28);
  });

  it('handles leap years and the January -> December rollover', () => {
    expect(monthBounds('2028-02').daysInMonth).toBe(29);
    expect(monthBounds('2026-01').prevStart.toISOString()).toBe(
      '2025-12-01T00:00:00.000Z',
    );
  });
});

describe('MONTH_RE / currentMonth', () => {
  it('accepts YYYY-MM only', () => {
    expect(MONTH_RE.test('2026-10')).toBe(true);
    expect(MONTH_RE.test('2026-13')).toBe(false);
    expect(MONTH_RE.test('2026-1')).toBe(false);
    expect(MONTH_RE.test('2026-10-01')).toBe(false);
  });

  it('formats the current month', () => {
    expect(currentMonth(new Date('2026-10-14T12:00:00Z'))).toBe('2026-10');
  });
});

describe('buildSummary', () => {
  const rows = [
    row('food', 1250, '2026-10-01'),
    row('food', 3000, '2026-10-01'),
    row('bus', 4550, '2026-10-15'),
    row('fun', 1200, '2026-10-31'), // last day of the month
  ];

  const s = buildSummary({
    month: '2026-10',
    rows,
    categories,
    previousTotalCents: 5000,
  });

  it('totals the month in dollars', () => {
    expect(s.total).toBe(100);
    expect(s.count).toBe(4);
    expect(s.previousTotal).toBe(50);
  });

  it('computes the change vs the previous month', () => {
    expect(s.deltaPercent).toBe(100);
  });

  it('groups by category, largest first, with percentages', () => {
    expect(s.byCategory.map((c) => c.name)).toEqual(['Transport', 'Food', 'Fun']);
    expect(s.byCategory[0]).toMatchObject({
      total: 45.5,
      count: 1,
      percent: 45.5,
      color: '#3b82f6',
    });
    expect(s.byCategory[1]).toMatchObject({ total: 42.5, count: 2, percent: 42.5 });
    const sum = s.byCategory.reduce((a, c) => a + c.percent, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it('returns one entry per day, including empty days', () => {
    expect(s.daily).toHaveLength(31);
    expect(s.daily[0]).toEqual({ date: '2026-10-01', total: 42.5 });
    expect(s.daily[1]).toEqual({ date: '2026-10-02', total: 0 });
    expect(s.daily[30]).toEqual({ date: '2026-10-31', total: 12 });
  });

  it('averages per calendar day', () => {
    expect(s.dailyAverage).toBe(3.23); // 100 / 31
  });

  it('is exact with cents (no floating point drift)', () => {
    const r = buildSummary({
      month: '2026-10',
      rows: [row('food', 10, '2026-10-02'), row('food', 20, '2026-10-02')],
      categories,
      previousTotalCents: 0,
    });
    expect(r.total).toBe(0.3); // 0.1 + 0.2 would be 0.30000000000000004
  });

  it('handles an empty month', () => {
    const e = buildSummary({
      month: '2026-02',
      rows: [],
      categories,
      previousTotalCents: 0,
    });
    expect(e.total).toBe(0);
    expect(e.count).toBe(0);
    expect(e.byCategory).toEqual([]);
    expect(e.dailyAverage).toBe(0);
    expect(e.daily).toHaveLength(28);
  });

  it('returns a null change when last month had no spending', () => {
    const n = buildSummary({
      month: '2026-10',
      rows: [row('food', 500, '2026-10-02')],
      categories,
      previousTotalCents: 0,
    });
    expect(n.deltaPercent).toBeNull();
  });

  it('reports a decrease as a negative percentage', () => {
    const d = buildSummary({
      month: '2026-10',
      rows: [row('food', 7500, '2026-10-02')],
      categories,
      previousTotalCents: 10000,
    });
    expect(d.deltaPercent).toBe(-25);
  });

  it('falls back gracefully for an unknown category id', () => {
    const u = buildSummary({
      month: '2026-10',
      rows: [row('ghost', 100, '2026-10-02')],
      categories,
      previousTotalCents: 0,
    });
    expect(u.byCategory[0].name).toBe('Unknown');
  });
});
