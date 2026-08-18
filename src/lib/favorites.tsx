import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type FavoriteItem = {
  productId: string;
  addedAt: string;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  isFavorited: (productId: string) => boolean;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = "lbc_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setFavorites(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to load favorites", e);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage when favorites change
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isHydrated]);

  const isFavorited = (productId: string) => {
    return favorites.some((f) => f.productId === productId);
  };

  const addFavorite = (productId: string) => {
    if (!isFavorited(productId)) {
      setFavorites([...favorites, { productId, addedAt: new Date().toISOString() }]);
    }
  };

  const removeFavorite = (productId: string) => {
    setFavorites(favorites.filter((f) => f.productId !== productId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const value: FavoritesContextType = {
    favorites,
    isFavorited,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
