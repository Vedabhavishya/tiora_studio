import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations } from "@/db/schema";
import { like, or, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim() === "") {
      return NextResponse.json({ success: true, data: [] });
    }

    const searchQuery = `%${q.trim()}%`;

    const results = await db.select().from(products).where(
      or(
        like(products.name, searchQuery),
        like(products.category, searchQuery),
        like(products.gender, searchQuery),
        like(products.tags, searchQuery),
        like(products.description, searchQuery)
      )
    ).limit(50); // Increased limit slightly to ensure a rich list of results for filtering

    const productIds = results.map((r) => r.id);
    let variations: any[] = [];
    if (productIds.length > 0) {
      variations = await db.select()
        .from(productVariations)
        .where(inArray(productVariations.productId, productIds));
    }

    // Group sizes by product ID
    const sizeMap = new Map<number, string[]>();
    variations.forEach((v) => {
      if (!v.productId || !v.size) return;
      const currentSizes = sizeMap.get(v.productId) || [];
      const normalizedSize = v.size.trim();
      if (normalizedSize && !currentSizes.includes(normalizedSize)) {
        currentSizes.push(normalizedSize);
      }
      sizeMap.set(v.productId, currentSizes);
    });

    const enrichedResults = results.map((p) => ({
      ...p,
      sizes: sizeMap.get(p.id) || [],
    }));

    return NextResponse.json({ success: true, data: enrichedResults });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search products" },
      { status: 500 }
    );
  }
}
