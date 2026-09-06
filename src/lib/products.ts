// Real product photography, supplied directly by the bakery (Aug 2026 drive
// share) — extracted from the brand's own order-form PDF and photo library.
// These are plain local imports (bundled by Vite), not remote CDN pointers,
// so the site no longer depends on an external Lovable-hosted domain staying
// online to render images.
import logo from "@/assets/real/logo.png";
import tubPhoto from "@/assets/real/tub.jpg";
import tubAssortedPhoto from "@/assets/real/tub-assorted.jpg";
import loafPhoto from "@/assets/real/loaf.jpg";
import assortedBoxPhoto from "@/assets/real/assorted-box.jpg";
import littleBoxPhoto from "@/assets/real/little-box.jpg";
import slabPhoto from "@/assets/real/slab.jpg";
import lavaPhoto from "@/assets/real/lava-cake.jpg";
import loadedCakePhoto from "@/assets/real/loaded-cake.jpg";
import dipsPhoto from "@/assets/real/dips.jpg";
import ribbonPhoto from "@/assets/real/ribbon.jpg";
import sustainablePackagingPhoto from "@/assets/real/sustainable-packaging.jpg";
import galleryPhoto1 from "@/assets/real/gallery-1.jpg";
import galleryPhoto2 from "@/assets/real/gallery-2.jpg";
import galleryPhoto3 from "@/assets/real/gallery-3.jpg";
import galleryPhoto4 from "@/assets/real/gallery-4.jpg";
import galleryPhoto5 from "@/assets/real/gallery-5.jpg";
import galleryPhoto6 from "@/assets/real/gallery-6.jpg";
import galleryPhoto7 from "@/assets/real/gallery-7.jpg";
import galleryPhoto8 from "@/assets/real/gallery-8.jpg";
import heroPhoto from "@/assets/real/hero.jpg";
import headerBannerPhoto from "@/assets/header-banner.png";
import biteSizedHandPhoto from "@/assets/bite-sized-hand.jpg";

// Home page hero gallery photos — auto-switching image strip
import homeImg1 from "@/assets/himg1.jpg";
import homeImg2 from "@/assets/himg2.jpeg";
import homeImg3 from "@/assets/himg3.jpeg";
import homeImg4 from "@/assets/himg4.jpg";
import homeImg5 from "@/assets/himg5.jpg";
import homeImg6 from "@/assets/himg6.jpeg";
import homeImg7 from "@/assets/himg7.jpeg";
import homeImg8 from "@/assets/himg8.jpeg";

// Real gifting photography supplied earlier — plain local imports too
import hamperBagHeart from "@/assets/gifting/hamper-bag-heart.png";
import hamperWoodenBox from "@/assets/gifting/hamper-wooden-box.png";
import hamperValentineSet from "@/assets/gifting/hamper-valentine-set.png";
import hamperRibbonBoxes from "@/assets/gifting/hamper-ribbon-boxes.png";
import hamperBowCloseup from "@/assets/gifting/hamper-bow-closeup.png";
import hamperPostcardFlowers from "@/assets/gifting/hamper-postcard-flowers.png";

export const IMG = {
  logo,
  heroPortrait: heroPhoto,
  headerBanner: headerBannerPhoto,
  biteSizedHand: biteSizedHandPhoto,
  tub: tubPhoto,
  tubSquare: tubPhoto,
  loaf: loafPhoto,
  loafSquare: loafPhoto,
  assortedTub: tubAssortedPhoto,
  assortedTubSquare: tubAssortedPhoto,
  assortedBox: assortedBoxPhoto,
  assortedBoxSquare: assortedBoxPhoto,
  littleBox: littleBoxPhoto,
  littleBoxSquare: littleBoxPhoto,
  slab: slabPhoto,
  slabSquare: slabPhoto,
  lava: lavaPhoto,
  lavaSquare: lavaPhoto,
  cake: loadedCakePhoto,
  cakeSquare: loadedCakePhoto,
  dips: dipsPhoto,
  dipsSquare: dipsPhoto,
  ribbon: ribbonPhoto,
  sustainablePackaging: sustainablePackagingPhoto,
  about1: galleryPhoto2,
  about2: galleryPhoto4,
  gallery1: galleryPhoto1,
  gallery2: galleryPhoto2,
  gallery3: galleryPhoto3,
  gallery4: galleryPhoto4,
  gallery5: galleryPhoto5,
  gallery6: galleryPhoto6,
  gallery7: galleryPhoto7,
  gallery8: galleryPhoto8,
  homeImg1,
  homeImg2,
  homeImg3,
  homeImg4,
  homeImg5,
  homeImg6,
  homeImg7,
  homeImg8,
  // Real gifting photography — plain local imports, not Lovable CDN assets
  hamperBagHeart,
  hamperWoodenBox,
  hamperValentineSet,
  hamperRibbonBoxes,
  hamperBowCloseup,
  hamperPostcardFlowers,
};

/** Real, non-stock photos of actual packed hampers for the gifting page gallery. */
export const giftingGallery = [
  { src: IMG.hamperValentineSet, alt: "Valentine's gifting set with brownies, dip and card" },
  { src: IMG.hamperRibbonBoxes, alt: "Brownie loaf box and tin, ribbon-tied" },
  { src: IMG.hamperBowCloseup, alt: "Close-up of a satin bow on a kraft brownie box" },
  { src: IMG.hamperPostcardFlowers, alt: "Gift hamper with flowers and a handwritten postcard" },
  { src: IMG.hamperWoodenBox, alt: "Ribbon-tied wooden brownie gift box" },
  { src: IMG.hamperBagHeart, alt: "Kraft gift bag with hand-stamped hearts" },
];

/** `flavour` is optional — leave it unset for a size/option that applies to
 * every flavour. Set it to tie that size+price combo to one specific
 * flavour (e.g. "1kg" can be ₹665 for Dark Chocolate and ₹700 for Nutella
 * by adding two rows with the same label but different flavour + price). */
export type Variant = { id: string; label: string; price: number; flavour?: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: "Mini Bites" | "Cakes" | "Hampers" | "Add-ons" | "Limited Editions";
  image: string;
  imagePosition?: string;
  square: string;
  gallery: string[];
  galleryPositions?: string[];
  variants: Variant[];
  flavours: string[];
  ingredients: string[];
  description: string;
  bestSeller?: boolean;
  signature?: boolean;
  isActive?: boolean;
};

import { supabase } from "./supabase";

/**
 * Fallback/seed catalog. Supabase (`products` + `product_variants` tables,
 * see supabase/migrations/) is the real source of truth — this array is
 * only used if that fetch fails (offline, misconfigured env) so the site
 * still renders something, and it's what supabase/migrations/0003_seed_products.sql
 * was generated from.
 */
// Product line-up, flavours and prices below are taken directly from the
// bakery's own order form ("Menu-items with price.pdf", shared Aug 2026).
// Update prices here (and keep supabase/migrations/0003_seed_products.sql in
// sync) whenever the owner revises pricing.
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "mini-brownie-tub",
    name: "Mini Brownie Tub",
    tagline: "Soft, fudgy mini brownie bites in a kraft tub.",
    category: "Mini Bites",
    image: IMG.tub,
    square: IMG.tubSquare,
    gallery: [IMG.tub, IMG.assortedTub, IMG.biteSizedHand],
    variants: [
      { id: "6-dark", label: "6 pcs · Dark Chocolate", price: 215 },
      { id: "6-walnut", label: "6 pcs · Walnut", price: 265 },
      { id: "6-nutella", label: "6 pcs · Nutella", price: 245 },
      { id: "6-assorted", label: "6 pcs · Assorted (2 each)", price: 295 },
      { id: "12-dark", label: "12 pcs · Dark Chocolate", price: 385 },
      { id: "12-walnut", label: "12 pcs · Walnut", price: 465 },
      { id: "12-nutella", label: "12 pcs · Nutella", price: 425 },
      { id: "12-assorted", label: "12 pcs · Assorted (4 each)", price: 475 },
      { id: "24-dark", label: "24 pcs · Dark Chocolate", price: 665 },
      { id: "24-walnut", label: "24 pcs · Walnut", price: 775 },
      { id: "24-nutella", label: "24 pcs · Nutella", price: 745 },
      { id: "24-assorted", label: "24 pcs · Assorted (8 each)", price: 835 },
    ],
    flavours: ["Dark Chocolate", "Walnut", "Nutella", "Assorted"],
    ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cane sugar", "All-purpose flour"],
    description:
      "It is filled with mini brownie bites that are soft, fudgy, and melt-in-your-mouth delicious. Designed for easy munching, this tub is ideal for casual snacking, sharing with friends, or enjoying a quick treat whenever a craving hits. Just the right size to satisfy your sweet tooth—one bite at a time! The assorted mini brownie tub consists of all 3 flavours (Dark Chocolate | Walnut | Nutella): 2 pcs of each flavour in the 6 pcs assorted tub, 4 pcs of each flavour in the 12 pcs assorted tub, and 8 pcs of each flavour in the 24 pcs assorted tub.",
    bestSeller: true,
    signature: true,
  },
  {
    id: "p3",
    slug: "mini-brownie-loaf",
    name: "Mini Brownie Loaf",
    tagline: "A dense, gooey single-serve loaf.",
    category: "Mini Bites",
    image: IMG.loaf,
    square: IMG.loafSquare,
    gallery: [IMG.loaf],
    variants: [
      { id: "1-dark", label: "1 loaf · Dark Chocolate", price: 355 },
      { id: "1-walnut", label: "1 loaf · Walnut", price: 425 },
      { id: "1-nutella", label: "1 loaf · Nutella", price: 385 },
      { id: "2-dark", label: "2 loaves · Dark Chocolate", price: 710 },
      { id: "2-walnut", label: "2 loaves · Walnut", price: 850 },
      { id: "2-nutella", label: "2 loaves · Nutella", price: 770 },
      { id: "5-dark", label: "5 loaves · Dark Chocolate", price: 1775 },
      { id: "5-walnut", label: "5 loaves · Walnut", price: 2125 },
      { id: "5-nutella", label: "5 loaves · Nutella", price: 1925 },
    ],
    flavours: ["Dark Chocolate", "Walnut", "Nutella"],
    ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Vanilla", "Flour"],
    description:
      "It is a rich, fudgy brownie baked in the shape of a mini loaf. It is dense, gooey with a crinkle top, offering the perfect balance of indulgence in a cute, single-serve size. Ideal for gifting, snacking, or satisfying solo cravings without overdoing it!",
    bestSeller: true,
    signature: true,
  },
  {
    id: "p4",
    slug: "assorted-brownie-box",
    name: "Assorted Brownie Box",
    tagline: "Bite-sized squares, mixed flavours.",
    category: "Hampers",
    image: IMG.assortedBox,
    square: IMG.assortedBoxSquare,
    gallery: [IMG.assortedBox],
    variants: [
      { id: "dark-nutella", label: "2 pcs Dark Chocolate + 2 pcs Nutella", price: 385 },
      { id: "dark-walnut", label: "2 pcs Dark Chocolate + 2 pcs Walnut", price: 415 },
      { id: "walnut-nutella", label: "2 pcs Walnut + 2 pcs Nutella", price: 435 },
      { id: "all-three", label: "2 pcs each · Dark Chocolate+Walnut+Nutella", price: 585 },
    ],
    flavours: ["Dark Chocolate", "Walnut", "Nutella"],
    ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Walnuts", "Nutella", "Kraft gift box"],
    description:
      "A curated mix of our best-loved flavors, packed into bite-sized square brownie pieces. Perfect for sharing, gifting, or sampling a little bit of everything!",
  },
  {
    id: "p5",
    slug: "the-little-brownie-box",
    name: "The Little Brownie Box",
    tagline: "Nine hand-cut squares of pure fudge.",
    category: "Hampers",
    image: IMG.littleBox,
    square: IMG.littleBoxSquare,
    gallery: [IMG.littleBox],
    variants: [
      { id: "1-dark", label: "1 box · Dark Chocolate", price: 355 },
      { id: "1-nutella", label: "1 box · Nutella", price: 395 },
      { id: "2-dark", label: "2 boxes · Dark Chocolate", price: 710 },
      { id: "2-nutella", label: "2 boxes · Nutella", price: 790 },
      { id: "5-dark", label: "5 boxes · Dark Chocolate", price: 1775 },
      { id: "5-nutella", label: "5 boxes · Nutella", price: 1975 },
    ],
    flavours: ["Dark Chocolate", "Nutella"],
    ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cane sugar", "Flour"],
    description:
      "The Little Brownie Box is filled with bite-sized dark chocolate brownie pieces, rich, fudgy, and perfectly indulgent. Each piece delivers a deep cocoa flavor in a small, satisfying bite—perfect for sharing or treating yourself.",
    signature: true,
  },
  {
    id: "p6",
    slug: "brownie-slab",
    name: "Brownie Slab",
    tagline: "One big slab. Cut it your way.",
    category: "Hampers",
    image: IMG.slab,
    square: IMG.slabSquare,
    gallery: [IMG.slab],
    variants: [
      { id: "1-dark", label: "1 slab · Dark Chocolate", price: 585 },
      { id: "1-nutella", label: "1 slab · Nutella", price: 665 },
      { id: "2-dark", label: "2 slabs · Dark Chocolate", price: 1170 },
      { id: "2-nutella", label: "2 slabs · Nutella", price: 1330 },
      { id: "5-dark", label: "5 slabs · Dark Chocolate", price: 2925 },
      { id: "5-nutella", label: "5 slabs · Nutella", price: 3325 },
    ],
    flavours: ["Dark Chocolate", "Nutella"],
    ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cane sugar", "Flour"],
    description:
      "Rich, fudgy, and irresistibly chocolatey, this soft brownie slab is packed with deep cocoa flavor and melts in your mouth with every bite.",
    signature: true,
  },
  {
    id: "p7",
    slug: "choco-lava-cake",
    name: "Choco Lava Cake",
    tagline: "Molten centre, heart-shaped tin.",
    category: "Cakes",
    image: IMG.lava,
    square: IMG.lavaSquare,
    gallery: [IMG.lava],
    variants: [
      { id: "1", label: "1 tin · Dark Chocolate", price: 195 },
      { id: "2", label: "2 tins · Dark Chocolate", price: 390 },
      { id: "5", label: "5 tins · Dark Chocolate", price: 975 },
    ],
    flavours: ["Dark Chocolate"],
    ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cocoa", "Flour"],
    description:
      "A rich and moist chocolate cake with a warm, gooey molten chocolate center that melts in every bite. A decadent dessert that's perfect for satisfying any chocolate craving which is served in a heart shaped ready-to-heat and eat tin.",
  },
  {
    id: "p8",
    slug: "brownie-slab-cake-loaded-chocolate",
    name: "Brownie Slab Cake · Loaded Chocolate",
    tagline: "Ganache-topped celebration slab.",
    category: "Cakes",
    image: IMG.cake,
    square: IMG.cakeSquare,
    gallery: [IMG.cake],
    variants: [
      { id: "half-kg", label: "1/2 kg Brownie Slab Cake", price: 655 },
      { id: "topper", label: "\"Happy Birthday\" cake topper (add-on)", price: 10 },
    ],
    flavours: ["Loaded Chocolate"],
    ingredients: ["Brownie sponge", "Chocolate ganache", "Chocolate truffles", "Chocolate bars"],
    description:
      "A rich, fudgy brownie slab cake topped with smooth chocolate ganache — dense, moist, and loaded with deep chocolate flavour. Perfect for celebrations or a decadent treat!",
    bestSeller: true,
    signature: true,
  },
  {
    id: "p9",
    slug: "signature-dips",
    name: "Signature Dips",
    tagline: "Pourable chocolate, for the extra bit.",
    category: "Add-ons",
    image: IMG.dips,
    square: IMG.dipsSquare,
    gallery: [IMG.dips],
    variants: [
      { id: "dark", label: "Dark Chocolate Dip", price: 25 },
      { id: "nutella", label: "Nutella Dip", price: 35 },
    ],
    flavours: ["Dark Chocolate", "Nutella"],
    ingredients: ["Belgian couverture chocolate", "Fresh cream", "Nutella"],
    description:
      "Take your brownies to the next level with our rich, creamy dips! From silky chocolate to nutty spreads, each dip is crafted to make every bite extra indulgent. Perfect for sharing… or not 😜🍫",
  },
];

export function findProduct(list: Product[], id: string) {
  return list.find((p) => p.id === id || p.slug === id);
}

export function fromPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price));
}

/* ---------------- Supabase-backed catalog ---------------- */

function rowToProduct(row: any, variantRows: any[]): Product {
  const variants: Variant[] = variantRows
    .filter((v) => v.product_id === row.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => ({ id: v.id, label: v.label, price: Number(v.price), flavour: v.flavour ?? undefined }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    category: row.category,
    image: row.image_url ?? IMG.littleBox,
    imagePosition: row.image_position ?? "center",
    square: row.square_image_url ?? row.image_url ?? IMG.littleBox,
    gallery: row.gallery?.length ? row.gallery : [row.image_url].filter(Boolean),
    galleryPositions: row.gallery_positions ?? [],
    variants: variants.length ? variants : [{ id: "default", label: "Standard", price: 0 }],
    flavours: row.flavours ?? [],
    ingredients: row.ingredients ?? [],
    description: row.description ?? "",
    bestSeller: row.best_seller ?? false,
    signature: row.is_signature ?? false,
    isActive: row.is_active ?? true,
  };
}

/** Live catalog from Supabase (active products only). Falls back to the
 * local seed list if the fetch fails or the table is empty. */
export async function getProducts(): Promise<Product[]> {
  const { data: rows, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !rows || rows.length === 0) {
    if (error) console.error("[products] getProducts", error);
    return FALLBACK_PRODUCTS;
  }

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("*")
    .in(
      "product_id",
      rows.map((r: any) => r.id),
    )
    .eq("is_active", true);

  return rows.map((r: any) => rowToProduct(r, variantRows ?? []));
}

/** Admin: persist a new top-to-bottom display order for products (reflects
 * immediately on the public site, since `getProducts` sorts by sort_order). */
export async function reorderProducts(
  idsInOrder: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const results = await Promise.all(
    idsInOrder.map((id, i) => supabase.from("products").update({ sort_order: i }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };
  return { ok: true };
}


/** All products including inactive — for the admin dashboard. Ordered by
 * sort_order so the admin list matches the public site's display order,
 * which is what makes the move up/down reorder controls meaningful. */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const { data: rows, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !rows) {
    if (error) console.error("[products] getAllProductsAdmin", error);
    return [];
  }
  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("*")
    .in(
      "product_id",
      rows.map((r: any) => r.id),
    );
  return rows.map((r: any) => rowToProduct(r, variantRows ?? []));
}

export type ProductDraft = {
  name: string;
  tagline?: string;
  category: Product["category"];
  image: string;
  imagePosition?: string;
  description?: string;
  price: number;
  isActive?: boolean;
  /** Full list of purchasable options shown on the product page. If omitted,
   * a single "Standard" variant at `price` is used (create) or the existing
   * variants are left untouched (update). */
  variants?: Variant[];
  /** Extra photos shown in the product page image strip. If omitted, falls
   * back to just `image`. */
  gallery?: string[];
  galleryPositions?: string[];
  flavours?: string[];
  ingredients?: string[];
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `product-${Date.now()}`
  );
}

/** Admin: create a product. Uses the full `variants`/`gallery` lists when
 * provided, otherwise falls back to a single "Standard" variant at `price`
 * and a one-photo gallery. */
export async function createProductRow(
  draft: ProductDraft,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gallery = draft.gallery?.length ? draft.gallery : [draft.image];

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug: slugify(draft.name),
      name: draft.name,
      tagline: draft.tagline || null,
      category: draft.category,
      description: draft.description || null,
      image_url: draft.image,
      image_position: draft.imagePosition || "center",
      square_image_url: draft.image,
      gallery,
      gallery_positions: draft.galleryPositions ?? [],
      flavours: draft.flavours ?? [],
      ingredients: draft.ingredients ?? [],
      is_active: true,
    })
    .select()
    .single();

  if (error || !product) return { ok: false, error: error?.message ?? "Could not create product." };

  const variantsToInsert =
    draft.variants && draft.variants.length
      ? draft.variants.map((v, i) => ({
          product_id: product.id,
          label: v.label,
          price: v.price,
          flavour: v.flavour || null,
          sort_order: i,
        }))
      : [{ product_id: product.id, label: "Standard", price: draft.price, flavour: null, sort_order: 0 }];

  const { error: variantError } = await supabase.from("product_variants").insert(variantsToInsert);

  if (variantError) return { ok: false, error: variantError.message };
  return { ok: true };
}

/** Admin: update a product's fields. When `variants` is provided, the
 * product's entire variant list is replaced with it (full product-page
 * editability); otherwise a bare `price` update just adjusts the first
 * (lowest sort_order) variant, same as before. */
export async function updateProductRow(
  id: string,
  draft: Partial<ProductDraft>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("products")
    .update({
      ...(draft.name !== undefined ? { name: draft.name } : {}),
      ...(draft.tagline !== undefined ? { tagline: draft.tagline } : {}),
      ...(draft.category !== undefined ? { category: draft.category } : {}),
      ...(draft.description !== undefined ? { description: draft.description } : {}),
      ...(draft.image !== undefined ? { image_url: draft.image, square_image_url: draft.image } : {}),
      ...(draft.imagePosition !== undefined ? { image_position: draft.imagePosition } : {}),
      ...(draft.gallery !== undefined ? { gallery: draft.gallery } : {}),
      ...(draft.galleryPositions !== undefined ? { gallery_positions: draft.galleryPositions } : {}),
      ...(draft.flavours !== undefined ? { flavours: draft.flavours } : {}),
      ...(draft.ingredients !== undefined ? { ingredients: draft.ingredients } : {}),
      ...(draft.isActive !== undefined ? { is_active: draft.isActive } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  if (draft.variants && draft.variants.length) {
    // Full replace: clear the old option list, then insert the edited one —
    // simplest way to support adding/removing/reordering options from the
    // product page (sizes, flavours, etc.), not just editing prices in place.
    const { error: delError } = await supabase.from("product_variants").delete().eq("product_id", id);
    if (delError) return { ok: false, error: delError.message };

    const { error: insError } = await supabase.from("product_variants").insert(
      draft.variants.map((v, i) => ({
        product_id: id,
        label: v.label,
        price: v.price,
        flavour: v.flavour || null,
        sort_order: i,
      })),
    );
    if (insError) return { ok: false, error: insError.message };
  } else if (draft.price !== undefined) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id)
      .order("sort_order", { ascending: true })
      .limit(1);
    if (variants && variants[0]) {
      await supabase.from("product_variants").update({ price: draft.price }).eq("id", variants[0].id);
    }
  }

  return { ok: true };
}

export async function deleteProductRow(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) console.error("[products] deleteProductRow", error);
}

export async function setProductActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) console.error("[products] setProductActive", error);
  return !error;
}

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/** Admin: upload a file to Supabase Storage and return its public URL. */
export async function uploadProductImage(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be under 5MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/** Admin: delete a previously uploaded image, given its public URL (no-op for external URLs). */
export async function deleteProductImage(url: string) {
  const marker = `/${PRODUCT_IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // not one of our uploaded files — leave it alone
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
}

export function bestSellersOf(list: Product[]) {
  return list.filter((p) => p.bestSeller);
}
export function signatureOf(list: Product[]) {
  return list.filter((p) => p.signature);
}
export function hampersOf(list: Product[]) {
  return list.filter((p) => p.category === "Hampers" || p.category === "Cakes");
}

/* ---------- Order form configuration ---------- */

export const ADD_ONS: Variant[] = [
  { id: "ribbon", label: "Satin ribbon & gift wrap", price: 40 },
  { id: "card", label: "Handwritten message card", price: 30 },
  { id: "candles", label: "Candles & knife set", price: 25 },
  { id: "topper", label: "Celebration cake topper", price: 10 },
  { id: "dip-dark", label: "Dark chocolate dip pot", price: 25 },
  { id: "dip-nutella", label: "Nutella dip pot", price: 35 },
];

export const RIBBON_COLOURS = [
  "Dusty Blue Stripe",
  "Navy Gingham",
  "Ivory Floral",
  "Lilac Gingham",
  "Olive Twill",
  "Sage Gingham",
  "No ribbon",
];

export const DELIVERY_SLOTS = [
  "11:00 AM – 1:00 PM",
  "1:00 PM – 3:00 PM",
  "3:00 PM – 5:00 PM",
  "5:00 PM – 7:00 PM",
  "7:00 PM – 9:00 PM",
];

export const OCCASIONS = [
  "Just because",
  "Birthday",
  "Anniversary",
  "Corporate gifting",
  "Festival",
  "Wedding / Return gifts",
];

export const DELIVERY_AREAS = [
  { id: "indiranagar", label: "Indiranagar / Domlur", fee: 60 },
  { id: "koramangala", label: "Koramangala / HSR", fee: 80 },
  { id: "whitefield", label: "Whitefield / Marathahalli", fee: 120 },
  { id: "north", label: "Hebbal / Yelahanka", fee: 140 },
  { id: "other", label: "Other Bengaluru pincode", fee: 150 },
];

/**
 * NOTE: these helpers (LEAD_TIME_DAYS/minOrderDate/maxOrderDate/isClosedDay)
 * are legacy from an earlier version of the order form and are not used by
 * the current checkout flow — see src/lib/delivery.ts for the real,
 * live lead-time logic (next-day only, 9am–5pm / after-5pm cutoff) that
 * actually powers the checkout page. Kept only in case any older code still
 * imports them; safe to delete once confirmed unused.
 */
export const LEAD_TIME_DAYS = 1;

export function minOrderDate() {
  const d = new Date();
  d.setDate(d.getDate() + LEAD_TIME_DAYS);
  return d.toISOString().slice(0, 10);
}

export function maxOrderDate() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

/** Not used by the live checkout flow — see note above. Always returns false. */
export function isClosedDay(_dateStr: string) {
  return false;
}

export const WHATSAPP_NUMBER = "919019917398";
export const PHONE_DISPLAY = "+91 90199 17398";
export const EMAIL = "littlebrownieco25@gmail.com";
export const ADDRESS = "Koramangala, Bengaluru 560029, Karnataka, India";
/** Hours during which we take new orders. */
export const ORDER_HOURS = "9:00 AM – 5:00 PM";
/** Hours during which orders are delivered. */
export const DELIVERY_HOURS = "9:00 AM – 9:00 PM";
/** @deprecated use ORDER_HOURS — kept so any lingering imports don't break. */
export const HOURS = ORDER_HOURS;
export const UPI_ID = "littlebrownieco@upi";
export const FSSAI_NUMBER = "21225010000087";

/**
 * Single source of truth for the allergen list, taken from the owner's own
 * "What Goes Inside Our Brownies?" allergy graphic (Aug 2026). Update this
 * one constant and it updates everywhere the allergen list appears
 * (Footer, About page, AllergyBanner). The owner said she may send a
 * slightly revised version — when she does, just edit the arrays below.
 */
export const ALLERGENS = {
  short: "eggs, milk/dairy, wheat (gluten), hazelnuts (Nutella), walnuts and soy",
  groups: [
    { label: "Eggs", items: [] as string[] },
    { label: "Dairy", items: ["from butter, chocolate & Nutella"] },
    { label: "Gluten", items: ["all-purpose flour (wheat)"] },
    { label: "Nuts", items: ["Hazelnuts (Nutella)", "Walnuts (in walnut flavour)"] },
    { label: "Soy", items: ["may be present in chocolate & Nutella-based products"] },
  ],
  crossContamination:
    "Prepared in a kitchen that handles these ingredients, so cross-contact with allergens is possible.",
};

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Google Reviews links.
 *
 * GOOGLE_PLACE_ID is the numeric CID from Little Brownie Co.'s actual Google
 * Maps listing URL (the "0x38f23acf11e2aece" feature id, converted from hex
 * to decimal). Google's write-review endpoint accepts this CID directly.
 */
export const GOOGLE_PLACE_ID = "4103406871520653006";

/**
 * The business's actual Google Maps listing page, with the Reviews tab open
 * (the "!9m1!1b1" segment). Used for "Read more reviews on Google" links, so
 * visitors land on the real reviews list for Little Brownie Co.
 */
export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Little+Brownie+Co./@12.987977,77.6219718,11z/data=!4m8!3m7!1s0xaf52317c26fdc78f:0x38f23acf11e2aece!8m2!3d12.987977!4d77.6219718!9m1!1b1!16s%2Fg%2F11xmql93l9!18m1!1e1?entry=ttu";

/**
 * "Write a review" link — used for the "Leave a review on Google" buttons.
 *
 * NOTE: `search.google.com/local/writereview?placeid=<CID>` was 404ing for
 * visitors — that endpoint expects Google's base64-style Place ID (the one
 * starting with "ChIJ..."), not the numeric CID/FID used in Maps URLs. We
 * don't have the real "ChIJ..." Place ID on file, so this points at the
 * business's Maps listing instead (visitors can tap "Write a review" from
 * there). Swap this back to a `?placeid=` link once the real Place ID is
 * available — see GOOGLE_PLACE_ID above.
 */
export const GOOGLE_REVIEWS_URL = GOOGLE_MAPS_URL;

export const galleryImages = [
  IMG.gallery1,
  IMG.gallery2,
  IMG.gallery3,
  IMG.gallery4,
  IMG.gallery5,
  IMG.gallery6,
  IMG.gallery7,
  IMG.gallery8,
];
// // Real product photography, supplied directly by the bakery (Aug 2026 drive
// // share) — extracted from the brand's own order-form PDF and photo library.
// // These are plain local imports (bundled by Vite), not remote CDN pointers,
// // so the site no longer depends on an external Lovable-hosted domain staying
// // online to render images.
// import logo from "@/assets/real/logo.png";
// import tubPhoto from "@/assets/real/tub.jpg";
// import tubAssortedPhoto from "@/assets/real/tub-assorted.jpg";
// import loafPhoto from "@/assets/real/loaf.jpg";
// import assortedBoxPhoto from "@/assets/real/assorted-box.jpg";
// import littleBoxPhoto from "@/assets/real/little-box.jpg";
// import slabPhoto from "@/assets/real/slab.jpg";
// import lavaPhoto from "@/assets/real/lava-cake.jpg";
// import loadedCakePhoto from "@/assets/real/loaded-cake.jpg";
// import dipsPhoto from "@/assets/real/dips.jpg";
// import ribbonPhoto from "@/assets/real/ribbon.jpg";
// import sustainablePackagingPhoto from "@/assets/real/sustainable-packaging.jpg";
// import galleryPhoto1 from "@/assets/real/gallery-1.jpg";
// import galleryPhoto2 from "@/assets/real/gallery-2.jpg";
// import galleryPhoto3 from "@/assets/real/gallery-3.jpg";
// import galleryPhoto4 from "@/assets/real/gallery-4.jpg";
// import galleryPhoto5 from "@/assets/real/gallery-5.jpg";
// import galleryPhoto6 from "@/assets/real/gallery-6.jpg";
// import galleryPhoto7 from "@/assets/real/gallery-7.jpg";
// import galleryPhoto8 from "@/assets/real/gallery-8.jpg";
// import heroPhoto from "@/assets/real/hero.jpg";
// import headerBannerPhoto from "@/assets/header-banner.png";
// import biteSizedHandPhoto from "@/assets/bite-sized-hand.jpg";

// // Real gifting photography supplied earlier — plain local imports too
// import hamperBagHeart from "@/assets/gifting/hamper-bag-heart.png";
// import hamperWoodenBox from "@/assets/gifting/hamper-wooden-box.png";
// import hamperValentineSet from "@/assets/gifting/hamper-valentine-set.png";
// import hamperRibbonBoxes from "@/assets/gifting/hamper-ribbon-boxes.png";
// import hamperBowCloseup from "@/assets/gifting/hamper-bow-closeup.png";
// import hamperPostcardFlowers from "@/assets/gifting/hamper-postcard-flowers.png";

// export const IMG = {
//   logo,
//   heroPortrait: heroPhoto,
//   headerBanner: headerBannerPhoto,
//   biteSizedHand: biteSizedHandPhoto,
//   tub: tubPhoto,
//   tubSquare: tubPhoto,
//   loaf: loafPhoto,
//   loafSquare: loafPhoto,
//   assortedTub: tubAssortedPhoto,
//   assortedTubSquare: tubAssortedPhoto,
//   assortedBox: assortedBoxPhoto,
//   assortedBoxSquare: assortedBoxPhoto,
//   littleBox: littleBoxPhoto,
//   littleBoxSquare: littleBoxPhoto,
//   slab: slabPhoto,
//   slabSquare: slabPhoto,
//   lava: lavaPhoto,
//   lavaSquare: lavaPhoto,
//   cake: loadedCakePhoto,
//   cakeSquare: loadedCakePhoto,
//   dips: dipsPhoto,
//   dipsSquare: dipsPhoto,
//   ribbon: ribbonPhoto,
//   sustainablePackaging: sustainablePackagingPhoto,
//   about1: galleryPhoto2,
//   about2: galleryPhoto4,
//   gallery1: galleryPhoto1,
//   gallery2: galleryPhoto2,
//   gallery3: galleryPhoto3,
//   gallery4: galleryPhoto4,
//   gallery5: galleryPhoto5,
//   gallery6: galleryPhoto6,
//   gallery7: galleryPhoto7,
//   gallery8: galleryPhoto8,
//   // Real gifting photography — plain local imports, not Lovable CDN assets
//   hamperBagHeart,
//   hamperWoodenBox,
//   hamperValentineSet,
//   hamperRibbonBoxes,
//   hamperBowCloseup,
//   hamperPostcardFlowers,
// };

// /** Real, non-stock photos of actual packed hampers for the gifting page gallery. */
// export const giftingGallery = [
//   { src: IMG.hamperValentineSet, alt: "Valentine's gifting set with brownies, dip and card" },
//   { src: IMG.hamperRibbonBoxes, alt: "Brownie loaf box and tin, ribbon-tied" },
//   { src: IMG.hamperBowCloseup, alt: "Close-up of a satin bow on a kraft brownie box" },
//   { src: IMG.hamperPostcardFlowers, alt: "Gift hamper with flowers and a handwritten postcard" },
//   { src: IMG.hamperWoodenBox, alt: "Ribbon-tied wooden brownie gift box" },
//   { src: IMG.hamperBagHeart, alt: "Kraft gift bag with hand-stamped hearts" },
// ];

// export type Variant = { id: string; label: string; price: number };

// export type Product = {
//   id: string;
//   slug: string;
//   name: string;
//   tagline: string;
//   category: "Mini Bites" | "Cakes" | "Hampers" | "Add-ons" | "Limited Editions";
//   image: string;
//   square: string;
//   gallery: string[];
//   variants: Variant[];
//   flavours: string[];
//   ingredients: string[];
//   description: string;
//   bestSeller?: boolean;
//   signature?: boolean;
//   isActive?: boolean;
// };

// import { supabase } from "./supabase";

// /**
//  * Fallback/seed catalog. Supabase (`products` + `product_variants` tables,
//  * see supabase/migrations/) is the real source of truth — this array is
//  * only used if that fetch fails (offline, misconfigured env) so the site
//  * still renders something, and it's what supabase/migrations/0003_seed_products.sql
//  * was generated from.
//  */
// // Product line-up, flavours and prices below are taken directly from the
// // bakery's own order form ("Menu-items with price.pdf", shared Aug 2026).
// // Update prices here (and keep supabase/migrations/0003_seed_products.sql in
// // sync) whenever the owner revises pricing.
// const FALLBACK_PRODUCTS: Product[] = [
//   {
//     id: "p1",
//     slug: "mini-brownie-tub",
//     name: "Mini Brownie Tub",
//     tagline: "Soft, fudgy mini brownie bites in a kraft tub.",
//     category: "Bites",
//     image: IMG.tub,
//     square: IMG.tubSquare,
//     gallery: [IMG.tub, IMG.assortedTub, IMG.biteSizedHand],
//     variants: [
//       { id: "6-dark", label: "6 pcs · Dark Chocolate", price: 215 },
//       { id: "6-walnut", label: "6 pcs · Walnut", price: 265 },
//       { id: "6-nutella", label: "6 pcs · Nutella", price: 245 },
//       { id: "6-assorted", label: "6 pcs · Assorted (2 each)", price: 295 },
//       { id: "12-dark", label: "12 pcs · Dark Chocolate", price: 385 },
//       { id: "12-walnut", label: "12 pcs · Walnut", price: 465 },
//       { id: "12-nutella", label: "12 pcs · Nutella", price: 425 },
//       { id: "12-assorted", label: "12 pcs · Assorted (4 each)", price: 475 },
//       { id: "24-dark", label: "24 pcs · Dark Chocolate", price: 665 },
//       { id: "24-walnut", label: "24 pcs · Walnut", price: 775 },
//       { id: "24-nutella", label: "24 pcs · Nutella", price: 745 },
//       { id: "24-assorted", label: "24 pcs · Assorted (8 each)", price: 835 },
//     ],
//     flavours: ["Dark Chocolate", "Walnut", "Nutella", "Assorted"],
//     ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cane sugar", "All-purpose flour"],
//     description:
//       "Soft, fudgy mini brownie bites, ideal for casual snacking, sharing with friends, or enjoying a quick treat whenever a craving hits. Choose a single flavour, or go Assorted for all three (Dark Chocolate, Walnut, Nutella) in one tub — 2 pcs of each in the 6 pcs tub, 4 pcs of each in the 12 pcs tub, and 8 pcs of each in the 24 pcs tub.",
//     bestSeller: true,
//     signature: true,
//   },
//   {
//     id: "p3",
//     slug: "mini-brownie-loaf",
//     name: "Mini Brownie Loaf",
//     tagline: "A dense, gooey single-serve loaf.",
//     category: "Loaves",
//     image: IMG.loaf,
//     square: IMG.loafSquare,
//     gallery: [IMG.loaf],
//     variants: [
//       { id: "1-dark", label: "1 loaf · Dark Chocolate", price: 355 },
//       { id: "1-walnut", label: "1 loaf · Walnut", price: 425 },
//       { id: "1-nutella", label: "1 loaf · Nutella", price: 385 },
//       { id: "2-dark", label: "2 loaves · Dark Chocolate", price: 710 },
//       { id: "2-walnut", label: "2 loaves · Walnut", price: 850 },
//       { id: "2-nutella", label: "2 loaves · Nutella", price: 770 },
//       { id: "5-dark", label: "5 loaves · Dark Chocolate", price: 1775 },
//       { id: "5-walnut", label: "5 loaves · Walnut", price: 2125 },
//       { id: "5-nutella", label: "5 loaves · Nutella", price: 1925 },
//     ],
//     flavours: ["Dark Chocolate", "Walnut", "Nutella"],
//     ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Vanilla", "Flour"],
//     description:
//       "A rich, fudgy brownie baked in the shape of a mini loaf. It is dense, gooey with a crinkle top, offering the perfect balance of indulgence in a cute, single-serve size. Ideal for gifting, snacking, or satisfying solo cravings without overdoing it! Choose 1–5 loaves per flavour.",
//     bestSeller: true,
//     signature: true,
//   },
//   {
//     id: "p4",
//     slug: "assorted-brownie-box",
//     name: "Assorted Brownie Box",
//     tagline: "Bite-sized squares, mixed flavours.",
//     category: "Hampers",
//     image: IMG.assortedBox,
//     square: IMG.assortedBoxSquare,
//     gallery: [IMG.assortedBox],
//     variants: [
//       { id: "dark-nutella", label: "2 pcs Dark Chocolate + 2 pcs Nutella", price: 385 },
//       { id: "dark-walnut", label: "2 pcs Dark Chocolate + 2 pcs Walnut", price: 415 },
//       { id: "walnut-nutella", label: "2 pcs Walnut + 2 pcs Nutella", price: 435 },
//       { id: "all-three", label: "2 pcs each · All Three Flavours", price: 585 },
//     ],
//     flavours: ["Dark Chocolate", "Walnut", "Nutella"],
//     ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Walnuts", "Nutella", "Kraft gift box"],
//     description:
//       "A curated mix of our best-loved flavours, packed into bite-sized square brownie pieces. Perfect for sharing, gifting, or sampling a little bit of everything!",
//   },
//   {
//     id: "p5",
//     slug: "the-little-brownie-box",
//     name: "The Little Brownie Box",
//     tagline: "Nine hand-cut squares of pure fudge.",
//     category: "Signature",
//     image: IMG.littleBox,
//     square: IMG.littleBoxSquare,
//     gallery: [IMG.littleBox],
//     variants: [
//       { id: "1-dark", label: "1 box · Dark Chocolate", price: 355 },
//       { id: "1-nutella", label: "1 box · Nutella", price: 395 },
//       { id: "2-dark", label: "2 boxes · Dark Chocolate", price: 710 },
//       { id: "2-nutella", label: "2 boxes · Nutella", price: 790 },
//       { id: "5-dark", label: "5 boxes · Dark Chocolate", price: 1775 },
//       { id: "5-nutella", label: "5 boxes · Nutella", price: 1975 },
//     ],
//     flavours: ["Dark Chocolate", "Nutella"],
//     ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cane sugar", "Flour"],
//     description:
//       "The Little Brownie Box is filled with bite-sized dark chocolate brownie pieces, rich, fudgy, and perfectly indulgent. Each piece delivers a deep cocoa flavour in a small, satisfying bite — perfect for sharing or treating yourself. Choose 1–5 boxes.",
//     signature: true,
//   },
//   {
//     id: "p6",
//     slug: "brownie-slab",
//     name: "Brownie Slab",
//     tagline: "One big slab. Cut it your way.",
//     category: "Signature",
//     image: IMG.slab,
//     square: IMG.slabSquare,
//     gallery: [IMG.slab],
//     variants: [
//       { id: "1-dark", label: "1 slab · Dark Chocolate", price: 585 },
//       { id: "1-nutella", label: "1 slab · Nutella", price: 665 },
//       { id: "2-dark", label: "2 slabs · Dark Chocolate", price: 1170 },
//       { id: "2-nutella", label: "2 slabs · Nutella", price: 1330 },
//       { id: "5-dark", label: "5 slabs · Dark Chocolate", price: 2925 },
//       { id: "5-nutella", label: "5 slabs · Nutella", price: 3325 },
//     ],
//     flavours: ["Dark Chocolate", "Nutella"],
//     ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cane sugar", "Flour"],
//     description:
//       "Rich, fudgy, and irresistibly chocolatey, this soft brownie slab is packed with deep cocoa flavour and melts in your mouth with every bite. Uncut, so you can slice it however suits your party or platter. Choose 1–5 slabs.",
//     signature: true,
//   },
//   {
//     id: "p7",
//     slug: "choco-lava-cake",
//     name: "Choco Lava Cake",
//     tagline: "Molten centre, heart-shaped tin.",
//     category: "Cakes",
//     image: IMG.lava,
//     square: IMG.lavaSquare,
//     gallery: [IMG.lava],
//     variants: [
//       { id: "1", label: "1 tin · Dark Chocolate", price: 195 },
//       { id: "2", label: "2 tins · Dark Chocolate", price: 390 },
//       { id: "5", label: "5 tins · Dark Chocolate", price: 975 },
//     ],
//     flavours: ["Dark Chocolate"],
//     ingredients: ["Belgian dark chocolate", "Butter", "Eggs", "Cocoa", "Flour"],
//     description:
//       "A rich and moist chocolate cake with a warm, gooey molten chocolate centre that melts in every bite. A decadent dessert that's perfect for satisfying any chocolate craving, served in a heart-shaped, ready-to-heat-and-eat tin. Choose 1–5 tins.",
//   },
//   {
//     id: "p8",
//     slug: "brownie-slab-cake-loaded-chocolate",
//     name: "Brownie Slab Cake · Loaded Chocolate",
//     tagline: "Ganache-topped celebration slab.",
//     category: "Cakes",
//     image: IMG.cake,
//     square: IMG.cakeSquare,
//     gallery: [IMG.cake],
//     variants: [
//       { id: "half-kg", label: "1/2 kg Brownie Slab Cake", price: 655 },
//       { id: "topper", label: "\"Happy Birthday\" cake topper (add-on)", price: 10 },
//     ],
//     flavours: ["Loaded Chocolate"],
//     ingredients: ["Brownie sponge", "Chocolate ganache", "Chocolate truffles", "Chocolate bars"],
//     description:
//       "A rich, fudgy brownie slab cake topped with smooth chocolate ganache — dense, moist, and loaded with deep chocolate flavour. Perfect for celebrations or a decadent treat! Add a \"Happy Birthday\" topper for ₹10.",
//     bestSeller: true,
//     signature: true,
//   },
//   {
//     id: "p9",
//     slug: "signature-dips",
//     name: "Signature Dips",
//     tagline: "Pourable chocolate, for the extra bit.",
//     category: "Add-ons",
//     image: IMG.dips,
//     square: IMG.dipsSquare,
//     gallery: [IMG.dips],
//     variants: [
//       { id: "dark", label: "Dark Chocolate Dip", price: 25 },
//       { id: "nutella", label: "Nutella Dip", price: 35 },
//     ],
//     flavours: ["Dark Chocolate", "Nutella"],
//     ingredients: ["Belgian couverture chocolate", "Fresh cream", "Nutella"],
//     description:
//       "Take your brownies to the next level with our rich, creamy dips! From silky chocolate to nutty spreads, each dip is crafted to make every bite extra indulgent. Perfect for sharing… or not.",
//   },
// ];

// export function findProduct(list: Product[], id: string) {
//   return list.find((p) => p.id === id || p.slug === id);
// }

// export function fromPrice(p: Product) {
//   return Math.min(...p.variants.map((v) => v.price));
// }

// /* ---------------- Supabase-backed catalog ---------------- */

// function rowToProduct(row: any, variantRows: any[]): Product {
//   const variants: Variant[] = variantRows
//     .filter((v) => v.product_id === row.id)
//     .sort((a, b) => a.sort_order - b.sort_order)
//     .map((v) => ({ id: v.id, label: v.label, price: Number(v.price) }));

//   return {
//     id: row.id,
//     slug: row.slug,
//     name: row.name,
//     tagline: row.tagline ?? "",
//     category: row.category,
//     image: row.image_url ?? IMG.littleBox,
//     square: row.square_image_url ?? row.image_url ?? IMG.littleBox,
//     gallery: row.gallery?.length ? row.gallery : [row.image_url].filter(Boolean),
//     variants: variants.length ? variants : [{ id: "default", label: "Standard", price: 0 }],
//     flavours: row.flavours ?? [],
//     ingredients: row.ingredients ?? [],
//     description: row.description ?? "",
//     bestSeller: row.best_seller ?? false,
//     signature: row.is_signature ?? false,
//     isActive: row.is_active ?? true,
//   };
// }

// /** Live catalog from Supabase (active products only). Falls back to the
//  * local seed list if the fetch fails or the table is empty. */
// export async function getProducts(): Promise<Product[]> {
//   const { data: rows, error } = await supabase
//     .from("products")
//     .select("*")
//     .eq("is_active", true)
//     .order("sort_order", { ascending: true });

//   if (error || !rows || rows.length === 0) {
//     if (error) console.error("[products] getProducts", error);
//     return FALLBACK_PRODUCTS;
//   }

//   const { data: variantRows } = await supabase
//     .from("product_variants")
//     .select("*")
//     .in(
//       "product_id",
//       rows.map((r: any) => r.id),
//     )
//     .eq("is_active", true);

//   return rows.map((r: any) => rowToProduct(r, variantRows ?? []));
// }

// /** All products including inactive — for the admin dashboard. */
// export async function getAllProductsAdmin(): Promise<Product[]> {
//   const { data: rows, error } = await supabase
//     .from("products")
//     .select("*")
//     .order("created_at", { ascending: false });
//   if (error || !rows) {
//     if (error) console.error("[products] getAllProductsAdmin", error);
//     return [];
//   }
//   const { data: variantRows } = await supabase
//     .from("product_variants")
//     .select("*")
//     .in(
//       "product_id",
//       rows.map((r: any) => r.id),
//     );
//   return rows.map((r: any) => rowToProduct(r, variantRows ?? []));
// }

// export type ProductDraft = {
//   name: string;
//   tagline?: string;
//   category: Product["category"];
//   image: string;
//   description?: string;
//   price: number;
//   isActive?: boolean;
// };

// function slugify(name: string) {
//   return (
//     name
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "") || `product-${Date.now()}`
//   );
// }

// /** Admin: create a product with a single "Standard" variant at the given price. */
// export async function createProductRow(
//   draft: ProductDraft,
// ): Promise<{ ok: true } | { ok: false; error: string }> {
//   const { data: product, error } = await supabase
//     .from("products")
//     .insert({
//       slug: slugify(draft.name),
//       name: draft.name,
//       tagline: draft.tagline || null,
//       category: draft.category,
//       description: draft.description || null,
//       image_url: draft.image,
//       square_image_url: draft.image,
//       gallery: [draft.image],
//       is_active: true,
//     })
//     .select()
//     .single();

//   if (error || !product) return { ok: false, error: error?.message ?? "Could not create product." };

//   const { error: variantError } = await supabase
//     .from("product_variants")
//     .insert({ product_id: product.id, label: "Standard", price: draft.price, sort_order: 0 });

//   if (variantError) return { ok: false, error: variantError.message };
//   return { ok: true };
// }

// /** Admin: update a product's core fields and its first ("Standard"/lowest sort_order) variant's price. */
// export async function updateProductRow(
//   id: string,
//   draft: Partial<ProductDraft>,
// ): Promise<{ ok: true } | { ok: false; error: string }> {
//   const { error } = await supabase
//     .from("products")
//     .update({
//       ...(draft.name !== undefined ? { name: draft.name } : {}),
//       ...(draft.tagline !== undefined ? { tagline: draft.tagline } : {}),
//       ...(draft.category !== undefined ? { category: draft.category } : {}),
//       ...(draft.description !== undefined ? { description: draft.description } : {}),
//       ...(draft.image !== undefined ? { image_url: draft.image, square_image_url: draft.image } : {}),
//       ...(draft.isActive !== undefined ? { is_active: draft.isActive } : {}),
//     })
//     .eq("id", id);

//   if (error) return { ok: false, error: error.message };

//   if (draft.price !== undefined) {
//     const { data: variants } = await supabase
//       .from("product_variants")
//       .select("id")
//       .eq("product_id", id)
//       .order("sort_order", { ascending: true })
//       .limit(1);
//     if (variants && variants[0]) {
//       await supabase.from("product_variants").update({ price: draft.price }).eq("id", variants[0].id);
//     }
//   }

//   return { ok: true };
// }

// export async function deleteProductRow(id: string) {
//   const { error } = await supabase.from("products").delete().eq("id", id);
//   if (error) console.error("[products] deleteProductRow", error);
// }

// export async function setProductActive(id: string, isActive: boolean) {
//   const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
//   if (error) console.error("[products] setProductActive", error);
//   return !error;
// }

// const PRODUCT_IMAGE_BUCKET = "product-images";
// const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// /** Admin: upload a file to Supabase Storage and return its public URL. */
// export async function uploadProductImage(
//   file: File,
// ): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
//   if (!file.type.startsWith("image/")) {
//     return { ok: false, error: "Please choose an image file." };
//   }
//   if (file.size > MAX_IMAGE_BYTES) {
//     return { ok: false, error: "Image must be under 5MB." };
//   }

//   const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
//   const path = `${crypto.randomUUID()}.${ext}`;

//   const { error } = await supabase.storage
//     .from(PRODUCT_IMAGE_BUCKET)
//     .upload(path, file, { cacheControl: "3600", upsert: false });

//   if (error) return { ok: false, error: error.message };

//   const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
//   return { ok: true, url: data.publicUrl };
// }

// /** Admin: delete a previously uploaded image, given its public URL (no-op for external URLs). */
// export async function deleteProductImage(url: string) {
//   const marker = `/${PRODUCT_IMAGE_BUCKET}/`;
//   const idx = url.indexOf(marker);
//   if (idx === -1) return; // not one of our uploaded files — leave it alone
//   const path = url.slice(idx + marker.length);
//   await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
// }

// export function bestSellersOf(list: Product[]) {
//   return list.filter((p) => p.bestSeller);
// }
// export function signatureOf(list: Product[]) {
//   return list.filter((p) => p.signature);
// }
// export function hampersOf(list: Product[]) {
//   return list.filter((p) => p.category === "Hampers" || p.category === "Cakes");
// }

// /* ---------- Order form configuration ---------- */

// export const ADD_ONS: Variant[] = [
//   { id: "ribbon", label: "Satin ribbon & gift wrap", price: 40 },
//   { id: "card", label: "Handwritten message card", price: 30 },
//   { id: "candles", label: "Candles & knife set", price: 25 },
//   { id: "topper", label: "Celebration cake topper", price: 10 },
//   { id: "dip-dark", label: "Dark chocolate dip pot", price: 25 },
//   { id: "dip-nutella", label: "Nutella dip pot", price: 35 },
// ];

// export const RIBBON_COLOURS = [
//   "Dusty Blue Stripe",
//   "Navy Gingham",
//   "Ivory Floral",
//   "Lilac Gingham",
//   "Olive Twill",
//   "Sage Gingham",
//   "No ribbon",
// ];

// export const DELIVERY_SLOTS = [
//   "11:00 AM – 1:00 PM",
//   "1:00 PM – 3:00 PM",
//   "3:00 PM – 5:00 PM",
//   "5:00 PM – 7:00 PM",
//   "7:00 PM – 9:00 PM",
// ];

// export const OCCASIONS = [
//   "Just because",
//   "Birthday",
//   "Anniversary",
//   "Corporate gifting",
//   "Festival",
//   "Wedding / Return gifts",
// ];

// export const DELIVERY_AREAS = [
//   { id: "indiranagar", label: "Indiranagar / Domlur", fee: 60 },
//   { id: "koramangala", label: "Koramangala / HSR", fee: 80 },
//   { id: "whitefield", label: "Whitefield / Marathahalli", fee: 120 },
//   { id: "north", label: "Hebbal / Yelahanka", fee: 140 },
//   { id: "other", label: "Other Bengaluru pincode", fee: 150 },
// ];

// /**
//  * NOTE: these helpers (LEAD_TIME_DAYS/minOrderDate/maxOrderDate/isClosedDay)
//  * are legacy from an earlier version of the order form and are not used by
//  * the current checkout flow — see src/lib/delivery.ts for the real,
//  * live lead-time logic (next-day only, 9am–5pm / after-5pm cutoff) that
//  * actually powers the checkout page. Kept only in case any older code still
//  * imports them; safe to delete once confirmed unused.
//  */
// export const LEAD_TIME_DAYS = 1;

// export function minOrderDate() {
//   const d = new Date();
//   d.setDate(d.getDate() + LEAD_TIME_DAYS);
//   return d.toISOString().slice(0, 10);
// }

// export function maxOrderDate() {
//   const d = new Date();
//   d.setDate(d.getDate() + 60);
//   return d.toISOString().slice(0, 10);
// }

// /** Not used by the live checkout flow — see note above. Always returns false. */
// export function isClosedDay(_dateStr: string) {
//   return false;
// }

// export const WHATSAPP_NUMBER = "919019917398";
// export const PHONE_DISPLAY = "+91 90199 17398";
// export const EMAIL = "littlebrownieco25@gmail.com";
// export const ADDRESS = "Koramangala, Bengaluru 560029, Karnataka, India";
// /** Hours during which we take new orders. */
// export const ORDER_HOURS = "9:00 AM – 5:00 PM";
// /** Hours during which orders are delivered. */
// export const DELIVERY_HOURS = "9:00 AM – 9:00 PM";
// /** @deprecated use ORDER_HOURS — kept so any lingering imports don't break. */
// export const HOURS = ORDER_HOURS;
// export const UPI_ID = "littlebrownieco@upi";
// export const FSSAI_NUMBER = "21225010000087";

// /**
//  * Single source of truth for the allergen list, taken from the owner's own
//  * "What Goes Inside Our Brownies?" allergy graphic (Aug 2026). Update this
//  * one constant and it updates everywhere the allergen list appears
//  * (Footer, About page, AllergyBanner). The owner said she may send a
//  * slightly revised version — when she does, just edit the arrays below.
//  */
// export const ALLERGENS = {
//   short: "eggs, milk/dairy, wheat (gluten), hazelnuts (Nutella), walnuts and soy",
//   groups: [
//     { label: "Eggs", items: [] as string[] },
//     { label: "Dairy", items: ["from butter, chocolate & Nutella"] },
//     { label: "Gluten", items: ["all-purpose flour (wheat)"] },
//     { label: "Nuts", items: ["Hazelnuts (Nutella)", "Walnuts (in walnut flavour)"] },
//     { label: "Soy", items: ["may be present in chocolate & Nutella-based products"] },
//   ],
//   crossContamination:
//     "Prepared in a kitchen that handles these ingredients, so cross-contact with allergens is possible.",
// };

// export function whatsappLink(message: string) {
//   return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
// }

// /**
//  * Google Reviews link. This is a search-based fallback (business name +
//  * address) that works without any API key. Once the owner shares her
//  * Google Business Profile "Place ID", swap this for
//  * `https://search.google.com/local/writereview?placeid=<PLACE_ID>` (to
//  * collect new reviews) and/or wire up the Places API to embed reviews
//  * directly — see the note in src/lib/reviews.ts.
//  */
// export const GOOGLE_REVIEWS_URL =
//   "https://www.google.com/search?q=Little+Brownie+Co.+Bengaluru+reviews";

// export const galleryImages = [
//   IMG.gallery1,
//   IMG.gallery2,
//   IMG.gallery3,
//   IMG.gallery4,
//   IMG.gallery5,
//   IMG.gallery6,
//   IMG.gallery7,
//   IMG.gallery8,
// ];
