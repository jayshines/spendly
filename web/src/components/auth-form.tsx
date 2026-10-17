"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button, Field, Logo } from "@/components/ui";
import { MerchantAvatar } from "@/components/category-icon";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const { user, loading, login, register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in? Go straight to the app.
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-fg p-12 text-bg lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight">Spendly</span>
        </div>

        {/* A small slice of the real product, so the page shows what the app is */}
        <div className="mx-auto w-full max-w-[380px] -rotate-2 rounded-3xl bg-bg p-5 text-fg shadow-pop" aria-hidden="true">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">October</p>
            <p className="num rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">-12.4%</p>
          </div>
          <p className="num mt-2 text-4xl font-bold tracking-tight">
            $1,284<span className="text-lg text-faint">.50</span>
          </p>
          <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
            <span className="w-[38%] bg-[#f97316]" />
            <span className="w-[24%] bg-[#3b82f6]" />
            <span className="w-[20%] bg-[#ec4899]" />
            <span className="w-[18%] bg-[#8b5cf6]" />
          </div>
          <ul className="mt-4 divide-y divide-line">
            {(
              [
                ["Blue Bottle Coffee", "Food & drink", "$6.50", "#f97316"],
                ["Uber", "Transport", "$18.20", "#3b82f6"],
                ["Trader Joe's", "Groceries", "$64.12", "#16a34a"],
              ] as const
            ).map(([name, cat, amt, color]) => (
              <li key={name} className="flex items-center gap-3 py-2.5">
                <MerchantAvatar name={name} categoryColor={color} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-tight">{name}</p>
                  <p className="text-[11px] text-muted">{cat}</p>
                </div>
                <p className="num text-[13px] font-bold">{amt}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-md">
          <p className="text-4xl font-bold leading-[1.1] tracking-tight">
            Know where your money goes, without the spreadsheet.
          </p>
          <p className="mt-4 text-base opacity-60">
            Log an expense in seconds, see your month at a glance, and spot the
            categories that quietly add up.
          </p>
        </div>
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-lg font-bold tracking-tight">Spendly</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isLogin
              ? "Log in to see your spending."
              : "Start tracking in under a minute."}
          </p>

          <div className="mt-8 space-y-4">
            {!isLogin && (
              <Field
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Alex Morgan"
                required
                maxLength={80}
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Your password" : "At least 8 characters"}
              required
              minLength={isLogin ? undefined : 8}
              maxLength={72}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-6 w-full"
            disabled={busy}
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLogin ? "Log in" : "Create account"}
          </Button>

          {isLogin && (
            <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-xs text-muted">
              Want to look around first? Use{" "}
              <button
                type="button"
                className="font-semibold text-fg underline-offset-2 hover:underline"
                onClick={() => {
                  setEmail("demo@spendly.dev");
                  setPassword("demo12345");
                }}
              >
                the demo account
              </button>
              .
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {isLogin ? "New to Spendly? " : "Already have an account? "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-semibold text-fg hover:underline"
            >
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
