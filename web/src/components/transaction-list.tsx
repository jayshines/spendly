"use client";

import { useMemo, useState } from "react";
import { Pencil, Receipt, SearchX, Trash2 } from "lucide-react";
import type { Expense } from "@/lib/types";
import { dayLabel, money } from "@/lib/utils";
import { Button, Skeleton } from "@/components/ui";
import { MerchantAvatar } from "@/components/category-icon";

type Group = { date: string; items: Expense[]; cents: number };

function groupByDate(items: Expense[]): Group[] {
  const groups: Group[] = [];
  for (const e of items) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== e.date) {
      g = { date: e.date, items: [], cents: 0 };
      groups.push(g);
    }
    g.items.push(e);
    g.cents += Math.round(e.amount * 100);
  }
  return groups;
}

export function TransactionList({
  items,
  loading,
  filtered,
  monthName,
  onEdit,
  onDelete,
  onAdd,
  onClearFilters,
}: {
  items?: Expense[];
  loading: boolean;
  filtered: boolean;
  monthName: string;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => Promise<void>;
  onAdd: () => void;
  onClearFilters: () => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const groups = useMemo(() => groupByDate(items ?? []), [items]);

  if (loading && !items) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[68px] !rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items && items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
          {filtered ? <SearchX className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
        </span>
        <p className="mt-4 text-base font-semibold">
          {filtered ? "No matching expenses" : `No expenses in ${monthName}`}
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          {filtered
            ? "Try a different search or category."
            : "Add your first one and it will show up here."}
        </p>
        {filtered ? (
          <Button className="mt-5" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button variant="primary" className="mt-5" onClick={onAdd}>
            Add expense
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.date} aria-label={dayLabel(g.date)}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="label">{dayLabel(g.date)}</h3>
            <span className="num text-xs font-medium text-faint">{money(g.cents / 100)}</span>
          </div>

          <ul className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
            {g.items.map((e) => {
              const confirming = confirmId === e.id;
              return (
                <li
                  key={e.id}
                  className="group relative flex items-center gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0 transition-colors hover:bg-surface-2/50"
                >
                  {/* The whole left side is the edit target, so phones need no tiny icons */}
                  <button
                    onClick={() => onEdit(e)}
                    aria-label={`Edit ${e.merchant}, ${money(e.amount)}`}
                    className="focus-ring -m-1 flex min-w-0 flex-1 items-center gap-3.5 rounded-xl p-1 text-left"
                  >
                    <MerchantAvatar name={e.merchant} categoryColor={e.category.color} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold leading-tight">{e.merchant}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {e.category.name}
                        {e.note ? ` · ${e.note}` : ""}
                      </span>
                    </span>
                  </button>

                  {confirming ? (
                    <div className="flex animate-fade items-center gap-1.5">
                      <Button className="h-8 px-3 text-xs" onClick={() => setConfirmId(null)}>
                        Cancel
                      </Button>
                      <Button
                        className="h-8 bg-rose-500 px-3 text-xs text-white hover:bg-rose-600"
                        disabled={busyId === e.id}
                        onClick={async () => {
                          setBusyId(e.id);
                          try {
                            await onDelete(e);
                          } finally {
                            setBusyId(null);
                            setConfirmId(null);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="hidden items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:flex">
                        <button
                          onClick={() => onEdit(e)}
                          aria-label={`Edit ${e.merchant}`}
                          className="focus-ring grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-surface-2 hover:text-fg"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmId(e.id)}
                          aria-label={`Delete ${e.merchant}`}
                          className="focus-ring grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-rose-500/10 hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="num min-w-[4.5rem] text-right text-[15px] font-bold sm:w-24">{money(e.amount)}</p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
