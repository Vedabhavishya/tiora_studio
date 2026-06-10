"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Trash2, ShoppingBag, X, Check, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";

interface Variation {
  id: number;
  size: string;
  color: string;
  stock: number;
  mrp: number;
  salePrice: number;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  salePrice: number;
  images: string; // JSON string array
  colors: string; // JSON string array
  variations: Variation[];
}

const COLOR_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#171717",
  red: "#EF4444",
  blue: "#3B82F6",
  "sky blue": "#0EA5E9",
  navy: "#1E3A8A",
  grey: "#737373",
  gray: "#737373",
  brown: "#78350F",
  maroon: "#5C1D16",
  pink: "#EC4899",
  beige: "#EADED2",
  gold: "#C5A059",
  "forest green": "#1B3022",
  green: "#22C55E",
  yellow: "#EAB308",
};

const getColorHex = (colorName: string) => {
  const lower = colorName.toLowerCase();
  return COLOR_MAP[lower] || (colorName.startsWith("#") ? colorName : "#CCCCCC");
};

export default function WishlistPage() {
  const router = useRouter();
  
  // Zustand Stores
  const wishlistItems = useWishlistStore((state) => state.items);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const isAuthenticated = useWishlistStore((state) => state.isAuthenticated);
  const isLoaded = useWishlistStore((state) => state.isLoaded);
  const addItemToCart = useCartStore((state) => state.addItem);

  // Component States
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ productId: number; name: string; imageUrl: string; price: number } | null>(null);
  
  // Modal product details
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<string | null>(null);

  // Authentication and Wishlist fetch on mount
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      await fetchWishlist();
      setLoadingAuth(false);
    };
    checkAuthAndFetch();
  }, [fetchWishlist]);

  // Redirect to login if user is not authenticated after store is loaded
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/wishlist")}`);
    }
  }, [isLoaded, isAuthenticated, router]);

  // Fetch product variations when "Move to Bag" is clicked
  const handleOpenMoveModal = async (item: { productId: number; name: string; imageUrl: string; price: number }) => {
    setSelectedItem(item);
    setModalOpen(true);
    setLoadingDetails(true);
    setProductDetails(null);
    setSelectedColor(null);
    setSelectedSize(null);

    try {
      const res = await fetch(`/api/products/${item.productId}`);
      if (res.ok) {
        const data = await res.json();
        setProductDetails(data);

        // Pre-select first color
        const colorsList = Array.from(new Set(data.variations.map((v: Variation) => v.color))) as string[];
        if (colorsList.length > 0) {
          const firstColor = colorsList[0];
          setSelectedColor(firstColor);

          // If this color only has one size option, auto-select it
          const colorSizes = data.variations.filter((v: Variation) => v.color === firstColor).map((v: Variation) => v.size);
          const isSingle = colorSizes.length === 1 && (
            colorSizes[0] === "Standard" || 
            colorSizes[0] === "One Size" || 
            colorSizes[0] === "No Size" || 
            colorSizes[0] === "Default"
          );
          if (isSingle) {
            setSelectedSize(colorSizes[0]);
          }
        }
      } else {
        console.error("Failed to load product variations");
      }
    } catch (error) {
      console.error("Error loading product details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle addition to cart and removal from wishlist
  const handleMoveToBagConfirm = async () => {
    if (!selectedItem || !productDetails || !selectedColor || !selectedSize) {
      return;
    }

    // Find the matching variation
    const variation = productDetails.variations.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );

    if (!variation) {
      setToast("The selected combination is currently unavailable.");
      return;
    }

    if (variation.stock === 0) {
      setToast("The selected variant is out of stock.");
      return;
    }

    const price = variation.salePrice || productDetails.salePrice || productDetails.basePrice;

    // Add to cart
    addItemToCart({
      id: `prod_${productDetails.id}_${selectedColor}_${selectedSize}`,
      productId: productDetails.id,
      name: productDetails.name,
      price: price,
      image: selectedItem.imageUrl,
      quantity: 1,
      size: selectedSize,
      color: selectedColor,
      customizations: {
        type: "Standard",
        measurements: {}
      }
    });

    // Remove from wishlist
    await removeItem(productDetails.id);

    // Show toast and close modal
    showToast(`${productDetails.name} moved to bag successfully!`);
    setModalOpen(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Loading Screen
  if (loadingAuth || !isLoaded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F5EBE0]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#064e3b]" />
          <p className="text-xs font-black uppercase tracking-widest text-[#064e3b]/60">Loading Wishlist...</p>
        </div>
      </div>
    );
  }

  // Extract variables for Modal UI
  const availableColors = productDetails 
    ? Array.from(new Set(productDetails.variations.map((v) => v.color))).filter(Boolean) as string[]
    : [];

  const sizesForSelectedColor = productDetails && selectedColor
    ? productDetails.variations.filter((v) => v.color === selectedColor)
    : [];

  const availableSizes = Array.from(new Set(sizesForSelectedColor.map((v) => v.size))) as string[];

  const isSingleSize = availableSizes.length === 1 && (
    availableSizes[0] === "Standard" || 
    availableSizes[0] === "One Size" || 
    availableSizes[0] === "No Size" || 
    availableSizes[0] === "Default"
  );

  return (
    <div className="min-h-screen bg-[#F5EBE0] text-[#1B3022] font-sans">
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-playfair text-3xl md:text-4xl font-medium tracking-wide mb-2">My Wishlist</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B3022]/60">
            {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"} Saved
          </p>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 bg-[#FFFDF6] rounded-[2.5rem] border border-brand/5 shadow-sm max-w-xl mx-auto px-8">
            <Heart className="mx-auto mb-6 opacity-20 text-[#064e3b] animate-pulse" size={56} />
            <h2 className="text-xl font-playfair font-bold text-[#1B3022] mb-3">Your wishlist is empty</h2>
            <p className="text-sm text-[#1B3022]/60 mb-8 max-w-sm mx-auto leading-relaxed">
              Explore our designer collections and save your favorite outfits here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest bg-[#064e3b] text-white px-8 py-4 rounded-xl hover:bg-[#32451B] transition shadow-lg"
            >
              <span>Explore Collections</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              // Calculate discount if MRP and Sale price are configured
              return (
                <div
                  key={item.productId}
                  className="group flex flex-col w-full bg-[#FFFDF6] rounded-3xl border border-brand/5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 overflow-hidden relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="absolute top-3 right-3 z-10 p-2 bg-[#FFFDF6] hover:bg-red-50 text-[#1B3022]/60 hover:text-red-500 rounded-full border border-brand/5 transition-all shadow-sm cursor-pointer"
                    aria-label="Remove from Wishlist"
                  >
                    <X size={14} />
                  </button>

                  {/* Image */}
                  <Link href={`/product/${item.productId}`} className="relative w-full aspect-[4/5] overflow-hidden bg-brand-light/50 border-b border-brand/5 block">
                    <img
                      src={item.imageUrl || "/images/placeholder.png"}
                      alt={item.name}
                      className={`absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ${
                        item.totalStock === 0 ? "opacity-60 grayscale" : ""
                      }`}
                    />
                    {item.totalStock === 0 && (
                      <div className="absolute inset-x-0 bottom-0 bg-white py-2.5 text-center border-t border-brand/5 shadow-sm">
                        <span className="text-xs font-black tracking-[0.2em] text-[#EF4444] uppercase">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Card Info */}
                  <div className="pt-3 pb-3 px-3 flex flex-col flex-1">
                    <h3 className="text-xs md:text-sm font-black tracking-widest text-[#1B3022] uppercase line-clamp-1 mb-0.5">
                      {item.name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-[#064e3b] font-bold uppercase tracking-widest mb-1.5">
                      {item.category}
                    </p>
                    <p className="text-xs md:text-sm font-black text-[#1B3022] mb-3">
                      ₹{item.price.toLocaleString()}
                    </p>

                    {/* Move to Bag Button */}
                    <button
                      disabled={item.totalStock === 0}
                      onClick={() => handleOpenMoveModal(item)}
                      className={`w-full mt-auto flex items-center justify-center space-x-2 font-bold py-3.5 rounded-2xl transition-all text-xs tracking-wider uppercase shadow-md ${
                        item.totalStock === 0
                          ? "bg-[#1B3022]/10 text-[#1B3022]/30 cursor-not-allowed shadow-none border border-[#1B3022]/5"
                          : "bg-[#064e3b] text-white hover:bg-[#32451B] cursor-pointer border border-transparent hover:border-brand-accent/20"
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>{item.totalStock === 0 ? "Out of Stock" : "Move to Bag"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Move to Bag Selection Modal */}
      <AnimatePresence>
        {modalOpen && selectedItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden z-10 flex flex-col"
            >
              
              {/* Close Icon */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-brand/5 rounded-full transition-all text-[#1B3022]/60 hover:text-[#1B3022] cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                
                {/* Product Detail Header */}
                <div className="flex items-center space-x-4 pr-6 mb-6">
                  <div className="w-16 h-20 bg-brand-light/30 rounded-xl overflow-hidden flex-shrink-0 border border-brand/5">
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-[#1B3022] leading-tight mb-1 truncate">
                      {selectedItem.name}
                    </h2>
                    <p className="text-sm font-black text-[#064e3b]">
                      ₹{selectedItem.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <hr className="border-brand/5 mb-6" />

                {/* Loading state for variations */}
                {loadingDetails ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#064e3b] mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1B3022]/40">
                      Loading available options...
                    </p>
                  </div>
                ) : (
                  productDetails && (
                    <div className="space-y-6">
                      
                      {/* Color Selector */}
                      {availableColors.length > 0 && (
                        <div>
                          <span className="block text-xs font-black uppercase tracking-widest text-[#1B3022]/50 mb-3">
                            Select Color: <span className="text-[#064e3b] font-black">{selectedColor}</span>
                          </span>
                          <div className="flex flex-wrap gap-3">
                            {availableColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => {
                                  setSelectedColor(color);
                                  // Reset selected size when color changes, unless it's a single standard size
                                  const colorSizes = productDetails.variations
                                    .filter((v) => v.color === color)
                                    .map((v) => v.size);
                                  const isSingle = colorSizes.length === 1 && (
                                    colorSizes[0] === "Standard" || 
                                    colorSizes[0] === "One Size" || 
                                    colorSizes[0] === "No Size" || 
                                    colorSizes[0] === "Default"
                                  );
                                  if (isSingle) {
                                    setSelectedSize(colorSizes[0]);
                                  } else {
                                    setSelectedSize(null);
                                  }
                                }}
                                className={`relative w-8 h-8 rounded-full border p-0.5 transition-all ${
                                  selectedColor === color
                                    ? "border-[#064e3b] scale-110 shadow-sm"
                                    : "border-transparent hover:border-[#1B3022]/20"
                                }`}
                                title={color}
                              >
                                <div
                                  className="w-full h-full rounded-full border border-black/5"
                                  style={{ backgroundColor: getColorHex(color) }}
                                />
                                {selectedColor === color && (
                                  <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <Check size={12} className="drop-shadow-md text-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size Selector */}
                      {!isSingleSize && availableSizes.length > 0 && (
                        <div>
                          <span className="block text-xs font-black uppercase tracking-widest text-[#1B3022]/50 mb-3">
                            Select Size: <span className="text-[#064e3b] font-black">{selectedSize || "None"}</span>
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {availableSizes.map((size) => {
                              const variation = productDetails.variations.find(
                                (v) => v.color === selectedColor && v.size === size
                              );
                              const isOutOfStock = variation ? variation.stock === 0 : true;

                              return (
                                <button
                                  key={size}
                                  disabled={isOutOfStock}
                                  onClick={() => setSelectedSize(size)}
                                  className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                                    isOutOfStock
                                      ? "border-brand/5 bg-brand/5 text-brand/20 cursor-not-allowed line-through"
                                      : selectedSize === size
                                      ? "bg-[#064e3b] text-white border-transparent scale-105 shadow-sm"
                                      : "border-[#1B3022]/10 bg-white text-[#1B3022] hover:border-[#064e3b]/50 hover:bg-[#064e3b]/5"
                                  }`}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Confirm Move Button */}
                      <button
                        onClick={handleMoveToBagConfirm}
                        disabled={!selectedColor || !selectedSize}
                        className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg mt-8 flex items-center justify-center space-x-2 ${
                          !selectedColor || !selectedSize
                            ? "bg-[#1B3022]/15 text-[#1B3022]/30 cursor-not-allowed"
                            : "bg-[#064e3b] text-white hover:bg-[#32451B] active:scale-[0.98] cursor-pointer"
                        }`}
                      >
                        <Check size={16} />
                        <span>Done</span>
                      </button>
                    </div>
                  )
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] bg-[#1B3022] text-[#C5A059] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
