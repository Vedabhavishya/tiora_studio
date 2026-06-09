import { db } from "@/db";
import { navigationMenu, pageSections, products, homepageCategories } from "@/db/schema";
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

  if (menuResult.length > 0) {
    categoryName = menuResult[0].label;
    isFromNav = true;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-playfair font-bold text-brand mb-4 tracking-tight">{categoryName}</h1>
        <div className="w-24 h-1 bg-[#C5A059] mx-auto rounded-full mb-4"></div>
        <p className="text-brand/70 max-w-2xl mx-auto font-inter leading-relaxed">
          Explore our curated selection of premium {categoryName.toLowerCase()} pieces, 
          each designed with meticulous attention to detail and crafted for an impeccable fit.
        </p>
      </div>
      
      {/* Rendering sections and fallback products via interactive CategoryFilterSection component */}
      <CategoryFilterSection
        initialSections={sectionsWithProducts}
        initialDisplayProducts={displayProducts}
        categoryName={categoryName}
        slug={slug}
      />
    </div>
  );
}
