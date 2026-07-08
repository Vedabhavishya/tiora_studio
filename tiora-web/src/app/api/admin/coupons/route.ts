import { NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminAuthenticated } from "@/db/auth-helper";

async function checkAdmin(req: Request) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function GET(req: Request) {
  try {
    await checkAdmin(req);
    const allCoupons = await db.select().from(coupons).orderBy(coupons.createdAt);
    return NextResponse.json({ success: true, data: allCoupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    await checkAdmin(req);
    const body = await req.json();
    
    // Validate required fields
    if (!body.code || !body.type || body.value === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [newCoupon] = await db.insert(coupons).values({
      code: body.code.toUpperCase(),
      description: body.description || null,
      type: body.type,
      value: Number(body.value),
      minOrderValue: Number(body.minOrderValue) || 0,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      isFirstOrderOnly: body.isFirstOrderOnly || false,
      applicableCategories: body.applicableCategories || null,
      applicableProducts: body.applicableProducts || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ success: true, data: newCoupon });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ success: false, error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await checkAdmin(req);
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Coupon ID required" }, { status: 400 });
    }

    const [updatedCoupon] = await db.update(coupons).set({
      code: body.code ? body.code.toUpperCase() : undefined,
      description: body.description !== undefined ? body.description : undefined,
      type: body.type,
      value: body.value !== undefined ? Number(body.value) : undefined,
      minOrderValue: body.minOrderValue !== undefined ? Number(body.minOrderValue) : undefined,
      maxDiscount: body.maxDiscount !== undefined ? (body.maxDiscount ? Number(body.maxDiscount) : null) : undefined,
      isFirstOrderOnly: body.isFirstOrderOnly,
      applicableCategories: body.applicableCategories !== undefined ? body.applicableCategories || null : undefined,
      applicableProducts: body.applicableProducts !== undefined ? body.applicableProducts || null : undefined,
      isActive: body.isActive,
      updatedAt: new Date().toISOString(),
    }).where(eq(coupons.id, body.id)).returning();

    return NextResponse.json({ success: true, data: updatedCoupon });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ success: false, error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await checkAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Coupon ID required" }, { status: 400 });
    }

    await db.delete(coupons).where(eq(coupons.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}
