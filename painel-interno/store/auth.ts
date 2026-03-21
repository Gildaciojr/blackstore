"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

type AuthState = {
  token: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  loadSession: () => void;
};

export const useAuth = create<AuthState>((set) => ({

  token: null,

  login: async (email, password) => {

    try {

      const res = await apiFetch<{ token: string }>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      /**
       * salvar token
       */
      localStorage.setItem("admin_token", res.token);

      /**
       * cookie para middleware
       */
      document.cookie = `admin_token=${res.token}; path=/; max-age=604800`;

      set({
        token: res.token
      });

      return true;

    } catch {

      return false;

    }
  },

  logout: () => {

    localStorage.removeItem("admin_token");

    /**
     * remover cookie
     */
    document.cookie = "admin_token=; path=/; max-age=0";

    set({
      token: null
    });

    window.location.href = "/login";
  },

  loadSession: () => {

    const token = localStorage.getItem("admin_token");

    if (!token) return;

    set({
      token
    });

  }

}));