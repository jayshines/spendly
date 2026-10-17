"use client";

import { SWRConfig } from "swr";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          shouldRetryOnError: false,
          keepPreviousData: true,
        }}
      >
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
