import { NextResponse } from "next/server";
import { db } from "@/db";
import { coupons, users, orders, products } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";

export async function POST(req: Request) {
  try {
    const { code, items } = await req.json();

    if (!code || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 });
    }

    // 1. Fetch Coupon
    const couponRows = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
    if (!couponRows.length) {
      return NextResponse.json({ success: false, error: "Invalid coupon code" }, { status: 400 });
    }
    const coupon = couponRows[0];

    if (!coupon.isActive) {
      return NextResponse.json({ success: false, error: "This coupon is no longer active" }, { status: 400 });
    }

    // 2. Fetch all products in cart to check categories and calculate eligible total
    const productIds = items.map(item => item.productId);
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Check applicable categories and products
    let applicableCategoryList: string[] = [];
    if (coupon.applicableCategories) {
      applicableCategoryList = coupon.applicableCategories.split(',').map(c => c.trim().toUpperCase());
    }
    
    let applicableProductList: string[] = [];
    if (coupon.applicableProducts) {
      applicableProductList = coupon.applicableProducts.split(',').map(p => p.trim());
    }

    let eligibleTotal = 0;
    let cartTotal = 0;

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      const itemTotal = Number(item.price) * Number(item.quantity);
      cartTotal += itemTotal;

      if (dbProduct) {
        let isEligible = false;
        
        if (applicableCategoryList.length > 0) {
          const prodCategory = dbProduct.category ? dbProduct.category.toUpperCase() : "";
          if (applicableCategoryList.includes(prodCategory)) {
            isEligible = true;
          }
        } else if (applicableProductList.length > 0) {
          if (applicableProductList.includes(dbProduct.id.toString())) {
            isEligible = true;
          }
        } else {
          isEligible = true; // No restrictions
        }
        
        if (isEligible) {
          eligibleTotal += itemTotal;
        }
      }
    }

    if (applicableCategoryList.length > 0 && eligibleTotal === 0) {
      return NextResponse.json({ success: false, error: `This coupon is only valid for: ${coupon.applicableCategories}` }, { status: 400 });
    }
    if (applicableProductList.length > 0 && eligibleTotal === 0) {
      return NextResponse.json({ success: false, error: `This coupon is only valid for specific products.` }, { status: 400 });
    }

    // 3. Check Minimum Order Value
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return NextResponse.json({ success: false, error: `Minimum order value of ₹${coupon.minOrderValue} required` }, { status: 400 });
    }

    // 4. Check First Order Only
    if (coupon.isFirstOrderOnly) {
      const phoneNumber = await getVerifiedPhoneFromCookie("auth_session");
      if (!phoneNumber) {
        return NextResponse.json({ success: false, error: "Please log in to use this coupon" }, { status: 401 });
      }

      const userRows = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
      if (!userRows.length) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      
      const userOrders = await db.select().from(orders).where(eq(orders.userId, userRows[0].id));
      // Only count actual placed orders (ignoring anything cancelled or failed if tracked, but for now just length > 0)
      if (userOrders.length > 0) {
        return NextResponse.json({ success: false, error: "This coupon is only valid for your first order" }, { status: 400 });
      }
    }

    // 5. Calculate Discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (eligibleTotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else { // FLAT
      discountAmount = coupon.value;
      // Flat discounts can't exceed the eligible total
      if (discountAmount > eligibleTotal) {
        discountAmount = eligibleTotal;
      }
    }

    return NextResponse.json({
      success: true,
      discountAmount,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    });

  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
