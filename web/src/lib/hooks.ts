"use client";

import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { monthRange } from "@/lib/utils";
import type { Category, ExpensePage, Summary } from "@/lib/types";

export function useCategories(enabled = true) {
  return useSWR<Category[]>(enabled ? "categories" : null, () =>
    api<Category[]>("/categories")
  );
}

export function useSummary(month: string, enabled = true) {
  return useSWR<Summary>(enabled ? ["summary", month] : null, () =>
    api<Summary>(`/summary?month=${month}`)
  );
}

export function useExpenses(
  args: { month: string; categoryId: string | null; q: string },
  enabled = true
) {
  const { month, categoryId, q } = args;
  return useSWR<ExpensePage>(
    enabled ? ["expenses", month, categoryId, q] : null,
    () => {
      const { from, to } = monthRange(month);
      const p = new URLSearchParams({ from, to, limit: "100" });
      if (categoryId) p.set("categoryId", categoryId);
      if (q) p.set("q", q);
      return api<ExpensePage>(`/expenses?${p}`);
    }
  );
}

/** Re-fetch every expense list and summary (after add / edit / delete). */
export function refreshExpenseData() {
  return mutate(
    (key) =>
      Array.isArray(key) && (key[0] === "expenses" || key[0] === "summary") ||
      key === "categories"
  );
}
