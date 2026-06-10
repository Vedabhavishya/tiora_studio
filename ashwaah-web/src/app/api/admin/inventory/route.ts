import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations, orderItems, orders } from "@/db/schema";
import { eq, sql, ne, and, inArray } from "drizzle-orm";

async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

export async function GET(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Fetch all products
    const allProducts = await db.select().from(products);
    
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
    const inventoryData = allProducts.map((product: any) => {
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

      const totalStock = productVariationsList?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
      const remaining = totalStock - sold - toDeliver;

      return {
        id: product.id,
        name: product.name,
        category: product.category || "Uncategorized",
        basePrice: product.basePrice,
        sold,
        remaining: Math.max(0, remaining),
        toBeDelivered: toDeliver,
        image: product.images ? JSON.parse(product.images)[0] : null,
      };
    });

    // Group by category
    const groupedData = inventoryData.reduce((acc: any, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: groupedData });
  } catch (error: any) {
    console.error("Inventory API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
