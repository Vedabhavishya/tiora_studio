import { db } from "@/db";
import { navigationMenu, pageSections, products, homepageCategories, productVariations } from "@/db/schema";
import { eq, inArray, asc, or } from "drizzle-orm";
import CategoryFilterSection from "@/components/CategoryFilterSection";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  
  // 1. Find the category item (first check navigation menu)
  const href = `/category/${slug}`;
  const menuResult = await db.select()
    .from(navigationMenu)
    .where(eq(navigationMenu.href, href))
    .limit(1);

  let categoryName = "";
  let isFromNav = false;
  let filterTypes: string | null = null;

  if (menuResult.length > 0) {
    categoryName = menuResult[0].label;
    isFromNav = true;
    filterTypes = menuResult[0].filterTypes;
  } else {
    // Check homepage category grid cards
    const homeCatResult = await db.select()
      .from(homepageCategories)
      .limit(100);
      
    // Find item matching the slug
    const matchingHomeCat = homeCatResult.find(
      (item) => item.name.toLowerCase().trim().replace(/\s+/g, "-") === slug || item.link === href
    );

    if (matchingHomeCat) {
      categoryName = matchingHomeCat.name;
      filterTypes = matchingHomeCat.filterTypes;
    }
  }

  // 2. If not found in either, show Not Found
  if (!categoryName) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-playfair font-bold text-brand mb-4">Category Not Found</h1>
        <Link href="/" className="text-[#C5A059] font-bold uppercase tracking-widest text-xs hover:underline">Return Home</Link>
      </div>
    );
  }

  // 3. Fetch sections for this category (if it is a navigation item)
  let sectionsWithProducts: any[] = [];
  if (isFromNav && menuResult.length > 0) {
    const sections = await db.select()
      .from(pageSections)
      .where(eq(pageSections.menuId, menuResult[0].id))
      .orderBy(asc(pageSections.displayOrder));

    sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const productIds = section.productIds
          .split(",")
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));

        let hydratedProducts: any[] = [];
        if (productIds.length > 0) {
          hydratedProducts = await db.select()
            .from(products)
            .where(inArray(products.id, productIds));
        }

        return {
          ...section,
          products: hydratedProducts
        };
      })
    );
  }

  // 4. If no custom sections exist, dynamically query all products matching this category name
  let displayProducts: any[] = [];
  if (sectionsWithProducts.length === 0) {
    const categorySlug = categoryName.toLowerCase().trim().replace(/\s+/g, "-");
    displayProducts = await db.select()
      .from(products)
      .where(
        or(
          eq(products.category, categoryName),
          eq(products.category, slug),
          eq(products.category, categorySlug)
        )
      );
  }

  // 5. Query sizes (variations) for all products in this category
  const allProductIds = [
    ...displayProducts.map((p) => p.id),
    ...sectionsWithProducts.flatMap((s) => (s.products || []).map((p: any) => p.id)),
  ];

  let allVariations: any[] = [];
  if (allProductIds.length > 0) {
    allVariations = await db.select()
      .from(productVariations)
      .where(inArray(productVariations.productId, allProductIds));
  }

  // Group sizes by product ID
  const sizeMap = new Map<number, string[]>();
  allVariations.forEach((v) => {
    if (!v.productId || !v.size) return;
    const currentSizes = sizeMap.get(v.productId) || [];
    const normalizedSize = v.size.trim();
    if (normalizedSize && !currentSizes.includes(normalizedSize)) {
      currentSizes.push(normalizedSize);
    }
    sizeMap.set(v.productId, currentSizes);
  });

  // Attach sizes to displayProducts
  displayProducts = displayProducts.map((p) => ({
    ...p,
    sizes: sizeMap.get(p.id) || [],
  }));

  // Attach sizes to sectionsWithProducts
  sectionsWithProducts = sectionsWithProducts.map((s) => ({
    ...s,
    products: (s.products || []).map((p: any) => ({
      ...p,
      sizes: sizeMap.get(p.id) || [],
    })),
  }));

  return (
    <div className="w-full bg-brand-light min-h-[calc(100vh-64px)] flex flex-col">
      {/* Rendering sections and fallback products via interactive CategoryFilterSection component */}
      <CategoryFilterSection
        initialSections={sectionsWithProducts}
        initialDisplayProducts={displayProducts}
        categoryName={categoryName}
        slug={slug}
        filterTypes={filterTypes}
      />
    </div>
  );
}
