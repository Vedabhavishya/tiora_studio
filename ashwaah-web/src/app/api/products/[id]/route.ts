import { db } from "@/db";
import { products, productVariations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!productRows.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variations = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.productId, productId))
      .orderBy(productVariations.id);

    return NextResponse.json({
      ...productRows[0],
      variations,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
