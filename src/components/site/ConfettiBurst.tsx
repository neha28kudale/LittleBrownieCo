import { useEffect, useState } from "react";

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  drift: number;
};

const COLORS = ["var(--caramel)", "var(--cocoa)", "var(--toffee)", "var(--accent)", "var(--caramel-dark)"];

/**
 * One-shot confetti burst — mounts, plays, then removes itself. Drop it in
 * wherever a moment deserves celebrating (order placed, form submitted).
 * Respects prefers-reduced-motion by not rendering anything.
 */
export function ConfettiBurst({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const next: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2.2 + Math.random() * 1.2,
      rotate: Math.random() * 360,
      color: COLORS[i % COLORS.length]!,
      drift: (Math.random() - 0.5) * 120,
    }));
    setPieces(next);

    const t = setTimeout(() => setPieces(null), 4000);
    return () => clearTimeout(t);
  }, [count]);

  if (!pieces) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // custom property read by the keyframe for horizontal drift
            ["--drift" as string]: `${p.drift}px`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
