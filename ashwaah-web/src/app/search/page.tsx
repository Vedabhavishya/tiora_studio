"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Loader2, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  salePrice: number;
  basePrice: number;
  images: string; // JSON string
  colors: string | null;
  gender: string | null;
  category?: string;
  isFeatured: boolean | number | null;
  isCustomizable: boolean | number | null;
  sizes?: string[];
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

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and Sorting states
  const [selectedGender, setSelectedGender] = useState<"men" | "women" | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
    // Reset filters on query change
    setSelectedGender(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSortBy("default");
  }, [query]);

  // Helper to identify if a product is home decor
  const isHomeDecor = (p: any) => {
    const cat = (p.category || "").toLowerCase();
    const nm = (p.name || "").toLowerCase();
    
    // Explicit keywords for home decor
    const homeKeywords = ["decor", "home", "cushion", "pillow", "bedsheet", "candle", "vase", "rug", "lamp", "clock", "frame", "pot", "curtain", "tapestry", "blanket", "bedding"];
    const isHomeKeyword = homeKeywords.some(kw => cat.includes(kw) || nm.includes(kw));
    
    // Make sure we don't treat personal wearables/items as home decor
    const personalItemKeywords = ["watch", "bag", "belt", "shoe", "boot", "sandal", "slipper", "footwear", "shirt", "trousers", "kurti", "bodycon", "kurta", "pant", "jogger", "dress", "clothing", "apparel"];
    const isPersonalItem = personalItemKeywords.some(kw => cat.includes(kw) || nm.includes(kw));
    
    return isHomeKeyword && !isPersonalItem;
  };

  // Check if all results are home decor
  const allResultsAreHomeDecor = useMemo(() => {
    if (products.length === 0) return false;
    return products.every((p) => isHomeDecor(p));
  }, [products]);

  // Color options and counts
  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      try {
        const parsed = JSON.parse(p.colors || "[]");
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            const trimmed = c.trim();
            if (trimmed) {
              counts[trimmed] = (counts[trimmed] || 0) + 1;
            }
          });
        } else if (p.colors && typeof p.colors === "string") {
          const trimmed = p.colors.trim();
          if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      } catch {
        if (p.colors && typeof p.colors === "string") {
          const trimmed = p.colors.trim();
          if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      }
    });
    return counts;
  }, [products]);

  const availableColors = useMemo(() => {
    return Object.keys(colorCounts).sort();
  }, [colorCounts]);

  // Size options and counts
  const sizeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const pSizes = p.sizes || [];
      pSizes.forEach((s) => {
        const normalized = s.toUpperCase().trim();
        if (normalized) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });
    return counts;
  }, [products]);

  const availableSizes = useMemo(() => {
    const order = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    return Object.keys(sizeCounts).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [sizeCounts]);

  // Filtering and Sorting logic
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // 1. Gender filter: Men or Women (single-select, bypasses home decor)
    if (selectedGender) {
      list = list.filter((p) => {
        if (isHomeDecor(p)) return true;
        const pGender = (p.gender || "").toLowerCase();
        return pGender === selectedGender || pGender === "unisex";
      });
    }

    // 2. Color filter: Multi-select
    if (selectedColors.length > 0) {
      list = list.filter((p) => {
        try {
          const parsed = JSON.parse(p.colors || "[]");
          if (Array.isArray(parsed)) {
            return parsed.some((c) => selectedColors.includes(c.trim()));
          }
          return selectedColors.includes(String(p.colors).trim());
        } catch {
          return selectedColors.includes(String(p.colors).trim());
        }
      });
    }

    // 3. Size filter: Multi-select
    if (selectedSizes.length > 0) {
      list = list.filter((p) => {
        const pSizes = (p.sizes || []).map((s) => s.toUpperCase().trim());
        return selectedSizes.some((sz) => pSizes.includes(sz));
      });
    }

    // 4. Sort by price
    if (sortBy === "price-asc") {
      list.sort((a, b) => {
        const priceA = a.salePrice || a.basePrice || 0;
        const priceB = b.salePrice || b.basePrice || 0;
        return priceA - priceB;
      });
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => {
        const priceA = a.salePrice || a.basePrice || 0;
        const priceB = b.salePrice || b.basePrice || 0;
        return priceB - priceA;
      });
    }

    return list;
  }, [products, selectedGender, selectedColors, selectedSizes, sortBy]);

  const handleGenderToggle = (gender: "men" | "women") => {
    setSelectedGender((prev) => (prev === gender ? null : gender));
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleClearFilters = () => {
    setSelectedGender(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSortBy("default");
  };

  const isFilterOrSortActive =
    selectedGender !== null ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    sortBy !== "default";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 w-full">
        <Loader2 className="animate-spin text-[#C5A059] mb-4" size={48} strokeWidth={1.5} />
        <p className="text-[#064e3b]/40 font-black uppercase tracking-[0.3em] text-[10px]">Scouring our collections...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="py-32 text-center bg-[#FFFDF6] rounded-[3rem] border border-[#064e3b]/5 shadow-sm max-w-xl mx-auto px-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <SearchIcon size={32} className="text-[#064e3b]/20" />
          </div>
          <h3 className="text-2xl font-playfair font-bold text-[#064e3b] mb-4">No Matches Found</h3>
          <p className="text-[#064e3b]/60 mb-8 leading-relaxed text-sm">
            We couldn't find any products matching your search for "{query}". Try checking your spelling or using more general terms.
          </p>
          <Link 
            href="/" 
            className="inline-block px-10 py-4 bg-[#064e3b] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#32451B] transition-all shadow-md"
          >
            Browse All Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch relative z-30">
      
      {/* Mobile Show Filters Toggle Button */}
      <div className="lg:hidden w-full px-4 pt-4">
        <button
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full flex items-center justify-between bg-white border border-[#064e3b]/10 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-[#064e3b] shadow-sm active:scale-99 transition-all"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#C5A059]" />
            {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </span>
          <span className="text-[#C5A059] font-black">
            {isFilterOrSortActive ? `(${ (selectedGender ? 1 : 0) + selectedColors.length + selectedSizes.length} Active)` : ""}
          </span>
        </button>
      </div>

      {/* Left Column: Filter Sidebar Panel */}
      <aside
        className={`w-full lg:w-72 flex-shrink-0 bg-[#FFFDF6] border-r border-[#064e3b]/10 p-6 lg:p-8 rounded-none lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:overflow-y-auto custom-scrollbar lg:block ${
          isMobileFiltersOpen ? "block" : "hidden"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#064e3b]/5 mb-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#064e3b]">Filters</h2>
          {isFilterOrSortActive && (
            <button
              onClick={handleClearFilters}
              className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Section 1: Suitable For / Gender (Single-select, hidden if all results are home decor) */}
        {!allResultsAreHomeDecor && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b]/40 mb-3 ml-1">Suitable For</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { value: "men", label: "Men" },
                { value: "women", label: "Women" }
              ].map((g) => {
                const isSelected = selectedGender === g.value;
                return (
                  <label
                    key={g.value}
                    className="flex items-center gap-3 text-xs font-bold text-[#064e3b]/75 cursor-pointer hover:text-[#064e3b] transition-colors select-none"
                  >
                    <input
                      type="radio"
                      name="gender-filter"
                      checked={isSelected}
                      onChange={() => handleGenderToggle(g.value as "men" | "women")}
                      className="rounded-full border-[#064e3b]/20 accent-[#064e3b] w-4 h-4 cursor-pointer"
                    />
                    <span className="flex-1">{g.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Colors */}
        {availableColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b]/40 mb-3 ml-1">Color</h3>
            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {availableColors.map((color) => {
                const count = colorCounts[color] || 0;
                const isChecked = selectedColors.includes(color);
                const lowerColor = color.toLowerCase();
                const hexCode = COLOR_MAP[lowerColor] || (color.startsWith("#") ? color : "#CCCCCC");
                const isWhite = lowerColor === "white" || hexCode === "#FFFFFF";

                return (
                  <label
                    key={color}
                    className="flex items-center gap-3 text-xs font-bold text-[#064e3b]/75 cursor-pointer hover:text-[#064e3b] transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleColorToggle(color)}
                      className="rounded border-[#064e3b]/20 accent-[#064e3b] w-4 h-4 cursor-pointer"
                    />
                    {/* Circle Swatch */}
                    <span
                      className={`w-3.5 h-3.5 rounded-full inline-block border shadow-sm flex-shrink-0 ${
                        isWhite ? "border-[#064e3b]/20" : "border-transparent"
                      }`}
                      style={{ backgroundColor: hexCode }}
                    />
                    <span className="flex-1 capitalize">{color}</span>
                    <span className="text-[#064e3b]/35 text-[10px] font-medium">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Sizes */}
        {availableSizes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b]/40 mb-3 ml-1">Sizes</h3>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const count = sizeCounts[size] || 0;
                const isChecked = selectedSizes.includes(size);

                return (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`h-9 min-w-[2.25rem] px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isChecked
                        ? "bg-[#064e3b] text-white border-transparent shadow-sm"
                        : "bg-[#FFFDF6] text-[#064e3b]/70 border-[#064e3b]/10 hover:border-[#064e3b]/30"
                    }`}
                  >
                    <span>{size}</span>
                    <span className={`text-[8px] font-medium ${isChecked ? "text-white/60" : "text-[#064e3b]/35"}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 4: Sort By */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b]/40 mb-3 ml-1">Sort By</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-[#FFFDF6] text-xs font-bold text-[#064e3b] border border-[#064e3b]/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </aside>

      {/* Right Column: Products Grid & Header */}
      <div className="flex-grow min-w-0 px-6 sm:px-8 lg:px-12 py-8 lg:py-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 md:mb-10 text-left border-b border-[#064e3b]/5 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <SearchIcon className="text-[#C5A059]" size={24} />
            <h1 className="text-3xl md:text-4xl font-playfair font-black text-[#064e3b] tracking-wide">
              Search Results
            </h1>
          </div>
          <p className="text-[#064e3b]/60 italic text-sm">
            Found {filteredAndSortedProducts.length} elegant {filteredAndSortedProducts.length === 1 ? "piece" : "pieces"} for "{query}"
          </p>
        </div>

        {/* Product Grid / Empty Filter State */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="py-24 text-center bg-[#FFFDF6] rounded-[2.5rem] border border-[#064e3b]/5 shadow-sm max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-[#064e3b]/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <SlidersHorizontal size={24} className="text-[#064e3b]/40" />
            </div>
            <h3 className="text-lg font-bold text-[#064e3b] mb-2">No Matching Filters</h3>
            <p className="text-[#064e3b]/60 mb-6 text-xs leading-relaxed">
              We couldn't find any products in your search results matching the selected filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-[#064e3b] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#32451B] transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => {
              let parsedImages: string[] = [];
              try {
                parsedImages = JSON.parse(product.images || "[]");
              } catch {
                parsedImages = [];
              }
              const firstImage = parsedImages.length > 0 ? parsedImages[0] : "/images/placeholder.png";

              return (
                <ProductCard 
                  key={product.id} 
                  product={{
                    id: product.id.toString(),
                    name: product.name,
                    description: product.description || "",
                    price: product.salePrice || product.basePrice,
                    basePrice: product.basePrice,
                    salePrice: product.salePrice,
                    imageUrl: firstImage,
                    images: parsedImages,
                    categorySlug: product.category || "all"
                  }} 
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-brand-light">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-[#C5A059]" size={40} />
        </div>
      }>
        <SearchResults />
      </Suspense>
    </main>
  );
}
