/**
 * Admin-editable display names for the fixed set of product categories
 * ("Mini Bites", "Hampers", etc). The underlying category value stored on
 * each product (and used for filtering) never changes — only the label
 * shown to visitors does. Backed by the `category_labels` table, see
 * supabase/migrations/0004_category_labels.sql.
 */

import { supabase } from "./supabase";
import { MENU_CATEGORIES, type MenuCategory } from "./site-content";

export type CategoryLabels = Record<MenuCategory, string>;

function defaultLabels(): CategoryLabels {
  return Object.fromEntries(MENU_CATEGORIES.map((c) => [c, c])) as CategoryLabels;
}

/** Fetches the current display name for every category. Falls back to the
 * original category names if the table hasn't been migrated/seeded yet. */
export async function getCategoryLabels(): Promise<CategoryLabels> {
  const labels = defaultLabels();
  const { data, error } = await supabase.from("category_labels").select("key, label");
  if (error || !data) {
    if (error) console.error("[categories] getCategoryLabels", error);
    return labels;
  }
  for (const row of data as { key: string; label: string }[]) {
    if (row.key in labels) labels[row.key as MenuCategory] = row.label;
  }
  return labels;
}

/** Admin-only: rename a category's display label. */
export async function updateCategoryLabel(key: MenuCategory, label: string): Promise<boolean> {
  const trimmed = label.trim();
  if (!trimmed) return false;
  const { error } = await supabase
    .from("category_labels")
    .upsert({ key, label: trimmed }, { onConflict: "key" });
  if (error) console.error("[categories] updateCategoryLabel", error);
  return !error;
}
