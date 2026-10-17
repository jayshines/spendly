"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Check, CircleAlert } from "lucide-react";

type Toast = { id: number; text: string; kind: "ok" | "error" };
type Push = (text: string, kind?: Toast["kind"]) => void;

const ToastContext = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback<Push>((text, kind = "ok") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex animate-sheet items-center gap-2.5 rounded-full bg-fg py-2.5 pl-3 pr-4 text-sm font-medium text-bg shadow-pop"
          >
            {t.kind === "ok" ? (
              <Check className="h-4 w-4 text-accent" strokeWidth={3} />
            ) : (
              <CircleAlert className="h-4 w-4 text-rose-400" />
            )}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
