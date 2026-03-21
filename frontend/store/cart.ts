"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export type CartItem = {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  quantity: number;
};

export type ShippingOption = {
  name: string;
  method: string;
  price: number;
  deadline: string;
};

type CartApiItem = {
  id: string;
  quantity: number;
  productId: string;
  customerId: string;
  product: {
    id: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    image: string;
  };
};

type CartState = {
  items: CartItem[];

  zipCode: string;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;

  loadCart: () => Promise<void>;

  addItem: (item: Omit<CartItem, "quantity" | "cartItemId">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  increase: (id: string) => Promise<void>;
  decrease: (id: string) => Promise<void>;

  calculateShipping: (zip: string) => Promise<void>;
  selectShipping: (method: string) => void;

  clear: () => void;

  count: () => number;
  subtotal: () => number;
  shipping: () => number;
  total: () => number;
};

function getCustomerId() {
  let id = localStorage.getItem("bs_customer");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bs_customer", id);
  }

  return id;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  zipCode: "",
  shippingOptions: [],
  selectedShipping: null,

  loadCart: async () => {
    const customerId = getCustomerId();

    const data = await apiFetch<CartApiItem[]>(`/cart/${customerId}`);

    const items: CartItem[] = data.map((i: CartApiItem) => ({
      id: i.product.id,
      cartItemId: i.id,
      name: i.product.name,
      price: i.product.price,
      oldPrice: i.product.oldPrice ?? undefined,
      image: `${process.env.NEXT_PUBLIC_API_URL}${i.product.image}`,
      quantity: i.quantity,
    }));

    set({ items });
  },

  addItem: async (item) => {
    const customerId = getCustomerId();

    await apiFetch("/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId: item.id,
        quantity: 1,
        customerId,
      }),
    });

    await get().loadCart();
  },

  removeItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    await apiFetch(`/cart/${item.cartItemId}`, {
      method: "DELETE",
    });

    await get().loadCart();
  },

  increase: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    await apiFetch("/cart/update", {
      method: "PATCH",
      body: JSON.stringify({
        cartItemId: item.cartItemId,
        quantity: item.quantity + 1,
      }),
    });

    await get().loadCart();
  },

  decrease: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const qty = item.quantity - 1;

    if (qty <= 0) {
      await get().removeItem(id);
      return;
    }

    await apiFetch("/cart/update", {
      method: "PATCH",
      body: JSON.stringify({
        cartItemId: item.cartItemId,
        quantity: qty,
      }),
    });

    await get().loadCart();
  },

  calculateShipping: async (zip: string) => {
    const data = await apiFetch<ShippingOption[]>("/shipping/calculate", {
      method: "POST",
      body: JSON.stringify({ cep: zip }),
    });

    set({
      zipCode: zip,
      shippingOptions: data,
      selectedShipping: null,
    });
  },

  selectShipping: (method: string) => {
    const option = get().shippingOptions.find(
      (s) => s.method === method
    );

    if (!option) return;

    set({
      selectedShipping: option,
    });
  },

  clear: () =>
    set({
      items: [],
      shippingOptions: [],
      selectedShipping: null,
      zipCode: "",
    }),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  shipping: () => get().selectedShipping?.price || 0,

  total: () => get().subtotal() + get().shipping(),
}));