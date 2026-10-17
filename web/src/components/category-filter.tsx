"use client";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories?: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const pill = (active: boolean) =>
    cn(
      "focus-ring flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
      active
        ? "border-fg bg-fg text-bg"
        : "border-line bg-surface text-muted hover:border-faint hover:text-fg"
    );

  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      <button role="tab" aria-selected={selected === null} onClick={() => onSelect(null)} className={pill(selected === null)}>
        All
      </button>
      {categories?.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={selected === c.id}
          onClick={() => onSelect(selected === c.id ? null : c.id)}
          className={pill(selected === c.id)}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
          {c.name}
        </button>
      ))}
      {!categories &&
        [0, 1, 2, 3].map((i) => <span key={i} className="skeleton h-9 w-24 shrink-0 rounded-full" />)}
    </div>
  );
}
