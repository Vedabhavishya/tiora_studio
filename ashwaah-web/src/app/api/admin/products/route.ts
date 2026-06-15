import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations, orderItems, cartItems, orders } from "@/db/schema";
import { eq, like, or, sql, desc } from "drizzle-orm";

async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

export async function GET(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const id = searchParams.get("id");

    if (id) {
      const product = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
      if (!product.length) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      
      const variations = await db.select().from(productVariations).where(eq(productVariations.productId, parseInt(id))).orderBy(productVariations.id);
      // Map mrp to basePrice for the frontend
      const mappedVariations = variations.map(v => ({
        ...v,
        basePrice: v.mrp
      }));
      return NextResponse.json({ success: true, data: { ...product[0], variations: mappedVariations } });
    }
    
    // Fetch products
    const allProducts = await db.select().from(products).where(
      search ? or(like(products.name, `%${search}%`), like(products.category, `%${search}%`)) : undefined
    ).orderBy(desc(products.id));
    
    // Fetch all variations for stock calculation
    const allVariations = await db.select().from(productVariations);

    // Fetch all order items and their associated order status
    const allOrderItems = await db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        status: orders.status,
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id));

    // Process data to calculate metrics
    const results = allProducts.map((product: any) => {
      const productOrderItems = allOrderItems.filter(item => item.productId === product.id);
      const productVariationsList = allVariations.filter(v => v.productId === product.id);

      const sold = productOrderItems
        .filter(item => item.status && item.status.toLowerCase() === "delivered")
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      const toDeliver = productOrderItems
        .filter(item => 
          item.status && 
          ["pending", "confirmed", "processing", "shipped", "on the way", "out for delivery"].includes(item.status.toLowerCase())
        )
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      const initialStock = productVariationsList?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
      const totalStock = Math.max(0, initialStock - sold - toDeliver);

      return {
        ...product,
        totalStock
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      name, description, salePrice, images, variations,
      avgRating, numReviews, category, gender, colors, tags, isFeatured, 
      isCustomizable, enabledMeasurements
    } = body;

    // Validation
    if (!name) return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    
    // Pricing is now handled per variation. 
    // We will calculate a "base price" for the main product entry from the minimum variation price.
    const basePriceValue = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.basePrice) || 0)) : 0;
    const baseSalePrice = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.salePrice) || 0)) : 0;

    // 1 & 2. Insert Product and Variations in a Transaction
    const newProduct = await db.transaction(async (tx) => {
      const productResult = await tx.insert(products).values({
        name,
        description: description || null,
        basePrice: basePriceValue,
        salePrice: baseSalePrice,
        images: JSON.stringify(images || []),
        colors: JSON.stringify(colors || []),
        avgRating: !isNaN(parseFloat(avgRating)) ? parseFloat(avgRating) : 4.3,
        numReviews: !isNaN(parseInt(numReviews)) ? parseInt(numReviews) : 1,
        category: category || null,
        gender: (gender as "men" | "women" | "unisex") || "unisex",
        tags: tags || null,
        isFeatured: !!isFeatured,
        isCustomizable: !!isCustomizable,
        enabledMeasurements: enabledMeasurements || null,
      }).returning();

      if (!productResult || productResult.length === 0) {
        throw new Error("Database failed to return the new product ID.");
      }

      const insertedProduct = productResult[0];

      if (variations && variations.length > 0) {
        const variationValues = variations.map((v: any) => ({
          productId: insertedProduct.id,
          size: v.size,
          color: v.color || "Default",
          stock: parseInt(v.stock) || 0,
          mrp: Number(v.basePrice) || 0,
          salePrice: Number(v.salePrice) || 0,
          sku: v.sku || `${insertedProduct.id}-${v.size}${v.color && v.color !== "Default" ? `-${v.color}` : ""}`
        }));
        await tx.insert(productVariations).values(variationValues);
      }
      return insertedProduct;
    });

    return NextResponse.json({ success: true, data: newProduct });

  } catch (error: any) {
    console.error("CRITICAL ERROR in POST /api/admin/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create product",
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      id, name, description, salePrice, images, variations,
      avgRating, numReviews, category, gender, colors, tags, isFeatured, 
      isCustomizable, enabledMeasurements
    } = body;

    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    // Pricing from variations
    let basePriceValue: number | undefined;
    let baseSalePrice: number | undefined;
    if (variations) {
      basePriceValue = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.basePrice) || 0)) : 0;
      baseSalePrice = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.salePrice) || 0)) : 0;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (variations) {
      updateData.basePrice = basePriceValue;
      updateData.salePrice = baseSalePrice;
    }
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (colors !== undefined) updateData.colors = JSON.stringify(colors);
    if (avgRating !== undefined) updateData.avgRating = !isNaN(parseFloat(avgRating)) ? parseFloat(avgRating) : undefined;
    if (numReviews !== undefined) updateData.numReviews = !isNaN(parseInt(numReviews)) ? parseInt(numReviews) : undefined;
    if (category !== undefined) updateData.category = category;
    if (gender !== undefined) updateData.gender = gender;
    if (tags !== undefined) updateData.tags = tags;
    if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured;
    if (isCustomizable !== undefined) updateData.isCustomizable = !!isCustomizable;
    if (enabledMeasurements !== undefined) updateData.enabledMeasurements = enabledMeasurements;

    // 1 & 2. Update Product and Variations in a Transaction
    await db.transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.update(products).set(updateData).where(eq(products.id, id));
      }

      if (variations) {
        await tx.delete(productVariations).where(eq(productVariations.productId, id));
        if (variations.length > 0) {
          const variationValues = variations.map((v: any) => ({
            productId: id,
            size: v.size,
            color: v.color || "Default",
            stock: parseInt(v.stock) || 0,
            mrp: Number(v.basePrice) || 0,
            salePrice: Number(v.salePrice) || 0,
            sku: v.sku || `${id}-${v.size}${v.color && v.color !== "Default" ? `-${v.color}` : ""}`
          }));
          await tx.insert(productVariations).values(variationValues);
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("CRITICAL ERROR in PATCH /api/admin/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update product",
      details: error.message 
    }, { status: 500 });
  }
}



export async function DELETE(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    // 1. Fetch all order items for this product along with their order status
    const relatedOrderItems = await db
      .select({ id: orderItems.id, status: orders.status })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.productId, id))
      .all();

    // 2. Block deletion only if there are ACTIVE (non-completed) orders
    const activeStatuses = ["pending", "confirmed", "processing", "shipped", "on the way", "out for delivery"];
    const hasActiveOrders = relatedOrderItems.some(
      (item) => item.status && activeStatuses.includes(item.status.toLowerCase())
    );

    if (hasActiveOrders) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete: this product has active pending/shipped orders. Wait for them to complete first." 
      }, { status: 400 });
    }

    // 3. Perform deletion in a transaction
    await db.transaction(async (tx) => {
      // Nullify productId in completed order items to preserve order history
      if (relatedOrderItems.length > 0) {
        await tx.update(orderItems).set({ productId: null }).where(eq(orderItems.productId, id));
      }
      // Delete variations
      await tx.delete(productVariations).where(eq(productVariations.productId, id));
      // Remove from any active carts
      await tx.delete(cartItems).where(eq(cartItems.productId, id));
      // Finally delete the product itself
      await tx.delete(products).where(eq(products.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete product",
      details: error.message 
    }, { status: 500 });
  }
}

