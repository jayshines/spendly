"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Category, Expense, ExpenseInput } from "@/lib/types";
import { cn, todayISO } from "@/lib/utils";
import { Button } from "@/components/ui";
import { CategoryIcon } from "@/components/category-icon";

const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayISO(d);
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ExpenseModal({
  categories,
  initial,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initial: Expense | null; // null = adding
  defaultCategoryId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const editing = initial !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.category.id ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Focus the amount, lock page scroll, restore focus on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    amountRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Esc closes; Tab stays inside the dialog
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const remove = async () => {
    if (!initial || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/expenses/${initial.id}`, { method: "DELETE" });
      onSaved("Expense deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the expense");
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const value = Number(amount);
  const valid =
    amount !== "" && value > 0 && value <= 999999999 && merchant.trim() !== "" && categoryId !== "" && date !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    const body: ExpenseInput = {
      merchant: merchant.trim(),
      amount: Math.round(value * 100) / 100,
      date,
      categoryId,
      ...(note.trim() ? { note: note.trim() } : { note: "" }),
    };
    try {
      if (editing) {
        await api(`/expenses/${initial.id}`, { method: "PATCH", json: body });
      } else {
        await api("/expenses", { method: "POST", json: body });
      }
      onSaved(editing ? "Expense updated" : "Expense added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the expense");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      onKeyDown={onKeyDown}
    >
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-fade bg-black/50 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-title"
        className="relative flex max-h-[100dvh] w-full max-w-md animate-sheet flex-col overflow-y-auto rounded-t-[32px] bg-surface p-6 shadow-pop sm:rounded-[32px]"
      >
        <div className="flex items-center justify-between">
          <h2 id="expense-title" className="text-base font-bold">
            {editing ? "Edit expense" : "Add expense"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-2" noValidate>
          {/* Big amount */}
          <label htmlFor="amount" className="sr-only">
            Amount in dollars
          </label>
          <div className="flex items-baseline justify-center py-7">
            <span className="mr-1.5 text-3xl font-bold text-faint">$</span>
            {/* Mirror span sizes the input to its content, so "$" always hugs the number */}
            <span className="inline-grid">
              <span
                aria-hidden="true"
                className="num invisible whitespace-pre text-6xl font-bold tracking-tight [grid-area:1/1]"
              >
                {amount || "0.00"}
              </span>
              <input
                ref={amountRef}
                id="amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d{0,9}(\.\d{0,2})?$/.test(v)) setAmount(v);
                }}
                onBlur={() => amount && setAmount(Number(amount).toFixed(2))}
                className="num w-full min-w-0 bg-transparent text-6xl font-bold tracking-tight outline-none placeholder:text-line [grid-area:1/1]"
              />
            </span>
          </div>

          {/* Category chips */}
          <p className="label mb-2">Category</p>
          <div role="radiogroup" aria-label="Category" className="grid grid-cols-4 gap-2">
            {categories.map((c) => {
              const on = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "focus-ring flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 text-[11px] font-semibold transition-all",
                    on ? "bg-surface-2" : "border-transparent text-muted hover:bg-surface-2/60"
                  )}
                  style={on ? { borderColor: c.color } : undefined}
                >
                  <CategoryIcon icon={c.icon} color={c.color} size={36} />
                  <span className="w-full truncate text-center">{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Details */}
          <div className="mt-5 space-y-3">
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Where did you spend it?"
              aria-label="Merchant"
              maxLength={80}
              className="focus-ring h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] font-medium placeholder:font-normal placeholder:text-faint"
            />
            <div className="flex items-center gap-2" role="group" aria-label="Date">
              {(
                [
                  ["Today", todayISO()],
                  ["Yesterday", yesterdayISO()],
                ] as const
              ).map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={date === value}
                  onClick={() => setDate(value)}
                  className={cn(
                    "focus-ring h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
                    date === value
                      ? "border-fg bg-fg text-bg"
                      : "border-line text-muted hover:border-faint hover:text-fg"
                  )}
                >
                  {label}
                </button>
              ))}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Pick a date"
                max={todayISO()}
                className="focus-ring h-10 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-muted"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              aria-label="Note"
              maxLength={280}
              className="focus-ring h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] placeholder:text-faint"
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={!valid || busy}>
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {editing ? "Save changes" : "Add expense"}
          </Button>

          {editing && (
            <div className="mt-3 flex justify-center">
              {confirmDelete ? (
                <div className="flex animate-fade items-center gap-2">
                  <span className="text-sm text-muted">Delete this expense?</span>
                  <Button type="button" className="h-9 px-4 text-xs" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </Button>
                  <Button
                    type="button"
                    className="h-9 bg-rose-500 px-4 text-xs text-white hover:bg-rose-600"
                    disabled={busy}
                    onClick={remove}
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-rose-500/10 hover:text-rose-600"
                >
                  Delete expense
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
