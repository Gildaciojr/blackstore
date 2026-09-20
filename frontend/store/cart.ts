"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

const GUEST_CART_STORAGE_KEY = "bs_guest_cart";
const GUEST_CART_ID_PREFIX = "guest:";

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

export type GuestCartSyncResult = {
  synced: number;
  failed: number;
  errors: string[];
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
  syncGuestCart: () => Promise<GuestCartSyncResult>;

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

function getAuthenticatedCustomerId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("bs_token");
  const customerId = localStorage.getItem("bs_customer");

  if (!token || !customerId) {
    return null;
  }

  return customerId;
}

function createGuestCartItemId(productId: string, variantId?: string | null) {
  return `${GUEST_CART_ID_PREFIX}${productId}:${variantId ?? "base"}`;
}

function isGuestCartItemId(id: string) {
  return id.startsWith(GUEST_CART_ID_PREFIX);
}

function isStoredCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.cartItemId === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.image === "string" &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      return [];
    }

    return parsed.filter(isStoredCartItem);
  } catch {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (items.length === 0) {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return;
  }

  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
}

function resolveImage(url: string) {
  if (!url) return "";
  if (url.startsWith("/images")) return url;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function mapApiCartItem(item: CartApiItem): CartItem {
  return {
    id: item.product.id,
    cartItemId: item.id,
    name: item.product.name,
    price: item.product.price,
    oldPrice: item.product.oldPrice ?? undefined,
    image: resolveImage(item.product.image),
    quantity: item.quantity,
    variantId: item.variantId ?? null,
    size: item.variant?.size ?? null,
  };
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  zipCode: "",
  shippingOptions: [],
  selectedShipping: null,

  appliedCouponCode: null,
  couponPercent: 0,

  loadCart: async () => {
    const customerId = getAuthenticatedCustomerId();

    if (!customerId) {
      set({
        items: readGuestCart(),
      });
      return;
    }

    try {
      const data = await apiFetch<CartApiItem[]>(`/cart/${customerId}`);

      set({
        items: data.map(mapApiCartItem),
      });
    } catch (err) {
      console.error("Erro ao carregar carrinho autenticado:", err);
    }
  },

  syncGuestCart: async () => {
    const customerId = getAuthenticatedCustomerId();

    if (!customerId) {
      throw new Error("Não é possível sincronizar a sacola sem autenticação");
    }

    const guestItems = readGuestCart();

    if (guestItems.length === 0) {
      await get().loadCart();

      return {
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    let synced = 0;
    const failedItems: CartItem[] = [];
    const errors: string[] = [];

    for (const item of guestItems) {
      try {
        await apiFetch("/cart/add", {
          method: "POST",
          body: JSON.stringify({
            productId: item.id,
            quantity: item.quantity,
            customerId,
            variantId: item.variantId ?? null,
            size: item.size ?? null,
          }),
        });

        synced += 1;
      } catch (error) {
        failedItems.push(item);

        errors.push(
          error instanceof Error
            ? error.message
            : `Não foi possível sincronizar ${item.name}`,
        );
      }
    }

    /*
     * Itens sincronizados deixam de existir no guest cart.
     *
     * Itens que falharam permanecem armazenados para não haver
     * perda silenciosa da sacola do cliente.
     */
    writeGuestCart(failedItems);

    await get().loadCart();

    /*
     * Mantém eventuais itens não sincronizados visíveis nesta sessão
     * para que o cliente possa revisá-los/removê-los.
     */
    if (failedItems.length > 0) {
      set({
        items: [...get().items, ...failedItems],
      });
    }

    return {
      synced,
      failed: failedItems.length,
      errors,
    };
  },

  addItem: async (item) => {
    const customerId = getAuthenticatedCustomerId();

    /*
     * VISITANTE:
     * a sacola é local e persistente.
     *
     * Nenhuma reserva de estoque é criada aqui.
     */
    if (!customerId) {
      const guestItems = readGuestCart();

      const existingIndex = guestItems.findIndex(
        (current) =>
          current.id === item.id &&
          (current.variantId ?? null) === (item.variantId ?? null),
      );

      let updated: CartItem[];

      if (existingIndex >= 0) {
        updated = guestItems.map((current, index) =>
          index === existingIndex
            ? {
                ...current,
                quantity: current.quantity + 1,
              }
            : current,
        );
      } else {
        updated = [
          ...guestItems,
          {
            id: item.id,
            cartItemId: createGuestCartItemId(item.id, item.variantId),
            name: item.name,
            price: item.price,
            oldPrice: item.oldPrice,
            image: item.image,
            quantity: 1,
            variantId: item.variantId ?? null,
            size: item.size ?? null,
          },
        ];
      }

      writeGuestCart(updated);
      set({ items: updated });

      return;
    }

    /*
     * CLIENTE AUTENTICADO:
     * permanece utilizando o carrinho persistido no backend.
     */
    try {
      const existingIndex = get().items.findIndex(
        (current) =>
          !isGuestCartItemId(current.cartItemId) &&
          current.id === item.id &&
          (current.variantId ?? null) === (item.variantId ?? null),
      );

      if (existingIndex > -1) {
        const updated = [...get().items];
        const current = updated[existingIndex];

        updated[existingIndex] = {
          ...current,
          quantity: current.quantity + 1,
        };

        set({ items: updated });

        await apiFetch("/cart/update", {
          method: "PATCH",
          body: JSON.stringify({
            cartItemId: updated[existingIndex].cartItemId,
            quantity: updated[existingIndex].quantity,
          }),
        });
      } else {
        const tempId = `temp-${crypto.randomUUID()}`;

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

        set({
          items: [...get().items, newItem],
        });

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

      void get().loadCart();
    } catch (err) {
      console.error("Erro ao adicionar item:", err);

      void get().loadCart();
      throw err;
    }
  },

  removeItem: async (id) => {
    const customerId = getAuthenticatedCustomerId();

    if (!customerId || isGuestCartItemId(id)) {
      const updated = readGuestCart().filter((item) => item.cartItemId !== id);

      writeGuestCart(updated);

      set({
        items: get().items.filter((item) => item.cartItemId !== id),
      });

      return;
    }

    try {
      set({
        items: get().items.filter((item) => item.cartItemId !== id),
      });

      await apiFetch(`/cart/${id}`, {
        method: "DELETE",
      });

      void get().loadCart();
    } catch (err) {
      console.error("Erro ao remover item:", err);

      void get().loadCart();
    }
  },

  increase: async (id) => {
    const customerId = getAuthenticatedCustomerId();

    if (!customerId || isGuestCartItemId(id)) {
      const updatedGuest = readGuestCart().map((item) =>
        item.cartItemId === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      );

      writeGuestCart(updatedGuest);

      set({
        items: get().items.map((item) =>
          item.cartItemId === id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        ),
      });

      return;
    }

    try {
      const updated = get().items.map((item) =>
        item.cartItemId === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      );

      set({ items: updated });

      const item = updated.find((current) => current.cartItemId === id);

      if (!item) {
        return;
      }

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
    const customerId = getAuthenticatedCustomerId();

    if (!customerId || isGuestCartItemId(id)) {
      const current = readGuestCart().find((item) => item.cartItemId === id);

      if (!current) {
        return;
      }

      if (current.quantity <= 1) {
        await get().removeItem(id);
        return;
      }

      const updatedGuest = readGuestCart().map((item) =>
        item.cartItemId === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item,
      );

      writeGuestCart(updatedGuest);

      set({
        items: get().items.map((item) =>
          item.cartItemId === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        ),
      });

      return;
    }

    try {
      const item = get().items.find((current) => current.cartItemId === id);

      if (!item) {
        return;
      }

      const quantity = item.quantity - 1;

      if (quantity <= 0) {
        await get().removeItem(id);
        return;
      }

      const updated = get().items.map((current) =>
        current.cartItemId === id
          ? {
              ...current,
              quantity,
            }
          : current,
      );

      set({ items: updated });

      await apiFetch("/cart/update", {
        method: "PATCH",
        body: JSON.stringify({
          cartItemId: item.cartItemId,
          quantity,
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
        body: JSON.stringify({
          cep: normalizedZip,
        }),
      });

      set({
        zipCode: normalizedZip,
        shippingOptions: data,
        selectedShipping: data[0] || null,
      });
    } catch (err) {
      console.error("Erro ao calcular frete:", err);

      throw err;
    }
  },

  selectShipping: (method: string) => {
    const option = get().shippingOptions.find(
      (shippingOption) => shippingOption.method === method,
    );

    if (!option) {
      return;
    }

    set({
      selectedShipping: option,
    });
  },

  applyCoupon: async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error("Cupom inválido");
    }

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

  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }

    set({
      items: [],
      shippingOptions: [],
      selectedShipping: null,
      zipCode: "",
      appliedCouponCode: null,
      couponPercent: 0,
    });
  },

  count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  discount: () => {
    const subtotal = get().subtotal();
    const percent = get().couponPercent;

    if (subtotal <= 0 || percent <= 0) {
      return 0;
    }

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
