/**
 * Admin authentication via Supabase Auth (email/password) + the
 * `admin_users` allowlist table (see supabase/migrations/0001_init.sql).
 *
 * A successful login only proves the person has valid Supabase credentials —
 * it does NOT by itself grant admin rights. Every privileged read/write
 * (orders, reviews, delivery slabs, products) is enforced server-side by
 * Row Level Security policies that check membership in `admin_users`. This
 * client-side check exists only to route the UI (show dashboard vs login
 * form) — it is not the security boundary.
 */

import { supabase } from "./supabase";

export type AdminSession = {
  userId: string;
  email: string | null;
} | null;

export async function getAdminSession(): Promise<AdminSession> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !adminRow) return null;
  return { userId: session.user.id, email: session.user.email ?? null };
}

export async function adminSignIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account doesn't have admin access." };
  }

  return { ok: true };
}

export async function adminSignOut() {
  await supabase.auth.signOut();
}

/** Fires cb whenever the auth session changes (sign in, sign out, token refresh). */
export function onAdminAuthChange(cb: () => void) {
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}
