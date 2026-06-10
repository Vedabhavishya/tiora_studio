"use client";

import { useState, useEffect, use } from "react";
import { Sparkles, ArrowLeft, ShoppingBag, Check, X, Heart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { usePathname } from "next/navigation";
import RefineDrawer from "@/components/RefineDrawer";

interface Variation {
  id: number;
  size: string;
  color: string;
  stock: number;
  mrp: number;
  salePrice: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  salePrice: number;
  images: string; // JSON string array
  colors: string; // JSON string array
  isFeatured: boolean | number | null;
  isCustomizable: boolean | number | null;
  enabledMeasurements: string | null; // JSON string array
  gender: string | null;
  variations: Variation[];
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState("");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const pathname = usePathname();
  const isWishlisted = useWishlistStore((state) => state.items.some((item) => item.productId === Number(id)));
  const addItemToWishlist = useWishlistStore((state) => state.addItem);
  const removeItemFromWishlist = useWishlistStore((state) => state.removeItem);
  const isAuthenticated = useWishlistStore((state) => state.isAuthenticated);

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      return;
    }

    if (isWishlisted) {
      await removeItemFromWishlist(Number(id));
    } else {
      await addItemToWishlist(Number(id));
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);

          // Set initial color and size if available
          const uniqueColors = Array.from(new Set(data.variations.map((v: Variation) => v.color)));
          if (uniqueColors.length > 0) {
            const firstColor = uniqueColors[0] as string;
            setSelectedColor(firstColor);

            // Also set first size for that color
            const firstSize = data.variations.find((v: Variation) => v.color === firstColor)?.size;
            if (firstSize) setSelectedSize(firstSize);
          }

          // Set initial main image
          const images = JSON.parse(data.images || "[]");
          if (images.length > 0) {
            setMainImage(images[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand mb-4">Product Not Found</h1>
          <Link href="/" className="text-brand-accent hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const images = JSON.parse(product.images || "[]");
  const variations = product.variations || [];

  // Get unique colors available for this product
  const availableColors = Array.from(new Set(variations.map(v => v.color))).filter(Boolean);

  // Get sizes available for the selected color
  const sizesForColor = variations.filter(v => v.color === selectedColor);
  const availableSizes = Array.from(new Set(sizesForColor.map(v => v.size)));

  const isSingleSize = availableSizes.length === 1 && (
    availableSizes[0] === "Standard" || 
    availableSizes[0] === "One Size" || 
    availableSizes[0] === "No Size" || 
    availableSizes[0] === "Default"
  );

  // Current selected variation
  const currentVariation = variations.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  const displayPrice = currentVariation?.salePrice || product.salePrice || product.basePrice;
  const mrp = currentVariation?.mrp || product.basePrice;
  const currentStock = currentVariation?.stock || 0;

  const enabledMeasurementsList = JSON.parse(product.enabledMeasurements || "[]") as string[];

  const handleAddToCart = () => {
    if (!selectedColor) {
      setToast("Please select a color first");
      return;
    }
    if (!selectedSize) {
      setToast("Please select a size first");
      return;
    }
    if (!currentVariation) {
      setToast("The selected combination is currently unavailable.");
      return;
    }

    // Create a unique ID/hash for this item including customizations
    const customHash = Object.keys(measurements).length > 0
      ? `_custom_${btoa(JSON.stringify(measurements)).slice(0, 10)}`
      : "";

    addItem({
      id: `prod_${product.id}_${selectedColor}_${selectedSize}${customHash}`,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: mainImage,
      quantity: 1,
      size: selectedSize,
      color: selectedColor,
      customizations: {
        type: Object.keys(measurements).length > 0 ? "Bespoke" : "Standard",
        measurements: measurements
      },
    });

    setAdded(true);
    setToast("Item successfully added to bag!");
    setTimeout(() => {
      setAdded(false);
      setToast("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-brand-light text-brand font-sans selection:bg-brand-accent/30">
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-16">
        <Link href="/" className="inline-flex items-center space-x-3 text-brand/60 hover:text-brand-accent transition-all mb-8 text-xs font-bold uppercase tracking-widest group">
          <div className="p-2 rounded-full bg-white shadow-sm border border-brand/5 group-hover:border-brand-accent/30 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span>Back to Collections</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Image Gallery (6 cols - reduced from 7) */}
          <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-5">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto max-h-[600px] no-scrollbar">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`relative flex-shrink-0 w-20 h-24 md:w-24 md:h-32 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img ? "border-brand-accent shadow-md scale-105" : "border-transparent hover:border-brand/20"
                    }`}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 aspect-[4/5] relative rounded-2xl overflow-hidden bg-white shadow-xl group">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-6 right-6">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-brand/5 text-brand-accent">
                  <Sparkles size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-brand/5 text-brand px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Premium Collection</span>
              {currentStock > 0 && currentStock < 5 && (
                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter animate-pulse">
                  Only {currentStock} left!
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-3 leading-tight text-brand">
              {product.name}
            </h1>

            <div className="flex items-baseline space-x-3 mb-6 gap-2">
              <span className="text-2xl font-bold text-brand">₹{displayPrice.toLocaleString()}</span>
              {mrp > displayPrice && (
                <>
                  <span className="text-lg text-brand/40 line-through font-medium">₹{mrp.toLocaleString()}</span>
                  <span className="text-base font-bold text-[#cd5533]">({Math.round(((mrp - displayPrice) / mrp) * 100)}% OFF)</span>
                </>
              )}
            </div>

            <p className="text-brand/70 mb-8 text-sm leading-relaxed border-l-4 border-brand-accent/20 pl-5 italic">
              {product.description}
            </p>

            {/* Color Selector */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-5">
                <span className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                  1. Select Color <span className="text-brand/30">—</span> <span className="text-brand-accent">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      const colorSizes = variations.filter(v => v.color === color).map(v => v.size);
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
                    className={`relative w-12 h-12 rounded-full border-2 p-1 transition-all ${selectedColor === color
                        ? "border-brand-accent scale-110 shadow-lg"
                        : "border-transparent hover:border-brand/20"
                      }`}
                    title={color}
                  >
                    <div
                      className="w-full h-full rounded-full border border-black/5"
                      style={{ backgroundColor: color.toLowerCase() }}
                    >
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <Check size={16} className="drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            {!isSingleSize && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                    2. Select Size <span className="text-brand/30">—</span> <span className="text-brand-accent">{selectedSize || "None"}</span>
                  </span>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[10px] text-brand/40 hover:text-brand-accent font-bold uppercase tracking-widest transition-colors underline underline-offset-4"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => {
                    const variation = variations.find(v => v.color === selectedColor && v.size === size);
                    const isOutOfStock = variation ? variation.stock === 0 : true;
  
                    return (
                      <button
                        key={size}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 ${selectedSize === size
                            ? "bg-brand text-white border-brand scale-105 shadow-md"
                            : isOutOfStock
                              ? "bg-brand/5 text-brand/20 border-transparent cursor-not-allowed line-through opacity-50"
                              : "bg-white text-brand/70 border-brand/5 hover:border-brand-accent hover:text-brand shadow-sm"
                          }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Fit Section - Interactive Dropdown */}
            {product.isCustomizable && enabledMeasurementsList.length > 0 && (
              <div className="mb-12">
                <button 
                  onClick={() => setIsCustomOpen(!isCustomOpen)}
                  className="w-full flex items-center justify-between p-6 rounded-3xl transition-all border-2 shadow-sm bg-brand text-white border-brand hover:bg-brand-hover"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-2xl bg-white/20 text-white transition-all">
                      <Sparkles size={20} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-black uppercase tracking-widest block text-white">3. Customize My Fit (Inches)</span>
                      <p className="text-[10px] font-medium mt-1 text-white/70">
                        {isCustomOpen ? "Refining your bespoke measurements" : "Click to provide your exact measurements"}
                      </p>
                    </div>
                  </div>
                  <div className={`transition-transform duration-500 ${isCustomOpen ? "rotate-180" : "rotate-0"}`}>
                    <ArrowLeft size={20} className="-rotate-90 text-white" />
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCustomOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
                  <div className="bg-white rounded-3xl p-6 border-2 border-brand/10 shadow-lg">
                    <div className="grid grid-cols-2 gap-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {enabledMeasurementsList.map((m) => (
                        <div key={m} className="flex flex-col space-y-2">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest pl-1">{m}</label>
                          <select
                            value={measurements[m] || ""}
                            onChange={(e) => setMeasurements(prev => ({ ...prev, [m]: e.target.value }))}
                            className="w-full bg-brand/5 border border-brand/10 rounded-xl px-4 py-3 text-xs font-bold text-brand outline-none focus:border-brand-accent transition-all hover:bg-brand/10"
                          >
                            <option value="">Select</option>
                            {Array.from({ length: 991 }, (_, i) => (1.0 + i * 0.1).toFixed(1)).map(val => (
                              <option key={val} value={val}>{val}"</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-brand/10 flex items-center justify-between">
                      <p className="text-[9px] text-brand/40 font-medium italic">* Measurements are in inches (")</p>
                      {Object.keys(measurements).length > 0 && (
                        <button
                          onClick={() => setMeasurements({})}
                          className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                        >
                          Reset All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart & Wishlist */}
            <div className="mt-auto pt-6 border-t border-brand/5 flex items-center gap-4 w-full">
              <button
                disabled={!!(selectedColor && selectedSize && currentStock === 0)}
                onClick={handleAddToCart}
                className={`flex-grow flex items-center justify-center space-x-3 font-bold py-4 rounded-2xl transition-all text-base shadow-xl ${selectedColor && selectedSize && currentStock === 0
                    ? "bg-brand/10 text-brand/30 cursor-not-allowed"
                    : "bg-brand text-white hover:bg-brand-hover active:scale-[0.98] border border-transparent hover:border-brand-accent"
                  }`}
              >
                {added ? (
                  <Check size={22} className="text-brand-accent animate-in zoom-in duration-300" />
                ) : (
                  <ShoppingBag size={22} className="transition-all" />
                )}
                <span className={added ? "text-brand-accent transition-colors duration-300" : ""}>
                  {selectedColor && selectedSize && currentStock === 0 ? "Out of Stock" : added ? "Added to Bag!" : "Add to Bag"}
                </span>
              </button>
              
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                  isWishlisted 
                    ? "border-red-500 bg-red-50 text-red-500 hover:bg-red-100" 
                    : "border-brand/10 bg-white text-brand hover:border-brand-accent/50 hover:bg-brand/5"
                }`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? "fill-red-500 text-red-500" : "text-brand"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#1B3022] text-[#C5A059] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Check size={18} />
            <span>{toast}</span>
          </div>
        )}
      </main>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand/60 backdrop-blur-md" onClick={() => setIsSizeGuideOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-brand/5 flex items-center justify-between bg-brand/5">
              <h2 className="text-2xl font-serif font-bold text-brand">Size Guide</h2>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="p-2 hover:bg-brand/10 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex justify-center mb-8 bg-brand/5 p-2 rounded-2xl">
                <button
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${product.gender === 'men' ? 'bg-brand text-white shadow-lg' : 'text-brand/40 hover:text-brand'}`}
                  onClick={() => setProduct(p => p ? { ...p, gender: 'men' } : null)}
                >
                  Men's Guide
                </button>
                <button
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${product.gender === 'women' ? 'bg-brand text-white shadow-lg' : 'text-brand/40 hover:text-brand'}`}
                  onClick={() => setProduct(p => p ? { ...p, gender: 'women' } : null)}
                >
                  Women's Guide
                </button>
              </div>

              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-brand/5 bg-white">
                <img
                  src={product.gender === 'men' ? "/images/guides/male.jpg" : "/images/guides/female.jpg"}
                  alt={`${product.gender} Size Guide`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/600x800/f5f0e8/1b3022?text=Size+Guide+Image+Not+Found";
                  }}
                />
              </div>

              <div className="mt-8 space-y-4">
                <h4 className="text-xs font-black text-brand uppercase tracking-widest">How to Measure?</h4>
                <p className="text-xs text-brand/60 leading-relaxed">
                  For the most accurate fit, we recommend having someone else measure you. Hold the tape measure snug, but not tight, against your body.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-brand/5 rounded-2xl">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Bust / Chest</p>
                    <p className="text-[10px] text-brand/40">Measure around the fullest part of your chest.</p>
                  </div>
                  <div className="p-4 bg-brand/5 rounded-2xl">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Waist</p>
                    <p className="text-[10px] text-brand/40">Measure around your natural waistline.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-brand/5 border-t border-brand/5 flex justify-center">
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="bg-brand text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-hover transition-all shadow-xl"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
