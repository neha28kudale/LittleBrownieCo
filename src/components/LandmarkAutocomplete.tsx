// src/components/LandmarkAutocomplete.tsx
//
// Nearby-landmark input with a live Google Places suggestion dropdown —
// the same pattern Uber/Ola use for address entry. As the customer types,
// real nearby places are suggested; picking one gives us an exact
// place_id, so the delivery-fee lookup (calculate-delivery-fee) can skip
// fuzzy text matching entirely for that order.
//
// Customers can still ignore the dropdown and just type free text — that
// still works exactly as before (fuzzy landmark search on the backend).
// The dropdown is a faster, more reliable path when they use it, not a
// requirement.
//
// Calls the places-autocomplete Edge Function, which proxies Google Places
// so the API key stays server-side (see that function for details). If
// GOOGLE_MAPS_API_KEY isn't configured yet, the function returns
// `configured: false` and this component quietly behaves like a plain text
// input — nothing breaks.

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type LandmarkValue = {
  text: string;
  /** Set only when the customer picked a suggestion. Cleared as soon as
   * they edit the text afterward, since the typed text no longer
   * necessarily matches that exact place. */
  placeId?: string;
};

type Prediction = { placeId: string; description: string };

export function LandmarkAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: LandmarkValue;
  onChange: (value: LandmarkValue) => void;
  placeholder?: string;
  className?: string;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch of suggestions as the customer types.
  useEffect(() => {
    if (!configured || value.placeId || value.text.trim().length < 3) {
      setPredictions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("places-autocomplete", {
          body: { type: "autocomplete", input: value.text.trim() },
        });

        if (cancelled) return;

        if (error || !data?.configured) {
          setConfigured(Boolean(data?.configured ?? false));
          setPredictions([]);
        } else {
          setPredictions(data.predictions ?? []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setPredictions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.text, value.placeId, configured]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectPrediction = (p: Prediction) => {
    onChange({ text: p.description, placeId: p.placeId });
    setPredictions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value.text}
        onChange={(e) => {
          // Any manual edit invalidates a previously-picked place_id —
          // the text no longer necessarily matches that exact place.
          onChange({ text: e.target.value, placeId: undefined });
        }}
        onFocus={() => {
          if (predictions.length > 0) setOpen(true);
        }}
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />

      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {open && predictions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md">
          {predictions.map((p) => (
            <li key={p.placeId}>
              <button
                type="button"
                onClick={() => selectPrediction(p)}
                className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm text-primary/90 hover:bg-secondary/50"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="min-w-0">{p.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.placeId && (
        <span className="mt-1 block text-[11px] text-accent">
          ✓ Matched to an exact location
        </span>
      )}
    </div>
  );
}
