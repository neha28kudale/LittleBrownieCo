import { Link } from "@tanstack/react-router";
import { Instagram, MapPin } from "lucide-react";
import {
  FSSAI_NUMBER,
  IMG,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/products";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-surface-soft md:mt-28">
      <div className="container-x grid gap-10 py-12 md:grid-cols-2 md:gap-12 md:py-16 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={IMG.logo}
              alt="Little Brownie Co. logo"
              className="h-12 w-12 rounded-full border border-border/80 object-cover shadow-soft"
            />
            <div className="font-serif text-[1.4rem] leading-none text-primary sm:text-[1.6rem]">
              Little Brownie Co.
            </div>
          </div>
          <h4 className="hidden text-xs uppercase tracking-[0.24em] text-transparent md:block" aria-hidden="true">
            Order Online
          </h4>
          <ul className="mt-6 space-y-2.5 text-sm md:mt-5">
            <li>
              <Link to="/menu" className="text-primary/80 hover:text-accent">
                Order Online
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-primary/80 hover:text-accent">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/faqs" className="text-primary/80 hover:text-accent">
                FAQs & Contact
              </Link>
            </li>
            {/* "Updates" hidden for now per owner request — route still exists
                at /updates, ready to re-enable by uncommenting this link. */}
            {/* <li>
              <Link to="/updates" className="text-primary/80 hover:text-accent">
                Updates
              </Link>
            </li> */}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Good to Know
          </h4>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <Link to="/good-to-know" className="text-primary/80 hover:text-accent">
                Ingredients, Allergens &amp; Storage
              </Link>
            </li>
            <li>
              <Link to="/sustainable-packaging" className="text-primary/80 hover:text-accent">
                Sustainable Packaging
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Policies</h4>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <Link to="/policies" className="text-primary/80 hover:text-accent">
                Policies
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Follow Us</h4>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <a
                href="https://www.instagram.com/littlebrownieco.blr?igsh=MXZjejM3YTNwOXczaA==&igsi=MXZjejM3YTNwOXczaA=="
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-primary/80 hover:text-accent"
              >
                <Instagram className="h-4 w-4 text-accent" />
                Instagram
              </a>
            </li>
            <li>
              <a
                href={whatsappLink("Hi Little Brownie Co.!")}
                target="_blank"
                rel="noreferrer"
                className="text-primary/80 hover:text-accent"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container-x flex flex-col items-center gap-2 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-center sm:gap-4">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            Bangalore
          </span>
          <span className="hidden sm:inline">·</span>
          <span>FSSAI: {FSSAI_NUMBER}</span>
          <span className="hidden sm:inline">·</span>
          <span>© 2026 Little Brownie Co.</span>
        </div>
      </div>
    </footer>
  );
}
