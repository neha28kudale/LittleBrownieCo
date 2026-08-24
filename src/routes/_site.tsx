import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { AllergyBanner } from "@/components/site/AllergyBanner";
import { ScrollProgressBar } from "@/components/site/ScrollProgressBar";
import { CartDrawer } from "@/components/site/CartDrawer";
import { CartProvider } from "@/lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  const location = useLocation();

  return (
    <FavoritesProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <ScrollProgressBar />
          <Header />
          <AllergyBanner />
          <main className="flex-1">
            {/* key={pathname} forces a remount on route change, which retriggers animate-page-in */}
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </main>
          <Footer />
          <WhatsAppFab />
          <CartDrawer />
          <Toaster position="bottom-center" theme="light" />
        </div>
      </CartProvider>
    </FavoritesProvider>
  );
}
