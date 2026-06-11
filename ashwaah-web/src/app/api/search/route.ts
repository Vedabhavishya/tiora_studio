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

    // Clean and split the query into search tokens
    const cleanQuery = q.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    const tokens = cleanQuery
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Expand tokens to support simple singular/plural matching
    const expandedTokensSet = new Set<string>();
    tokens.forEach((t) => {
      expandedTokensSet.add(t);
      if (t.endsWith("s") && t.length > 2) {
        if (t.endsWith("es") && t.length > 3) {
          expandedTokensSet.add(t.slice(0, -2));
        } else {
          expandedTokensSet.add(t.slice(0, -1));
        }
      }
    });
    const expandedTokens = Array.from(expandedTokensSet);

    // Fetch candidate products matching any of the expanded tokens
    const results = await db.select().from(products).where(
      or(
        ...expandedTokens.flatMap((t) => [
          like(products.name, `%${t}%`),
          like(products.description, `%${t}%`),
          like(products.category, `%${t}%`),
          like(products.gender, `%${t}%`),
          like(products.tags, `%${t}%`),
          like(products.colors, `%${t}%`)
        ])
      )
    ).limit(100);

    // Score and rank matched products based on original query tokens
    const scoredResults = results.map((p) => {
      let score = 0;
      const name = (p.name || "").toLowerCase();
      const description = (p.description || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const gender = (p.gender || "").toLowerCase();
      const tags = (p.tags || "").toLowerCase();
      const colors = (p.colors || "").toLowerCase();

      tokens.forEach((origToken) => {
        const variants = [origToken];
        if (origToken.endsWith("s") && origToken.length > 2) {
          if (origToken.endsWith("es") && origToken.length > 3) {
            variants.push(origToken.slice(0, -2));
          } else {
            variants.push(origToken.slice(0, -1));
          }
        }

        const matchesAnyVariant = variants.some((v) => 
          name.includes(v) ||
          description.includes(v) ||
          category.includes(v) ||
          gender.includes(v) ||
          tags.includes(v) ||
          colors.includes(v)
        );

        if (matchesAnyVariant) {
          score += 1;
          // Add extra weight if matched in name or tags
          const matchesName = variants.some(v => name.includes(v));
          const matchesTags = variants.some(v => tags.includes(v));
          if (matchesName) score += 0.5;
          if (matchesTags) score += 0.3;
        }
      });

      return { product: p, score };
    });

    // Sort products by score descending
    const sortedResults = scoredResults
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    const productIds = sortedResults.map((r) => r.id);
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

    const enrichedResults = sortedResults.map((p) => ({
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
