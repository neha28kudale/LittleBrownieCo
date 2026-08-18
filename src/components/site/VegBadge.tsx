/** The standard Indian "green dot" vegetarian mark: a green square outline with a filled green dot. */
export function VegMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border-2 border-[#0a8a3a] p-[2px] ${className}`}
      aria-hidden="true"
    >
      <span className="block h-full w-full rounded-full bg-[#0a8a3a]" />
    </span>
  );
}

export function VegBadge({ className = "inline-flex h-10" }: { className?: string }) {
  return (
    <span
      className={`items-center gap-2 rounded-full border border-accent/40 bg-secondary px-4 text-[10px] uppercase tracking-[0.24em] text-primary ${className}`}
    >
      <VegMark />
      100% Pure Veg
    </span>
  );
}
