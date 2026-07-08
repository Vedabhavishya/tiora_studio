import { NextResponse } from "next/server";
import { db } from "@/db";
import { coupons, users, orders, products } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 });
    }

    // Fetch all active coupons
    let activeCoupons = await db.select().from(coupons).where(eq(coupons.isActive, true));

    // Fetch products in cart
    const productIds = items.map(item => item.productId);
    const dbProducts = productIds.length > 0 ? await db.select().from(products).where(inArray(products.id, productIds)) : [];
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Get user info for first-order check
    const phoneNumber = await getVerifiedPhoneFromCookie("auth_session");
    let hasPreviousOrders = false;
    let isLoggedIn = !!phoneNumber;
    
    if (isLoggedIn && phoneNumber) {
      const userRows = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
      if (userRows.length > 0) {
        const userOrders = await db.select().from(orders).where(eq(orders.userId, userRows[0].id));
        hasPreviousOrders = userOrders.length > 0;
      }
    }

    // Filter out first-order coupons if user has previous orders
    if (hasPreviousOrders) {
      activeCoupons = activeCoupons.filter(coupon => !coupon.isFirstOrderOnly);
    }

    const availableCoupons = activeCoupons.map((coupon) => {
      let isApplicable = true;
      let ineligibilityReason = "";
      
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
          let isItemEligible = false;
          
          if (applicableCategoryList.length > 0) {
            const prodCategory = dbProduct.category ? dbProduct.category.toUpperCase() : "";
            if (applicableCategoryList.includes(prodCategory)) {
              isItemEligible = true;
            }
          } else if (applicableProductList.length > 0) {
            if (applicableProductList.includes(dbProduct.id.toString())) {
              isItemEligible = true;
            }
          } else {
            isItemEligible = true; // No restrictions
          }
          
          if (isItemEligible) {
            eligibleTotal += itemTotal;
          }
        }
      }

      if (applicableCategoryList.length > 0 && eligibleTotal === 0) {
        isApplicable = false;
        ineligibilityReason = `Only valid for: ${coupon.applicableCategories}`;
      } else if (applicableProductList.length > 0 && eligibleTotal === 0) {
        isApplicable = false;
        ineligibilityReason = `Only valid for specific products.`;
      } else if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        isApplicable = false;
        ineligibilityReason = `Add ₹${(coupon.minOrderValue - cartTotal).toFixed(2)} more to unlock`;
      } else if (coupon.isFirstOrderOnly) {
        if (!isLoggedIn) {
          isApplicable = false;
          ineligibilityReason = "Log in to use this first-order coupon";
        } else if (hasPreviousOrders) {
          isApplicable = false;
          ineligibilityReason = "Only valid for your first order";
        }
      }

      // Calculate potential discount
      let discountAmount = 0;
      if (isApplicable) {
        if (coupon.type === "PERCENTAGE") {
          discountAmount = (eligibleTotal * coupon.value) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else { // FLAT
          discountAmount = coupon.value;
          if (discountAmount > eligibleTotal) {
            discountAmount = eligibleTotal;
          }
        }
      }

      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        isFirstOrderOnly: coupon.isFirstOrderOnly,
        isApplicable,
        ineligibilityReason,
        discountAmount
      };
    });

    // Optional: Sort coupons so applicable ones are on top
    availableCoupons.sort((a, b) => {
      if (a.isApplicable && !b.isApplicable) return -1;
      if (!a.isApplicable && b.isApplicable) return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      coupons: availableCoupons
    });

  } catch (error: any) {
    console.error("Available coupons error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
