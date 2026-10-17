"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Moon, Plus, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { Button, Logo } from "@/components/ui";

export function AppHeader({ onAdd }: { onAdd: () => void }) {
  const { user, logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dark = resolved === "dark";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-lg font-bold tracking-tight">Spendly</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="primary" onClick={onAdd} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add expense
          </Button>

          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-fg"
          >
            {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={open}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-fg text-sm font-bold text-bg"
            >
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </button>
            {open && (
              <div className="absolute right-0 top-12 w-56 animate-sheet rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-line" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
