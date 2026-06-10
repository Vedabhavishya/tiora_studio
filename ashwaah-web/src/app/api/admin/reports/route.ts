import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, orderItems } from "@/db/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";

async function isAuthenticated(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

export async function GET(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const fetchMonthlyStats = async (start: Date, end: Date) => {
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const [userCount] = await db.select({ value: sql`count(*)` }).from(users).where(and(gte(users.createdAt, startIso), lt(users.createdAt, endIso)));
      const [orderCount] = await db.select({ value: sql`count(*)` }).from(orders).where(and(gte(orders.createdAt, startIso), lt(orders.createdAt, endIso)));
      const [revenue] = await db.select({ value: sql`sum(${orders.totalAmount})` }).from(orders).where(and(gte(orders.createdAt, startIso), lt(orders.createdAt, endIso)));
      
      const [itemsSold] = await db.select({ value: sql`sum(${orderItems.quantity})` })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(gte(orders.createdAt, startIso), lt(orders.createdAt, endIso)));

      return {
        users: Number(userCount?.value || 0),
        orders: Number(orderCount?.value || 0),
        revenue: Number(revenue?.value || 0),
        itemsSold: Number(itemsSold?.value || 0),
        month: start.toLocaleString('default', { month: 'long', year: 'numeric' })
      };
    };

    const currentStats = await fetchMonthlyStats(currentMonthStart, new Date());
    const lastMonthStats = await fetchMonthlyStats(lastMonthStart, lastMonthEnd);

    // Get a small history (last 6 months)
    const history = [];
    for (let i = 0; i < 6; i++) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      history.push(await fetchMonthlyStats(s, e));
    }

    return NextResponse.json({
      success: true,
      current: currentStats,
      lastMonth: lastMonthStats,
      history
    });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
