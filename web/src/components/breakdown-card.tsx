"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { Summary } from "@/lib/types";
import { cn, money, moneyParts } from "@/lib/utils";
import { Card, Skeleton } from "@/components/ui";
import { CategoryIcon } from "@/components/category-icon";

export function BreakdownCard({
  summary,
  selected,
  onSelect,
}: {
  summary?: Summary;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const rows = summary?.byCategory ?? [];
  const active = rows.find((r) => r.categoryId === selected);
  const centre = moneyParts(active ? active.total : (summary?.total ?? 0));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="label">Where it went</h2>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="focus-ring rounded-full px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Donut */}
      <div className="relative mx-auto mt-4 h-[220px] w-[220px]">
        {!summary ? (
          <Skeleton className="h-full w-full !rounded-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {rows.length === 0 ? (
                  <Pie
                    data={[{ v: 1 }]}
                    dataKey="v"
                    innerRadius={74}
                    outerRadius={100}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    <Cell fill="rgb(var(--surface-2))" />
                  </Pie>
                ) : (
                  <Pie
                    data={rows}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={74}
                    outerRadius={100}
                    paddingAngle={rows.length > 1 ? 3 : 0}
                    cornerRadius={8}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                    onClick={(_, i) => {
                      const id = rows[i].categoryId;
                      onSelect(selected === id ? null : id);
                    }}
                    animationDuration={600}
                  >
                    {rows.map((r) => (
                      <Cell
                        key={r.categoryId}
                        fill={r.color}
                        fillOpacity={!selected || selected === r.categoryId ? 1 : 0.2}
                        style={{ cursor: "pointer", outline: "none", transition: "fill-opacity .2s" }}
                      />
                    ))}
                  </Pie>
                )}
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-medium text-muted">
                {active ? active.name : "Spent"}
              </span>
              <span className="num mt-0.5 text-[28px] font-bold leading-none tracking-tight">
                {centre.whole}
                <span className="text-sm text-faint">.{centre.cents}</span>
              </span>
              {active && (
                <span className="num mt-1 text-xs text-muted">{active.percent}% of total</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Category rows */}
      <ul className="mt-5 -mx-2 space-y-0.5">
        {!summary &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="mx-2 my-2 h-11" />)}

        {rows.map((r) => {
          const isSel = selected === r.categoryId;
          return (
            <li key={r.categoryId}>
              <button
                onClick={() => onSelect(isSel ? null : r.categoryId)}
                aria-pressed={isSel}
                className={cn(
                  "focus-ring flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors",
                  isSel ? "bg-surface-2" : "hover:bg-surface-2/60"
                )}
              >
                <CategoryIcon icon={r.icon} color={r.color} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="num block text-xs text-muted">
                    {r.percent}% · {r.count} {r.count === 1 ? "expense" : "expenses"}
                  </span>
                </span>
                <span className="num text-sm font-bold">{money(r.total)}</span>
              </button>
            </li>
          );
        })}

        {summary && rows.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted">
            Nothing to break down yet.
          </li>
        )}
      </ul>
    </Card>
  );
}
