"use client";

import { useEffect } from "react";

import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function CartLoader() {
  const loadCart = useCart((state) => state.loadCart);

  const customerId = useAuth((state) => state.user?.id ?? null);

  useEffect(() => {
    void loadCart();
  }, [loadCart, customerId]);

  return null;
}
