import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";

export async function GET() {
  try {
    const phoneNumber = await getVerifiedPhoneFromCookie("auth_session");

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Find user
    const userRows = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const user = userRows[0];

    const userOrders = await db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      discountAmount: orders.discountAmount,
      couponCode: orders.couponCode,
      status: orders.status,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

    // For each order, fetch items
    const ordersWithItems = await Promise.all(userOrders.map(async (order) => {
      const items = await db.select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: products.name,
        productImage: products.images,
        quantity: orderItems.quantity,
        price: orderItems.price,
        size: orderItems.size,
        color: orderItems.color,
        customizations: orderItems.customizations,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        items: items.map(item => {
          let imageUrl = "/placeholder-product.png";
          try {
            if (item.productImage) {
              const parsed = typeof item.productImage === 'string' ? JSON.parse(item.productImage) : item.productImage;
              if (Array.isArray(parsed)) {
                if (parsed.length > 0) imageUrl = parsed[0];
              } else if (parsed && typeof parsed === 'object') {
                const keys = Object.keys(parsed);
                for (const key of keys) {
                  if (parsed[key] && parsed[key].length > 0) {
                    imageUrl = parsed[key][0];
                    break;
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error parsing product images for item:", item.id, e);
          }
          
          return {
            ...item,
            productImage: imageUrl,
            customizations: item.customizations ? JSON.parse(item.customizations) : null
          };
        })
      };
    }));

    return NextResponse.json({ success: true, data: ordersWithItems });
  } catch (error: any) {
    console.error("User Orders API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
