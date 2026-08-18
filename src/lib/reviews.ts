/**
 * Review persistence — Supabase-backed (`reviews` table, see
 * supabase/migrations/0001_init.sql). Public can read approved reviews and
 * insert new ones (always as "pending"); only admins can approve/reject.
 *
 * Google Reviews: the owner asked for Google reviews to be linked instead of
 * manually re-posted. `getGoogleReviews()` below calls a Supabase Edge
 * Function (supabase/functions/google-reviews) that fetches her live Google
 * reviews server-side, keeping the Places API key off the client. Until her
 * Place ID + API key are set as Edge Function secrets, it returns an empty
 * list and the site falls back to the Supabase-hosted reviews plus a
 * "Read on Google" link (GOOGLE_REVIEWS_URL in src/lib/products.ts).
 */

import { supabase } from "./supabase";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  name: string;
  location?: string;
  rating: number;
  text: string;
  createdAt: string;
  status: ReviewStatus;
};

function fromRow(row: {
  id: string;
  customer_name: string;
  location: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  created_at: string;
}): Review {
  return {
    id: row.id,
    name: row.customer_name,
    location: row.location ?? undefined,
    rating: row.rating,
    text: row.body,
    createdAt: row.created_at,
    status: row.status,
  };
}

/** Only approved reviews — for the public Reviews page. */
export async function getApprovedReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[reviews] getApprovedReviews", error);
    return [];
  }
  return (data ?? []).map(fromRow);
}

/** All reviews, newest first — for the admin dashboard (requires admin RLS access). */
export async function getAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[reviews] getAllReviews", error);
    return [];
  }
  return (data ?? []).map(fromRow);
}

export async function submitReview(input: {
  name: string;
  location?: string;
  rating: number;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("reviews").insert({
    customer_name: input.name.trim(),
    location: input.location?.trim() || null,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    body: input.text.trim(),
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) console.error("[reviews] setReviewStatus", error);
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) console.error("[reviews] deleteReview", error);
}

/** Realtime subscription — calls cb whenever the reviews table changes. */
export function subscribeReviews(cb: () => void) {
  const channel = supabase
    .channel("reviews-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => cb())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export type GoogleReview = {
  name: string;
  rating: number;
  text: string;
  relativeTime?: string;
};

export async function getGoogleReviews(): Promise<{
  reviews: GoogleReview[];
  rating: number | null;
  ratingCount: number | null;
  mapsUrl: string | null;
  configured: boolean;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("google-reviews");
    if (error || !data) {
      return { reviews: [], rating: null, ratingCount: null, mapsUrl: null, configured: false };
    }
    return {
      reviews: data.reviews ?? [],
      rating: data.rating ?? null,
      ratingCount: data.ratingCount ?? null,
      mapsUrl: data.mapsUrl ?? null,
      configured: !!data.configured,
    };
  } catch (err) {
    console.error("[reviews] getGoogleReviews", err);
    return { reviews: [], rating: null, ratingCount: null, mapsUrl: null, configured: false };
  }
}

