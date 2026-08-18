import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { AllergyBanner } from "@/components/site/AllergyBanner";
import { CartProvider } from "@/lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <FavoritesProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <AllergyBanner />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <WhatsAppFab />
          <Toaster position="bottom-center" theme="light" />
        </div>
      </CartProvider>
    </FavoritesProvider>
  );
}
