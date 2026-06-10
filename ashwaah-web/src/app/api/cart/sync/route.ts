import { NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";

export async function POST(request: Request) {
  try {
    const phone = await getVerifiedPhoneFromCookie("auth_session");

    if (!phone) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await db.select().from(users).where(eq(users.phoneNumber, phone)).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { items } = await request.json();

    // Simple sync logic: replace DB cart with local cart or merge.
    // For now, let's just clear and replace to keep it simple as a first step.
    await db.delete(cartItems).where(eq(cartItems.userId, user.id));

    if (items && items.length > 0) {
      const dbItems = items.map((item: any) => ({
        userId: user.id,
        productId: item.productId,
        baseSize: item.size,
        customSpecifications: item.customizations,
        itemHash: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      await db.insert(cartItems).values(dbItems);
    }

    return NextResponse.json({ success: true, message: "Cart synced successfully" });
  } catch (error: any) {
    console.error("Cart Sync Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync cart" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const phone = await getVerifiedPhoneFromCookie("auth_session");

    if (!phone) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await db.select().from(users).where(eq(users.phoneNumber, phone)).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const dbCart = await db.select().from(cartItems).where(eq(cartItems.userId, user.id));

    return NextResponse.json({ success: true, items: dbCart });
  } catch (error: any) {
    console.error("Cart Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch cart" }, { status: 500 });
  }
}
