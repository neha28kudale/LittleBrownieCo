import { useEffect, useState } from "react";
import { X, TriangleAlert } from "lucide-react";
import { ALLERGENS } from "@/lib/products";

const DISMISS_KEY = "lbc_allergy_banner_dismissed_v1";

export function AllergyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="relative z-30 border-b border-border/60 bg-caramel/25 text-cocoa">
      <div className="container-x flex items-center justify-center gap-2 py-2 text-center text-[11px] leading-snug sm:text-xs">
        <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-cocoa" />
        <span>
          Our brownies contain <strong>{ALLERGENS.short}</strong>. Please check product pages or
          ask us before ordering if you have a food allergy.
        </span>
        <button
          onClick={dismiss}
          aria-label="Dismiss allergy notice"
          className="ml-2 shrink-0 rounded-full p-1 transition-colors hover:bg-cocoa/10 active:bg-cocoa/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
