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
  variantId?: string | null;
  size?: string | null;
};

export type ShippingOption = {
  name: string;
  method: string;
  price: number;
  deadline: string;
};

type CouponResponse = {
  code: string;
  discount: number;
};

type CartApiItem = {
  id: string;
  quantity: number;
  productId: string;
  customerId: string;
  variantId?: string | null;
  size?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    image: string;
  };
  variant?: {
    id: string;
    size: string;
  } | null;
};

type CartState = {
  items: CartItem[];

  zipCode: string;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;

  appliedCouponCode: string | null;
  couponPercent: number;

  loadCart: () => Promise<void>;

  addItem: (item: Omit<CartItem, "quantity" | "cartItemId">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  increase: (id: string) => Promise<void>;
  decrease: (id: string) => Promise<void>;

  calculateShipping: (zip: string) => Promise<void>;
  selectShipping: (method: string) => void;

  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;

  clear: () => void;

  count: () => number;
  subtotal: () => number;
  discount: () => number;
  shipping: () => number;
  total: () => number;
};

function getCustomerId() {
  const id = localStorage.getItem("bs_customer");
  if (!id) {
    throw new Error("Usuário não autenticado");
  }
  return id;
}

function resolveImage(url: string) {
  if (!url) return "";
  if (url.startsWith("/images")) return url;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  zipCode: "",
  shippingOptions: [],
  selectedShipping: null,

  appliedCouponCode: null,
  couponPercent: 0,

  loadCart: async () => {
    try {
      const customerId = getCustomerId();
      const data = await apiFetch<CartApiItem[]>(`/cart/${customerId}`);

      const items: CartItem[] = data.map((i: CartApiItem) => ({
        id: i.product.id,
        cartItemId: i.id,
        name: i.product.name,
        price: i.product.price,
        oldPrice: i.product.oldPrice ?? undefined,
        image: resolveImage(i.product.image),
        quantity: i.quantity,
        variantId: i.variantId ?? null,
        size: i.variant?.size ?? null,
      }));

      set({ items });
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
    }
  },

  // 🔥 ADIÇÃO OTIMIZADA COM ATUALIZAÇÃO INSTANTÂNEA DE UI
  addItem: async (item) => {
    try {
      const customerId = getCustomerId();

      const existingIndex = get().items.findIndex(
        (i) =>
          i.id === item.id &&
          (i.variantId ?? null) === (item.variantId ?? null),
      );

      // Atualização otimista imediata na UI
      if (existingIndex > -1) {
        const updated = [...get().items];
        updated[existingIndex].quantity += 1;
        set({ items: updated });

        await apiFetch("/cart/update", {
          method: "PATCH",
          body: JSON.stringify({
            cartItemId: updated[existingIndex].cartItemId,
            quantity: updated[existingIndex].quantity,
          }),
        });
      } else {
        const tempId = `temp-${Date.now()}`;
        const newItem: CartItem = {
          id: item.id,
          cartItemId: tempId,
          name: item.name,
          price: item.price,
          oldPrice: item.oldPrice,
          image: item.image,
          quantity: 1,
          variantId: item.variantId ?? null,
          size: item.size ?? null,
        };

        set({ items: [...get().items, newItem] });

        await apiFetch("/cart/add", {
          method: "POST",
          body: JSON.stringify({
            productId: item.id,
            quantity: 1,
            customerId,
            variantId: item.variantId ?? null,
            size: item.size ?? null,
          }),
        });
      }

      // Sincroniza em background sem bloquear
      void get().loadCart();
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
      void get().loadCart(); // Reverte se falhar
      throw err;
    }
  },

  removeItem: async (id) => {
    try {
      set({ items: get().items.filter((i) => i.cartItemId !== id) });
      await apiFetch(`/cart/${id}`, { method: "DELETE" });
      void get().loadCart();
    } catch (err) {
      console.error("Erro ao remover item:", err);
      void get().loadCart();
    }
  },

  increase: async (id) => {
    try {
      const updated = get().items.map((i) =>
        i.cartItemId === id ? { ...i, quantity: i.quantity + 1 } : i
      );
      set({ items: updated });

      const item = updated.find((i) => i.cartItemId === id);
      if (!item) return;

      await apiFetch("/cart/update", {
        method: "PATCH",
        body: JSON.stringify({
          cartItemId: item.cartItemId,
          quantity: item.quantity,
        }),
      });
      void get().loadCart();
    } catch (err) {
      console.error("Erro ao aumentar quantidade:", err);
      void get().loadCart();
    }
  },

  decrease: async (id) => {
    try {
      const item = get().items.find((i) => i.cartItemId === id);
      if (!item) return;

      const qty = item.quantity - 1;
      if (qty <= 0) {
        await get().removeItem(id);
        return;
      }

      const updated = get().items.map((i) =>
        i.cartItemId === id ? { ...i, quantity: qty } : i
      );
      set({ items: updated });

      await apiFetch("/cart/update", {
        method: "PATCH",
        body: JSON.stringify({
          cartItemId: item.cartItemId,
          quantity: qty,
        }),
      });
      void get().loadCart();
    } catch (err) {
      console.error("Erro ao diminuir quantidade:", err);
      void get().loadCart();
    }
  },

  calculateShipping: async (zip: string) => {
    try {
      const normalizedZip = zip.replace(/\D/g, "");
      const data = await apiFetch<ShippingOption[]>("/shipping/calculate", {
        method: "POST",
        body: JSON.stringify({ cep: normalizedZip }),
      });

      set({
        zipCode: normalizedZip,
        shippingOptions: data,
        selectedShipping: data[0] || null, // Seleciona automaticamente a primeira opção para agilizar o checkout
      });
    } catch (err) {
      console.error("Erro ao calcular frete:", err);
      throw err;
    }
  },

  selectShipping: (method: string) => {
    const option = get().shippingOptions.find((s) => s.method === method);
    if (!option) return;
    set({ selectedShipping: option });
  },

  applyCoupon: async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error("Cupom inválido");

    const coupon = await apiFetch<CouponResponse>(`/coupons/${normalizedCode}`);
    set({
      appliedCouponCode: coupon.code,
      couponPercent: coupon.discount,
    });
  },

  removeCoupon: () =>
    set({
      appliedCouponCode: null,
      couponPercent: 0,
    }),

  clear: () =>
    set({
      items: [],
      shippingOptions: [],
      selectedShipping: null,
      zipCode: "",
      appliedCouponCode: null,
      couponPercent: 0,
    }),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  discount: () => {
    const subtotal = get().subtotal();
    const percent = get().couponPercent;
    if (subtotal <= 0 || percent <= 0) return 0;
    const raw = subtotal * (percent / 100);
    const value = Number(raw.toFixed(2));
    return value > subtotal ? subtotal : value;
  },

  shipping: () => get().selectedShipping?.price || 0,

  total: () => {
    const subtotal = get().subtotal();
    const discount = get().discount();
    const shipping = get().shipping();
    const total = subtotal - discount + shipping;
    return total < 0 ? 0 : total;
  },
}));