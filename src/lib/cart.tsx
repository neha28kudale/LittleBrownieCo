import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProducts, type Product, type Variant } from "./products";

export type CartItem = { key: string; productId: string; variantId: string; qty: number };

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
  /** Gift/ribbon choice — set on the cart page, carried through to checkout
   * so it isn't asked twice. */
  isGift: boolean;
  setIsGift: (v: boolean) => void;
  giftMessage: string;
  setGiftMessage: (v: string) => void;
  ribbonFee: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "lbc_cart_v2";
const GIFT_KEY = "lbc_gift_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
      const rawGift = localStorage.getItem(GIFT_KEY);
      if (rawGift) {
        const g = JSON.parse(rawGift);
        setIsGift(!!g.isGift);
        setGiftMessage(g.giftMessage || "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    getProducts().then(setCatalog);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(GIFT_KEY, JSON.stringify({ isGift, giftMessage }));
    } catch {}
  }, [isGift, giftMessage]);

  const add: CartCtx["add"] = (productId, variantId, qty = 1) => {
    setItems((prev) => {
      const key = `${productId}:${variantId}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { key, productId, variantId, qty }];
    });
  };

  const remove: CartCtx["remove"] = (key) => setItems((prev) => prev.filter((i) => i.key !== key));

  const update: CartCtx["update"] = (key, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, qty } : i)),
    );

  const clear = () => {
    setItems([]);
    setIsGift(false);
    setGiftMessage("");
  };

  const detailed = items
    .map((i) => {
      const product = catalog.find((p) => p.id === i.productId);
      const variant = product?.variants.find((v) => v.id === i.variantId);
      if (!product || !variant) return null;
      return { key: i.key, product, variant, qty: i.qty, lineTotal: variant.price * i.qty };
    })
    .filter(Boolean) as DetailedItem[];

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = detailed.reduce((s, i) => s + i.lineTotal, 0);
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
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
