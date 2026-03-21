"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

type User = {
  id: string;
};

type AuthState = {
  user: User | null;
  token: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  loadSession: () => void;
};

function parseJwt(token: string) {
  const base64 = token.split(".")[1];
  const json = atob(base64);
  return JSON.parse(json) as { userId: string };
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: async (email, password) => {
    try {

      const res = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const payload = parseJwt(res.token);

      /**
       * salvar sessão
       */
      localStorage.setItem("bs_token", res.token);
      localStorage.setItem("bs_customer", payload.userId);

      /**
       * salvar cookie (para middleware)
       */
      document.cookie = `bs_token=${res.token}; path=/; max-age=604800`;

      set({
        token: res.token,
        user: { id: payload.userId },
      });

      return true;

    } catch {
      return false;
    }
  },

  logout: () => {

    localStorage.removeItem("bs_token");
    localStorage.removeItem("bs_customer");

    /**
     * remover cookie
     */
    document.cookie = "bs_token=; path=/; max-age=0";

    set({
      token: null,
      user: null,
    });
  },

  loadSession: () => {

    const token = localStorage.getItem("bs_token");

    if (!token) return;

    const payload = parseJwt(token);

    set({
      token,
      user: { id: payload.userId },
    });
  },
}));