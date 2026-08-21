import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { getProducts, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/ProductCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — Little Brownie Co." },
      {
        name: "description",
        content: "Your saved favorite brownies and treats from Little Brownie Co.",
      },
      { property: "og:title", content: "My Favorites — Little Brownie Co." },
      { property: "og:description", content: "Your personalized collection of favorite products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const { favorites, clearFavorites } = useFavorites();
  const { add } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const prods = await getProducts();
      setProducts(prods);
      setLoading(false);
    };
    load();
  }, []);

  const favoriteProducts = products.filter((p) => favorites.some((f) => f.productId === p.id));

  const handleAddToCart = (product: Product, variant: Product["variants"][number], qty: number) => {
    add(product, variant, qty);
    toast.success(`${product.name} added to cart!`);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all favorites?")) {
      clearFavorites();
      toast.success("Favorites cleared");
    }
  };

  return (
    <section className="container-x py-10 md:py-16">
      <Link
        to="/menu"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
      </Link>

      <div className="mt-6 flex items-baseline justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Your Collection</span>
          <h1 className="mt-3 font-serif text-4xl text-primary sm:text-5xl md:text-6xl">
            My Favorites
          </h1>
        </div>
        {favoriteProducts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-12 text-center text-muted-foreground">
          <p>Loading favorites...</p>
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="mt-12 rounded-lg border border-border bg-secondary/30 p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 font-serif text-2xl text-primary">No favorites yet</h2>
          <p className="mt-2 text-muted-foreground">
            Start adding your favorite brownies to create your personalized collection!
          </p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground hover:bg-cocoa-dark active:bg-cocoa-dark transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Menu
          </Link>
        </div>
      ) : (
        <div>
          <p className="mt-6 text-sm text-muted-foreground">
            {favoriteProducts.length} item{favoriteProducts.length !== 1 ? "s" : ""} saved
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="font-serif text-2xl text-primary">Ready to order?</h2>
            <p className="mt-2 text-muted-foreground">
              Add items from your favorites to your cart and proceed to checkout.
            </p>
            <Link
              to="/cart"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground hover:bg-cocoa-dark active:bg-cocoa-dark transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Go to Cart
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
