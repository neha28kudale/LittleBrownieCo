import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProducts, type Product, type Variant } from "./products";

export type CartItem = {
  key: string;
  productId: string;
  variantId: string;
  qty: number;
};

export type DetailedItem = {
  key: string;
  product: Product;
  variant: Variant;
  qty: number;
  lineTotal: number;
};

export const RIBBON_FEE = 15;

type CartCtx = {
  items: CartItem[];
  add: (productId: string, variantId: string, qty?: number) => void;
  remove: (key: string) => void;
  update: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  detailed: DetailedItem[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  isGift: boolean;
  setIsGift: (v: boolean) => void;
  giftMessage: string;
  setGiftMessage: (v: string) => void;
  ribbonFee: number;
};

const Ctx = createContext<CartCtx | null>(null);

/*
 * v3 intentionally replaces the old cart storage.
 * This prevents old test data from lbc_cart_v2 appearing
 * in the new live cart.
 */
const KEY = "lbc_cart_v3";
const GIFT_KEY = "lbc_gift_v1";

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const merged = new Map<string, CartItem>();

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as CartItem).productId !== "string" ||
      typeof (item as CartItem).variantId !== "string"
    ) {
      continue;
    }

    const productId = (item as CartItem).productId;
    const variantId = (item as CartItem).variantId;
    const qty = Number((item as CartItem).qty);

    if (!Number.isFinite(qty) || qty <= 0) continue;

    const key = `${productId}:${variantId}`;
    const existing = merged.get(key);

    if (existing) {
      merged.set(key, {
        ...existing,
        qty: existing.qty + Math.floor(qty),
      });
    } else {
      merged.set(key, {
        key,
        productId,
        variantId,
        qty: Math.floor(qty),
      });
    }
  }

  return Array.from(merged.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  // Important: don't write the initial [] to localStorage
  // before the existing cart has finished loading.
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(normalizeCartItems(parsed));
      }

      const rawGift = localStorage.getItem(GIFT_KEY);

      if (rawGift) {
        const gift = JSON.parse(rawGift);

        setIsGift(!!gift.isGift);
        setGiftMessage(
          typeof gift.giftMessage === "string" ? gift.giftMessage : "",
        );
      }
    } catch {
      setItems([]);
      setIsGift(false);
      setGiftMessage("");
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    getProducts().then(setCatalog);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(
        GIFT_KEY,
        JSON.stringify({
          isGift,
          giftMessage,
        }),
      );
    } catch {}
  }, [isGift, giftMessage, storageLoaded]);

  const add: CartCtx["add"] = (
    productId,
    variantId,
    qty = 1,
  ) => {
    const safeQty = Math.max(1, Math.floor(qty));

    setItems((prev) => {
      const key = `${productId}:${variantId}`;
      const existing = prev.find((item) => item.key === key);

      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? {
                ...item,
                qty: item.qty + safeQty,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          key,
          productId,
          variantId,
          qty: safeQty,
        },
      ];
    });
  };

  const remove: CartCtx["remove"] = (key) => {
    setItems((prev) =>
      prev.filter((item) => item.key !== key),
    );
  };

  const update: CartCtx["update"] = (key, qty) => {
    const safeQty = Math.floor(qty);

    setItems((prev) =>
      safeQty <= 0
        ? prev.filter((item) => item.key !== key)
        : prev.map((item) =>
            item.key === key
              ? {
                  ...item,
                  qty: safeQty,
                }
              : item,
          ),
    );
  };

  const clear = () => {
    setItems([]);
    setIsGift(false);
    setGiftMessage("");
  };

  const detailed = items
    .map((item) => {
      const product = catalog.find(
        (p) => p.id === item.productId,
      );

      const variant = product?.variants.find(
        (v) => v.id === item.variantId,
      );

      if (!product || !variant) return null;

      return {
        key: item.key,
        product,
        variant,
        qty: item.qty,
        lineTotal: variant.price * item.qty,
      };
    })
    .filter(Boolean) as DetailedItem[];

  const count = items.reduce(
    (total, item) => total + item.qty,
    0,
  );

  const subtotal = detailed.reduce(
    (total, item) => total + item.lineTotal,
    0,
  );

  const ribbonFee = isGift ? RIBBON_FEE : 0;

  return (
    <Ctx.Provider
      value={{
        items,
        add,
        remove,
        update,
        clear,
        count,
        subtotal,
        detailed,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        isGift,
        setIsGift,
        giftMessage,
        setGiftMessage,
        ribbonFee,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useCart must be used inside <CartProvider>",
    );
  }

  return ctx;
}
