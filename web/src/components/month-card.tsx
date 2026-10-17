"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Summary } from "@/lib/types";
import { addMonths, monthLabel, money, moneyParts, thisMonth, todayISO } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

export function MonthCard({
  month,
  onMonth,
  summary,
}: {
  month: string;
  onMonth: (m: string) => void;
  summary?: Summary;
}) {
  const isCurrent = month === thisMonth();
  const total = moneyParts(summary?.total ?? 0);
  const prevLabel = monthLabel(addMonths(month, -1));
  const delta = summary?.deltaPercent;
  const today = todayISO();
  // Biggest spending day, shown in the accent colour and labelled under the bars
  const peak = summary?.daily.reduce<{ date: string; total: number } | null>(
    (best, d) => (d.total > (best?.total ?? 0) ? d : best),
    null
  );

  return (
    <section
      aria-label="Monthly total"
      className="relative overflow-hidden rounded-3xl bg-fg p-6 text-bg shadow-card"
    >
      {/* Month switcher */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onMonth(addMonths(month, -1))}
          aria-label="Previous month"
          className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-bg/10 transition-colors hover:bg-bg/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{monthLabel(month)}</p>
          <p className="text-[11px] opacity-50">
            {isCurrent ? "This month" : "Spent"}
          </p>
        </div>
        <button
          onClick={() => onMonth(addMonths(month, 1))}
          disabled={isCurrent}
          aria-label="Next month"
          className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-bg/10 transition-colors hover:bg-bg/20 disabled:opacity-30 disabled:hover:bg-bg/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Total */}
      <div className="mt-6">
        {summary ? (
          <p className="num flex items-baseline text-[52px] font-bold leading-none tracking-tight">
            {total.whole}
            <span className="text-2xl opacity-50">.{total.cents}</span>
          </p>
        ) : (
          <Skeleton className="h-[52px] w-48 !bg-bg/15" />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {delta == null ? (
            <span className="opacity-60">
              {summary ? `No spending in ${prevLabel} to compare` : " "}
            </span>
          ) : (
            <>
              <span
                className={`num inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                  delta > 0 ? "bg-rose-500" : "bg-emerald-500"
                }`}
              >
                {delta > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={3} />
                )}
                {Math.abs(delta)}%
              </span>
              <span className="opacity-60">
                {delta > 0 ? "more" : "less"} than {prevLabel} (
                {money(summary!.previousTotal)})
              </span>
            </>
          )}
        </div>
      </div>

      {/* Daily bars */}
      <div className="mt-7 h-16" aria-hidden="true">
        {summary && summary.total > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.daily} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
              <Tooltip
                cursor={false}
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="rounded-lg bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg shadow-pop">
                      {payload[0].payload.date.slice(8)}: {money(payload[0].value as number)}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="total" radius={[3, 3, 3, 3]} minPointSize={2} isAnimationActive={false}>
                {summary.daily.map((d) => (
                  <Cell
                    key={d.date}
                    fill={d.date === peak?.date ? "rgb(var(--accent))" : "rgb(var(--bg))"}
                    fillOpacity={
                      d.date === peak?.date ? 1 : d.date === today ? 0.95 : d.total > 0 ? 0.5 : 0.14
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {summary && summary.total > 0 && (
        <div className="num mt-1.5 flex justify-between text-[11px] opacity-60" aria-hidden="true">
          <span>{monthLabel(month, { short: true })} 1</span>
          {peak && (
            <span className="font-semibold text-accent opacity-100">
              Peak {money(peak.total)} · {monthLabel(month, { short: true })} {Number(peak.date.slice(8))}
            </span>
          )}
          <span>{monthLabel(month, { short: true })} {summary.daily.length}</span>
        </div>
      )}

      {/* Quick stats */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-bg/15 pt-4">
        {[
          ["Transactions", summary ? String(summary.count) : "-"],
          ["Daily average", summary ? money(summary.dailyAverage) : "-"],
          ["Top category", summary?.byCategory[0]?.name ?? "-"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium opacity-65">{label}</dt>
            <dd className="num mt-1 truncate text-[15px] font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
