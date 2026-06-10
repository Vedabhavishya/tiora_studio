import { create } from "zustand";

export interface WishlistItem {
  wishlistId: number;
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
}

interface WishlistStore {
  items: WishlistItem[];
  isLoaded: boolean;
  isAuthenticated: boolean;
  setItems: (items: WishlistItem[]) => void;
  addItem: (productId: number) => Promise<boolean>;
  removeItem: (productId: number) => Promise<boolean>;
  hasItem: (productId: number) => boolean;
  fetchWishlist: () => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoaded: false,
  isAuthenticated: false,

  setItems: (items) => set({ items, isLoaded: true }),

  hasItem: (productId) => {
    return get().items.some((item) => item.productId === productId);
  },

  fetchWishlist: async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const mapped = data.items.map((item: any) => {
            let firstImage = "/images/placeholder.png";
            try {
              const parsedImages = JSON.parse(item.product.images || "[]");
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                firstImage = parsedImages[0];
              } else if (item.product.imageUrl) {
                firstImage = item.product.imageUrl;
              }
            } catch (e) {
              if (item.product.imageUrl) firstImage = item.product.imageUrl;
            }

            const basePrice = item.product.basePrice ?? 0;
            const salePrice = item.product.salePrice ?? 0;
            const activePrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;

            return {
              wishlistId: item.id,
              productId: item.productId,
              name: item.product.name,
              price: activePrice,
              imageUrl: firstImage,
              category: item.product.category || "",
              description: item.product.description || "",
            };
          });
          set({ items: mapped, isLoaded: true, isAuthenticated: true });
        }
      } else if (res.status === 401) {
        set({ items: [], isLoaded: true, isAuthenticated: false });
      }
    } catch (err) {
      console.error("Failed to fetch wishlist", err);
    }
  },

  addItem: async (productId) => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await get().fetchWishlist();
          return true;
        }
      } else if (res.status === 401) {
        set({ isAuthenticated: false });
      }
      return false;
    } catch (err) {
      console.error("Failed to add to wishlist", err);
      return false;
    }
  },

  removeItem: async (productId) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await get().fetchWishlist();
          return true;
        }
      } else if (res.status === 401) {
        set({ isAuthenticated: false });
      }
      return false;
    } catch (err) {
      console.error("Failed to remove from wishlist", err);
      return false;
    }
  },

  clearWishlist: () => set({ items: [], isLoaded: false, isAuthenticated: false }),
}));
