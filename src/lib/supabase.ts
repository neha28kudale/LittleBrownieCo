import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Fails loudly in dev rather than silently making requests to `undefined`.
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env and fill them in.",
  );
}

/**
 * Shared Supabase client. Uses the anon key only — this is safe to ship in
 * client-side code by design. All privileged writes (updating order status,
 * approving reviews, editing delivery slabs/products) must be protected by
 * Row Level Security policies that check `auth.uid()` against an admin
 * allowlist, not by keeping this key secret.
 *
 * Note: not using the generated `Database` generic here — the installed
 * supabase-js version expects a newer generic shape than hand-written types
 * can easily satisfy. Row shapes are asserted explicitly at each call site
 * in lib/reviews.ts, lib/orders.ts etc. instead.
 */
export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
