"use client";

import React, { useState, useMemo } from "react";
import { SlidersHorizontal, ChevronDown, Check, X, ArrowUpDown, Grid, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCarousel from "@/components/ProductCarousel";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: any;
  name: string;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  images: string | null;
  imageUrl: string | null;
  colors: string | null;
  category: string | null;
  gender: string | null;
  isCustomizable: boolean | null;
}

interface Section {
  id: any;
  title: string;
  menuId: number;
  productIds: string;
  displayOrder: number;
  products: Product[];
}

interface CategoryFilterSectionProps {
  initialSections: Section[];
  initialDisplayProducts: Product[];
  categoryName: string;
  slug: string;
}

// Color map for common color names to Hex colors
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

export default function CategoryFilterSection({
  initialSections,
  initialDisplayProducts,
  categoryName,
  slug,
}: CategoryFilterSectionProps) {
  // 1. Flatten and deduplicate all products for filtering
  const allProducts = useMemo(() => {
    const map = new Map<string, Product>();

    // Add display products first
    initialDisplayProducts.forEach((p) => {
      map.set(String(p.id), p);
    });

    // Add section products
    initialSections.forEach((section) => {
      (section.products || []).forEach((p) => {
        map.set(String(p.id), p);
      });
    });

    return Array.from(map.values());
  }, [initialSections, initialDisplayProducts]);

  // 2. Classify product types dynamically based on name and category
  const productsWithTypes = useMemo(() => {
    return allProducts.map((p) => {
      let type = "Other";
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();

      if (name.includes("t-shirt") || name.includes("tshirt") || name.includes("polo") || name.includes("tee")) {
        type = "T-Shirt";
      } else if (name.includes("shirt")) {
        type = "Shirt";
      } else if (
        category.includes("ethnic") ||
        name.includes("kurta") ||
        name.includes("kurti") ||
        name.includes("lehenga") ||
        name.includes("saree") ||
        name.includes("sharara") ||
        name.includes("anarkali")
      ) {
        type = "Ethnic Wear";
      } else if (
        category.includes("suitings") ||
        category.includes("work wear") ||
        category.includes("office wear") ||
        category.includes("corporate") ||
        name.includes("blazer") ||
        name.includes("suit") ||
        name.includes("formal")
      ) {
        type = "Workwear";
      } else if (name.includes("dress") || name.includes("gown") || name.includes("bodycon") || category.includes("dresses")) {
        type = "Dresses";
      } else if (name.includes("jogger") || name.includes("pants") || name.includes("cargo") || name.includes("trousers")) {
        type = "Pants & Joggers";
      } else {
        // Fallback to the product's database category
        type = p.category || "Other";
      }
      return { ...p, classifiedType: type };
    });
  }, [allProducts]);

  // 3. Extract unique types and colors dynamically
  const availableTypes = useMemo(() => {
    const typesSet = new Set<string>();
    productsWithTypes.forEach((p) => {
      if (p.classifiedType) typesSet.add(p.classifiedType);
    });
    return Array.from(typesSet).sort();
  }, [productsWithTypes]);

  const availableColors = useMemo(() => {
    const colorsSet = new Set<string>();
    productsWithTypes.forEach((p) => {
      try {
        const parsed = JSON.parse(p.colors || "[]");
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (c && typeof c === "string" && c.trim()) {
              colorsSet.add(c.trim());
            }
          });
        } else if (typeof p.colors === "string" && p.colors.trim()) {
          colorsSet.add(p.colors.trim());
        }
      } catch {
        if (typeof p.colors === "string" && p.colors.trim()) {
          colorsSet.add(p.colors.trim());
        }
      }
    });
    return Array.from(colorsSet).sort();
  }, [productsWithTypes]);

  // 4. Filtering and Sorting States
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const isFilterOrSortActive = selectedType !== null || selectedColor !== null || sortBy !== "default";

  // 5. Apply filters & sort
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...productsWithTypes];

    // Filter by type
    if (selectedType) {
      list = list.filter((p) => p.classifiedType === selectedType);
    }

    // Filter by color
    if (selectedColor) {
      list = list.filter((p) => {
        try {
          const parsed = JSON.parse(p.colors || "[]");
          if (Array.isArray(parsed)) {
            return parsed.some((c) => c.trim().toLowerCase() === selectedColor.toLowerCase());
          }
          return String(p.colors).toLowerCase() === selectedColor.toLowerCase();
        } catch {
          return String(p.colors).toLowerCase() === selectedColor.toLowerCase();
        }
      });
    }

    // Sort by Price (salePrice if available, otherwise basePrice)
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
  }, [productsWithTypes, selectedType, selectedColor, sortBy]);

  const handleClearFilters = () => {
    setSelectedType(null);
    setSelectedColor(null);
    setSortBy("default");
  };

  return (
    <div className="w-full">
      {/* Dynamic Filters & Sort Controls Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-brand/10 p-5 rounded-[2rem] shadow-sm mb-10 flex flex-col gap-6 relative z-40">
        
        {/* Row 1: Type Filter Pills (Standard Scrollable List) */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/40 ml-1">Filter by Category / Type</span>
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                selectedType === null
                  ? "bg-brand text-white shadow-md shadow-brand/10"
                  : "bg-brand/5 border border-brand/10 text-brand/70 hover:bg-brand/10 hover:text-brand"
              }`}
            >
              All Items
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                  selectedType === type
                    ? "bg-brand text-white shadow-md shadow-brand/10"
                    : "bg-brand/5 border border-brand/10 text-brand/70 hover:bg-brand/10 hover:text-brand"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-brand/5 w-full"></div>

        {/* Row 2: Color and Sort Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Colors Selection Grid */}
          {availableColors.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/40 ml-1">Filter by Color</span>
              <div className="flex flex-wrap gap-3 items-center">
                {availableColors.map((color) => {
                  const lowerColor = color.toLowerCase();
                  const hexCode = COLOR_MAP[lowerColor] || (color.startsWith("#") ? color : "#CCCCCC");
                  const isWhite = lowerColor === "white" || hexCode === "#FFFFFF";
                  const isSelected = selectedColor === color;

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(isSelected ? null : color)}
                      className={`relative w-8 h-8 rounded-full border transition-all duration-300 hover:scale-115 flex items-center justify-center cursor-pointer shadow-sm group ${
                        isWhite ? "border-brand/20" : "border-transparent"
                      } ${
                        isSelected 
                          ? "ring-2 ring-brand ring-offset-2 scale-110 shadow-md" 
                          : "hover:ring-1 hover:ring-brand/35 hover:ring-offset-1"
                      }`}
                      style={{ backgroundColor: hexCode }}
                    >
                      {/* Selection Mark */}
                      {isSelected && (
                        <Check 
                          size={14} 
                          className={isWhite ? "text-brand" : "text-white drop-shadow-md"} 
                          strokeWidth={3}
                        />
                      )}
                      {/* Tooltip */}
                      <span className="absolute bottom-full mb-2 scale-0 group-hover:scale-100 transition-all duration-200 bg-brand text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-md pointer-events-none whitespace-nowrap z-50">
                        {color}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sorting Dropdown & Clear Filters */}
          <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="flex flex-col gap-2.5 w-48">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/40 ml-1">Sort Products</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-brand/5 border border-brand/10 hover:border-brand-accent/50 text-brand text-xs font-bold uppercase tracking-widest py-3 pl-4 pr-10 rounded-2xl outline-none appearance-none cursor-pointer transition-all shadow-sm"
                >
                  <option value="default" className="text-brand bg-[#FFFDF6]">Sort: Default</option>
                  <option value="price-asc" className="text-brand bg-[#FFFDF6]">Price: Low to High</option>
                  <option value="price-desc" className="text-brand bg-[#FFFDF6]">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/50 pointer-events-none" />
              </div>
            </div>

            {isFilterOrSortActive && (
              <button
                onClick={handleClearFilters}
                className="mt-6 p-3 rounded-2xl bg-brand/5 border border-brand/10 text-brand hover:bg-brand-accent hover:text-white transition-all shadow-sm hover:border-transparent active:scale-95 flex items-center justify-center group"
                aria-label="Clear Filters"
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Layout Rendering: Dynamic Carousels vs Product Grid */}
      <AnimatePresence mode="wait">
        {!isFilterOrSortActive && initialSections.length > 0 ? (
          <motion.div
            key="carousel-sections"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {initialSections.map((section) => (
              <ProductCarousel
                key={section.id}
                title={section.title}
                products={section.products}
              />
            ))}
          </motion.div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <motion.div
            key="grid-layout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {isFilterOrSortActive && (
              <div className="flex items-center justify-between border-b border-brand/5 pb-2">
                <span className="text-xs font-bold text-brand/60 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal size={12} />
                  Found {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-bold text-brand/60 uppercase tracking-widest flex items-center gap-1.5">
                  <LayoutGrid size={12} />
                  Grid View
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((p) => {
                let firstImage = "/images/placeholder.png";
                try {
                  const parsedImages = JSON.parse(p.images || "[]");
                  if (parsedImages.length > 0) {
                    firstImage = parsedImages[0];
                  } else if (p.imageUrl) {
                    firstImage = p.imageUrl;
                  }
                } catch (e) {
                  if (p.imageUrl) firstImage = p.imageUrl;
                }

                const productProps = {
                  id: String(p.id),
                  name: p.name,
                  description: p.description || "",
                  price: p.salePrice || p.basePrice,
                  basePrice: p.basePrice,
                  salePrice: p.salePrice ?? undefined,
                  imageUrl: firstImage,
                  categorySlug: slug,
                  isCustomizable: p.isCustomizable ?? undefined,
                };
                return <ProductCard key={p.id} product={productProps} />;
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20 text-center bg-brand/5 rounded-[2.5rem] border border-brand/10 px-8"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <SlidersHorizontal className="text-[#C5A059]" size={24} />
            </div>
            <h2 className="text-xl font-playfair font-bold text-brand mb-2">No Matching Products</h2>
            <p className="text-brand/60 max-w-sm mx-auto text-sm mb-6">
              We couldn't find any products matching your active filters. Try clearing your filters to see all available items.
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-brand text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-brand-hover shadow-md transition-all duration-300"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
