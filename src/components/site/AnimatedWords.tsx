/**
 * Splits text into words and animates them in with a staggered
 * fade+rise, once on mount. Used for hero headlines — gives the page
 * a "premium" opening beat instead of static text.
 */
export function AnimatedWords({
  text,
  className = "",
  wordClassName = "",
  baseDelayMs = 0,
  staggerMs = 60,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  baseDelayMs?: number;
  staggerMs?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span
            className={`inline-block animate-word-in ${wordClassName}`}
            style={{ animationDelay: `${baseDelayMs + i * staggerMs}ms` }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}
