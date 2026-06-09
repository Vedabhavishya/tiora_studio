"use client";

import React, { useState, useMemo } from "react";
import { SlidersHorizontal, ChevronDown, Check, X, LayoutGrid } from "lucide-react";
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
  tags?: string | null;
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
  filterTypes?: string | null;
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

export default function CategoryFilterSection({
  initialSections,
  initialDisplayProducts,
  categoryName,
  slug,
  filterTypes,
}: CategoryFilterSectionProps) {
  // 1. Flatten and deduplicate all products for filtering
  const allProducts = useMemo(() => {
    const map = new Map<string, Product>();

    initialDisplayProducts.forEach((p) => {
      map.set(String(p.id), p);
    });

    initialSections.forEach((section) => {
      (section.products || []).forEach((p) => {
        map.set(String(p.id), p);
      });
    });

    return Array.from(map.values());
  }, [initialSections, initialDisplayProducts]);

  // Parse admin configured filter types
  const adminFilterTypes = useMemo(() => {
    if (!filterTypes) return null;
    return filterTypes
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [filterTypes]);

  // Helper to check if a product matches a type, with special handling for T-Shirt vs Shirt
  const isTypeMatch = (type: string, name: string, category: string, tags: string) => {
    const lowerType = type.toLowerCase();
    const lowerName = name.toLowerCase();
    const lowerCategory = category.toLowerCase();
    const lowerTags = tags.toLowerCase();

    // Special handling: "T-Shirt" (or T-Shirts / Tshirt) covers Sweatshirts, Hoodies, Polos, Tees, and T-Shirts
    if (
      lowerType === "t-shirt" ||
      lowerType === "t-shirts" ||
      lowerType === "timages" ||
      lowerType === "tshirts" ||
      lowerType === "tshirt"
    ) {
      if (
        lowerName.includes("sweatshirt") ||
        lowerName.includes("hoodie") ||
        lowerName.includes("t-shirt") ||
        lowerName.includes("tshirt") ||
        lowerName.includes("polo") ||
        lowerName.includes("tee")
      ) {
        return true;
      }
    }

    // Special handling: "Shirt" should NOT match "Sweatshirt"
    if (lowerType === "shirt" || lowerType === "shirts") {
      if (lowerName.includes("sweatshirt")) {
        return false;
      }
    }

    return (
      lowerCategory.includes(lowerType) ||
      lowerTags.includes(lowerType) ||
      lowerName.includes(lowerType)
    );
  };

  // Helper for default type classification
  const classifyTypeFallback = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    const lowerCategory = category.toLowerCase();

    if (
      lowerName.includes("sweatshirt") ||
      lowerName.includes("hoodie") ||
      lowerName.includes("t-shirt") ||
      lowerName.includes("tshirt") ||
      lowerName.includes("polo") ||
      lowerName.includes("tee")
    ) {
      return "T-Shirt";
    } else if (lowerName.includes("shirt")) {
      return "Shirt";
    } else if (
      lowerCategory.includes("ethnic") ||
      lowerName.includes("kurta") ||
      lowerName.includes("kurti") ||
      lowerName.includes("lehenga") ||
      lowerName.includes("saree") ||
      lowerName.includes("sharara") ||
      lowerName.includes("anarkali")
    ) {
      return "Ethnic Wear";
    } else if (
      lowerCategory.includes("suitings") ||
      lowerCategory.includes("work wear") ||
      lowerCategory.includes("office wear") ||
      lowerCategory.includes("corporate") ||
      lowerName.includes("blazer") ||
      lowerName.includes("suit") ||
      lowerName.includes("formal")
    ) {
      return "Workwear";
    } else if (lowerName.includes("dress") || lowerName.includes("gown") || lowerName.includes("bodycon") || lowerCategory.includes("dresses")) {
      return "Dresses";
    } else if (lowerName.includes("jogger") || lowerName.includes("pants") || lowerName.includes("cargo") || lowerName.includes("trousers")) {
      return "Pants & Joggers";
    }
    return category || "Other";
  };

  // 2. Classify product types dynamically
  const productsWithTypes = useMemo(() => {
    return allProducts.map((p) => {
      let type = "Other";
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const tags = (p.tags || "").toLowerCase();

      if (adminFilterTypes && adminFilterTypes.length > 0) {
        // Sort types by length descending to match most specific first
        const sortedAdminTypes = [...adminFilterTypes].sort((a, b) => b.length - a.length);
        const matchedType = sortedAdminTypes.find((t) => isTypeMatch(t, name, category, tags));
        type = matchedType || "Other";
      } else {
        type = classifyTypeFallback(name, category);
      }

      return { ...p, classifiedType: type };
    });
  }, [allProducts, adminFilterTypes]);

  // 3. Extract unique types and colors dynamically
  const availableTypes = useMemo(() => {
    if (adminFilterTypes && adminFilterTypes.length > 0) {
      const hasOther = productsWithTypes.some((p) => p.classifiedType === "Other");
      return hasOther ? [...adminFilterTypes, "Other"] : adminFilterTypes;
    }
    const typesSet = new Set<string>();
    productsWithTypes.forEach((p) => {
      if (p.classifiedType) typesSet.add(p.classifiedType);
    });
    return Array.from(typesSet).sort();
  }, [productsWithTypes, adminFilterTypes]);

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

  // 4. State Management (Multi-select arrays)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const isFilterOrSortActive = selectedTypes.length > 0 || selectedColors.length > 0 || sortBy !== "default";

  // 5. Calculate counts dynamically based on the current collection
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    productsWithTypes.forEach((p) => {
      const type = p.classifiedType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [productsWithTypes]);

  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    productsWithTypes.forEach((p) => {
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
  }, [productsWithTypes]);

  // 6. Filtering and Sorting logic
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...productsWithTypes];

    // Filter by selected types (OR logic: show products matching any selected type)
    if (selectedTypes.length > 0) {
      list = list.filter((p) => selectedTypes.includes(p.classifiedType));
    }

    // Filter by selected colors (OR logic: show products matching any selected color)
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
  }, [productsWithTypes, selectedTypes, selectedColors, sortBy]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedColors([]);
    setSortBy("default");
  };

  return (
    <div className="flex flex-col lg:flex-row w-full items-stretch relative z-30">
      
      {/* Mobile Show Filters Toggle Button */}
      <div className="lg:hidden w-full mb-2">
        <button
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full flex items-center justify-between bg-white border border-brand/10 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-brand shadow-sm active:scale-99 transition-all"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#C5A059]" />
            {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </span>
          <span className="text-[#C5A059] font-black">
            {isFilterOrSortActive ? `(${selectedTypes.length + selectedColors.length} Active)` : ""}
          </span>
        </button>
      </div>

      {/* Left Column: Filter Sidebar Panel */}
      <aside
        className={`w-full lg:w-72 flex-shrink-0 bg-[#FFFDF6] border-r border-brand/10 p-6 lg:p-8 rounded-none lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:overflow-y-auto custom-scrollbar lg:block ${
          isMobileFiltersOpen ? "block" : "hidden"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand/5 mb-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-brand">Filters</h2>
          {isFilterOrSortActive && (
            <button
              onClick={handleClearFilters}
              className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Section 1: Categories / Types */}
        {availableTypes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/40 mb-3 ml-1">Categories</h3>
            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {availableTypes.map((type) => {
                const count = typeCounts[type] || 0;
                const isChecked = selectedTypes.includes(type);

                return (
                  <label
                    key={type}
                    className="flex items-center gap-3 text-xs font-bold text-brand/75 cursor-pointer hover:text-brand transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTypeToggle(type)}
                      className="rounded border-brand/20 accent-brand w-4 h-4 cursor-pointer"
                    />
                    <span className="flex-1">{type}</span>
                    <span className="text-brand/35 text-[10px] font-medium">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Colors */}
        {availableColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/40 mb-3 ml-1">Color</h3>
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
                    className="flex items-center gap-3 text-xs font-bold text-brand/75 cursor-pointer hover:text-brand transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleColorToggle(color)}
                      className="rounded border-brand/20 accent-brand w-4 h-4 cursor-pointer"
                    />
                    {/* Circle Swatch */}
                    <span
                      className={`w-3.5 h-3.5 rounded-full inline-block border shadow-sm flex-shrink-0 ${
                        isWhite ? "border-brand/20" : "border-transparent"
                      }`}
                      style={{ backgroundColor: hexCode }}
                    />
                    <span className="flex-1">{color}</span>
                    <span className="text-brand/35 text-[10px] font-medium">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Sort By */}
        <div className="pt-4 border-t border-brand/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/40 mb-3 ml-1">Sort Products</h3>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-brand/5 border border-brand/10 hover:border-brand-accent/50 text-brand text-xs font-bold uppercase tracking-widest py-3 pl-4 pr-10 rounded-2xl outline-none appearance-none cursor-pointer transition-all shadow-sm"
            >
              <option value="default" className="text-brand bg-[#FFFDF6]">Default</option>
              <option value="price-asc" className="text-brand bg-[#FFFDF6]">Price: Low to High</option>
              <option value="price-desc" className="text-brand bg-[#FFFDF6]">Price: High to Low</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/50 pointer-events-none" />
          </div>
        </div>
      </aside>

      {/* Right Column: Products Content Area */}
      <div className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-7xl mx-auto">
        {/* Header Title & Description */}
        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-brand mb-3 tracking-tight">{categoryName}</h1>
          <div className="w-20 h-1 bg-[#C5A059] lg:mx-0 mx-auto rounded-full mb-3"></div>
          <p className="text-brand/70 max-w-2xl lg:mx-0 mx-auto font-inter leading-relaxed text-sm">
            Explore our curated selection of premium {categoryName.toLowerCase()} pieces, 
            each designed with meticulous attention to detail and crafted for an impeccable fit.
          </p>
        </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
                {filteredAndSortedProducts.map((p) => {
                  let firstImage = "/images/placeholder.png";
                  try {
                    const parsedImages = JSON.parse(p.images || "[]");
                    if (Array.isArray(parsedImages) && parsedImages.length > 0) {
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
    </div>
  );
}
