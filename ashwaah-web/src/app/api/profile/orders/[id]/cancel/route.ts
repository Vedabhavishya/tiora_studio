import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phoneNumber = await getVerifiedPhoneFromCookie("auth_session");

  if (!phoneNumber) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    // Find user using plain select (no relational API needed)
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const user = userRows[0];
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch the order (must belong to this user)
    const orderRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);

    if (!orderRows.length) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];

    // Only allow cancellation if order is still pending
    if (order.status !== "pending") {
      return NextResponse.json({
        success: false,
        error: `Cannot cancel an order with status '${order.status}'.`,
      }, { status: 400 });
    }

    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)));

    return NextResponse.json({ success: true, message: "Order cancelled successfully" });
  } catch (error: any) {
    console.error("Order Cancellation API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
