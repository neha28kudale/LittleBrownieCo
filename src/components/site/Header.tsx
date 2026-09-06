import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, Phone, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IMG, PHONE_DISPLAY, WHATSAPP_NUMBER, whatsappLink } from "@/lib/products";
import { MENU_CATEGORIES } from "@/lib/site-content";
import { useCart } from "@/lib/cart";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/track-order", label: "Track Order" },
  { to: "/faqs", label: "FAQs & Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const phoneDisplay = PHONE_DISPLAY;

  const [badgeBump, setBadgeBump] = useState(false);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count !== prevCount.current) {
      setBadgeBump(true);
      prevCount.current = count;
      const t = setTimeout(() => setBadgeBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [count]);

  const closeMobile = () => {
    setOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/92 backdrop-blur-xl">
      <div className="container-x h-20 md:h-24">
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1.4fr)_auto_auto] lg:gap-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 md:gap-3" onClick={closeMobile}>
            <img
              src={IMG.logo}
              alt="Little Brownie Co."
              className="h-14 w-14 shrink-0 rounded-full border border-border/80 object-cover shadow-soft md:h-20 md:w-20"
            />
            <div className="min-w-0">
              <div className="truncate font-serif text-[1.55rem] leading-none text-primary sm:text-[1.9rem] lg:text-[2.4rem]">
                Little Brownie Co.
              </div>
              <div className="truncate pt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">
                Premium Mini Brownies since 2025
              </div>
            </div>
          </Link>

          <nav className="hidden items-center justify-center gap-5 xl:gap-8 lg:flex">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="nav-underline text-[0.95rem] text-primary/80 transition-colors hover:text-primary [&.active]:text-primary"
            >
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <Link
                to="/menu"
                className="relative inline-flex items-center gap-1 text-[1.05rem] font-medium text-primary/80 transition-colors hover:text-primary [&.active]:text-primary"
              >
                Menu
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} />
              </Link>
              {menuOpen && (
                <div className="absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-2 origin-top animate-dropdown-in">
                  <div className="rounded-lg border border-border bg-background py-2 shadow-soft">
                    <Link
                      to="/menu"
                      className="block px-4 py-2 text-sm text-primary/80 transition-colors hover:bg-secondary hover:text-primary active:bg-caramel active:text-cocoa"
                      onClick={() => setMenuOpen(false)}
                    >
                      View all
                    </Link>
                    {MENU_CATEGORIES.map((cat) => (
                      <Link
                        key={cat}
                        to="/menu"
                        search={{ cat }}
                        className="block px-4 py-2 text-sm text-primary/80 transition-colors hover:bg-secondary hover:text-primary active:bg-caramel active:text-cocoa"
                        onClick={() => setMenuOpen(false)}
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {nav.slice(1).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="nav-underline text-[0.95rem] text-primary/80 transition-colors hover:text-primary [&.active]:text-primary"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <a
              href={whatsappLink("Hi Little Brownie Co., I'd like to place an order.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm text-primary transition hover:border-accent/50 hover:bg-secondary active:bg-caramel active:text-cocoa"
            >
              <Phone className="h-4 w-4 text-accent" />
              <span className="whitespace-nowrap">{phoneDisplay}</span>
            </a>
            <Link
              to="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:bg-secondary active:bg-caramel"
              aria-label="Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {count > 0 && (
                <span
                  className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground ${
                    badgeBump ? "animate-badge-pop" : ""
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 lg:hidden">
            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-secondary active:bg-caramel"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span
                  className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground ${
                    badgeBump ? "animate-badge-pop" : ""
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary transition-transform active:scale-90"
              aria-label="Menu"
            >
              <span className="relative block h-5 w-5">
                <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`} />
                <X className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden animate-mobile-panel">
          <div className="container-x py-4">
            <a
              href={whatsappLink("Hi Little Brownie Co., I'd like to place an order.")}
              target="_blank"
              rel="noreferrer"
              className="mb-4 inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm text-primary transition-transform active:scale-95 animate-stagger-in"
              style={{ animationDelay: "20ms" }}
            >
              {phoneDisplay}
            </a>
            <nav className="flex flex-col">
              <Link
                to="/"
                onClick={closeMobile}
                activeOptions={{ exact: true }}
                className="border-b border-border/60 py-3 font-serif text-[1.5rem] text-primary [&.active]:text-accent animate-stagger-in"
                style={{ animationDelay: "60ms" }}
              >
                Home
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center justify-between border-b border-border/60 py-3 font-serif text-[1.5rem] text-primary animate-stagger-in"
                style={{ animationDelay: "100ms" }}
              >
                Menu
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {menuOpen && (
                <div className="border-b border-border/60 pb-2 pl-4 animate-mobile-panel">
                  <Link
                    to="/menu"
                    onClick={closeMobile}
                    className="block py-2 text-base text-primary/80 [&.active]:text-accent"
                  >
                    View all
                  </Link>
                  {MENU_CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      to="/menu"
                      search={{ cat }}
                      onClick={closeMobile}
                      className="block py-2 text-base text-primary/80 [&.active]:text-accent"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              )}

              {nav.slice(1).map((n, i) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={closeMobile}
                  className="border-b border-border/60 py-3 font-serif text-[1.5rem] text-primary last:border-b-0 [&.active]:text-accent animate-stagger-in"
                  style={{ animationDelay: `${140 + i * 40}ms` }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
