"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

export default function CartLoader() {

  const loadCart = useCart((s) => s.loadCart);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return null;
}