"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/auth";

export default function AuthLoader() {

  const loadSession = useAuth((s) => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return null;
}