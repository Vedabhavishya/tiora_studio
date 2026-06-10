import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, orders } from "@/db/schema";
import { count, sql } from "drizzle-orm";

async function isAuthenticated(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

export async function GET(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const userCountResult = await db.select({ value: count() }).from(users).where(sql`${users.createdAt} >= ${startOfMonth}`);
    const productCountResult = await db.select({ value: count() }).from(products);
    const orderCountResult = await db.select({ value: count() }).from(orders).where(sql`${orders.createdAt} >= ${startOfMonth}`);
    
    const revenueResult = await db.select({ 
      value: sql<number>`SUM(${orders.totalAmount})`.mapWith(Number) 
    }).from(orders).where(sql`${orders.createdAt} >= ${startOfMonth}`);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: userCountResult[0].value,
        totalProducts: productCountResult[0].value, // Keep total products
        totalOrders: orderCountResult[0].value,
        totalRevenue: revenueResult[0].value || 0,
      }
    });
  } catch (error) {
    console.error("Stats Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
