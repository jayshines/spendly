"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-surface shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "dark";
    size?: "md" | "lg";
  }
>(function Button({ variant = "secondary", size = "md", className, ...props }, ref) {
  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "h-10 px-5 text-sm" : "h-14 px-8 text-base",
        variant === "primary" && "bg-accent text-accent-fg hover:brightness-95",
        variant === "dark" && "bg-fg text-bg hover:opacity-90",
        variant === "secondary" &&
          "border border-line bg-surface text-fg hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-fg",
        className
      )}
    />
  );
});

export const Field = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Field({ label, className, id, ...props }, ref) {
  const fieldId = id ?? `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={fieldId} className="label mb-1.5 block">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        {...props}
        className={cn(
          "focus-ring h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] placeholder:text-faint",
          className
        )}
      />
    </div>
  );
});

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="rgb(var(--accent))" />
      <path
        d="M9 20.5c2.2-.2 3.4-1.6 4.3-3.7.9-2.1 2-4.1 4.3-4.4 1.7-.2 3 .5 4.4 2"
        fill="none"
        stroke="rgb(var(--accent-fg))"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="22.8" cy="21" r="2.1" fill="rgb(var(--accent-fg))" />
    </svg>
  );
}
