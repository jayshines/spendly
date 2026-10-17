"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { refreshExpenseData, useCategories, useExpenses, useSummary } from "@/lib/hooks";
import type { Expense } from "@/lib/types";
import { monthLabel, thisMonth } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";
import { BreakdownCard } from "@/components/breakdown-card";
import { CategoryFilter } from "@/components/category-filter";
import { ExpenseModal } from "@/components/expense-modal";
import { MonthCard } from "@/components/month-card";
import { useToast } from "@/components/toast";
import { TransactionList } from "@/components/transaction-list";
import { Button, Skeleton } from "@/components/ui";

type ModalState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; expense: Expense };

export function Dashboard() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useAuth();
  const authed = !!user;

  const [month, setMonth] = useState(thisMonth());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced search
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  // Not signed in -> /login
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Debounce search so we don't call the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const categories = useCategories(authed);
  const summary = useSummary(month, authed);
  const expenses = useExpenses({ month, categoryId, q }, authed);

  const filtered = categoryId !== null || q !== "";
  const clearFilters = () => {
    setCategoryId(null);
    setSearch("");
  };

  const onDelete = async (e: Expense) => {
    try {
      await api(`/expenses/${e.id}`, { method: "DELETE" });
      await refreshExpenseData();
      toast("Expense deleted");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete", "error");
    }
  };

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 !rounded-3xl" />
      </div>
    );
  }

  return (
    <>
      <AppHeader onAdd={() => setModal({ mode: "add" })} />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-12">
        {/* Left: month total + breakdown */}
        <div className="min-w-0 animate-rise space-y-6 lg:col-span-5">
          <MonthCard month={month} onMonth={(m) => { setMonth(m); setCategoryId(null); }} summary={summary.data} />
          <BreakdownCard summary={summary.data} selected={categoryId} onSelect={setCategoryId} />
        </div>

        {/* Right: filters + transactions */}
        <div className="min-w-0 animate-rise space-y-5 lg:col-span-7" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            {expenses.data && (
              <span className="num rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
                {expenses.data.total}
              </span>
            )}
          </div>

          <label className="focus-within:ring-2 focus-within:ring-accent/40 flex h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-muted">
            <Search className="h-[18px] w-[18px] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant or note"
              aria-label="Search expenses"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="text-faint hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <CategoryFilter categories={categories.data} selected={categoryId} onSelect={setCategoryId} />

          {expenses.error ? (
            <div className="rounded-3xl border border-line bg-surface p-8 text-center">
              <p className="font-semibold">Couldn&apos;t load your expenses</p>
              <p className="mt-1 text-sm text-muted">{(expenses.error as Error).message}</p>
              <Button className="mt-4" onClick={() => expenses.mutate()}>
                Try again
              </Button>
            </div>
          ) : (
            <TransactionList
              items={expenses.data?.items}
              loading={expenses.isLoading}
              filtered={filtered}
              monthName={monthLabel(month)}
              onEdit={(expense) => setModal({ mode: "edit", expense })}
              onDelete={onDelete}
              onAdd={() => setModal({ mode: "add" })}
              onClearFilters={clearFilters}
            />
          )}
        </div>
      </main>

      {/* Mobile floating add button */}
      <button
        onClick={() => setModal({ mode: "add" })}
        aria-label="Add expense"
        className="focus-ring fixed bottom-6 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-fg shadow-pop transition-transform active:scale-95 sm:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
      </button>

      {modal.mode !== "closed" && categories.data && (
        <ExpenseModal
          categories={categories.data}
          initial={modal.mode === "edit" ? modal.expense : null}
          defaultCategoryId={categoryId}
          onClose={() => setModal({ mode: "closed" })}
          onSaved={async (message) => {
            setModal({ mode: "closed" });
            await refreshExpenseData();
            toast(message);
          }}
        />
      )}
    </>
  );
}
