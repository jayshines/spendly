"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { api, tokenStore, UNAUTHORIZED_EVENT } from "@/lib/api";
import type { User } from "@/lib/types";

type Session = { accessToken: string; user: User };

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    mutate(() => true, undefined, { revalidate: false }); // drop cached data
  }, []);

  // Restore the session from a saved token
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API signs the user out and sends them to /login
  useEffect(() => {
    const onUnauthorized = () => {
      signOut();
      router.replace("/login");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router, signOut]);

  const start = (s: Session) => {
    tokenStore.set(s.accessToken);
    setUser(s.user);
  };

  const value: Ctx = {
    user,
    loading,
    login: async (email, password) =>
      start(await api<Session>("/auth/login", { method: "POST", json: { email, password } })),
    register: async (name, email, password) =>
      start(
        await api<Session>("/auth/register", {
          method: "POST",
          json: { name, email, password },
        })
      ),
    logout: () => {
      signOut();
      router.replace("/login");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
