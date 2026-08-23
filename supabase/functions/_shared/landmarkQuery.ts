// supabase/functions/_shared/landmarkQuery.ts
//
// Turns whatever a customer types into a landmark field ("next to tenet
// diagnostic hub", "near Tenent Diagnostics center", ...) into a series of
// progressively looser search queries to try against Google Places.
// Shared by places-autocomplete (live dropdown) and calculate-delivery-fee
// (checkout fallback), so both behave identically and any future tuning
// only needs to happen here.
//
// Why this is needed: Google's Text Search does fairly literal keyword
// matching. A generic descriptor mismatch — customer says "hub", the
// place's actual name says "Centre" — is enough to return zero results,
// even though a human would immediately recognise it's the same place.
// Stripping position-filler words ("next to", "opposite", ...) and, if
// that alone doesn't match, ALSO stripping generic descriptor words
// ("hub", "centre", "clinic", ...) down to just the distinctive core
// keywords ("tenet diagnostic") fixes that class of miss without needing
// a hardcoded synonym list.

// Phrases that describe POSITION relative to a place, not the place
// itself. Always safe to strip — they carry no search value.
const FILLER_PATTERN =
  /\b(next to|nearby|near to|near|opposite to|opposite|behind|beside|besides|in front of|infront of|close to|adjacent to|by the|by|at)\b/gi;

// Generic descriptor words that commonly get swapped by customers for the
// business's actual naming ("hub" for "centre", "clinic" for "hospital",
// etc). Only stripped as a FALLBACK attempt (see landmarkQueryVariants),
// after the full phrase has already been tried and failed — stripping
// them unconditionally would break landmarks where the word genuinely is
// part of the distinctive name (e.g. "Forum Mall").
const GENERIC_DESCRIPTOR_PATTERN =
  /\b(hub|centre|center|clinic|hospital|mall|complex|building|tower|apartments?|society|layout|store|shop|showroom)\b/gi;

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Strips position-filler phrases only. Used as the primary/first query. */
export function cleanLandmarkQuery(raw: string): string {
  return normalizeWhitespace(raw.replace(FILLER_PATTERN, " "));
}

/**
 * Ordered list of query strings to try, from most-specific to
 * most-lenient. Callers should try each in turn (e.g. Autocomplete, then
 * Text Search) and stop at the first one that returns a confident result.
 *
 *   1. Filler words stripped only  -> "tenet diagnostic hub"
 *   2. + generic descriptors stripped -> "tenet diagnostic"
 *   3. First 2 significant words of (2) as a last-resort core-keyword
 *      search, in case the landmark name itself is longer than that.
 *
 * Duplicates and empties are removed; a raw input that's just filler/
 * descriptor words (rare) safely falls back to the cleaned original.
 */
export function landmarkQueryVariants(raw: string): string[] {
  const cleaned = cleanLandmarkQuery(raw);
  if (!cleaned) return [];

  const strippedDescriptors = normalizeWhitespace(
    cleaned.replace(GENERIC_DESCRIPTOR_PATTERN, " "),
  );

  const variants = [cleaned];
  if (strippedDescriptors && strippedDescriptors !== cleaned) {
    variants.push(strippedDescriptors);
  }

  const coreWords = (strippedDescriptors || cleaned).split(" ").filter(Boolean);
  if (coreWords.length > 2) {
    variants.push(coreWords.slice(0, 2).join(" "));
  }

  return [...new Set(variants)];
}
