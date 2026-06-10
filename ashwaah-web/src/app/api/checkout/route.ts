import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { items, totalAmount, paymentMethod, shippingAddress } = await req.json();
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

    // Append new address to user's saved addresses
    if (shippingAddress) {
      let addresses: string[] = [];
      if (user.address) {
        try {
          addresses = JSON.parse(user.address);
          if (!Array.isArray(addresses)) addresses = [user.address];
        } catch {
          addresses = [user.address];
        }
      }
      if (!addresses.includes(shippingAddress)) {
        addresses.push(shippingAddress);
        await db.update(users)
          .set({ address: JSON.stringify(addresses) })
          .where(eq(users.id, user.id));
      }
    }

    // Create Order
    const [newOrder] = await db.insert(orders).values({
      userId: user.id,
      totalAmount: totalAmount,
      status: "pending", // Initial status after payment
      shippingAddress: shippingAddress,
      createdAt: new Date().toISOString(),
    }).returning();

    // Create Order Items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        customizations: JSON.stringify(item.customizations),
      });
    }

    return NextResponse.json({ success: true, orderId: newOrder.id });
  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
