import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { homepageCategories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

// GET all homepage category cards (publicly accessible)
export async function GET(request: Request) {
  try {
    const data = await db
      .select()
      .from(homepageCategories)
      .orderBy(asc(homepageCategories.order));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Fetch Homepage Categories Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homepage categories" },
      { status: 500 }
    );
  }
}

// POST a new homepage category card
export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, imageUrl, promoText, actionText, link, order, filterTypes } = body;

    if (!name || !imageUrl || !promoText) {
      return NextResponse.json(
        { success: false, error: "Name, Image URL, and Promo Text are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(homepageCategories)
      .values({
        name,
        imageUrl,
        promoText,
        actionText: actionText || "Shop Now",
        link: link || null,
        order: order || 0,
        filterTypes: filterTypes || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error("Create Homepage Category Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create category card" },
      { status: 500 }
    );
  }
}

// PUT (update) a homepage category card or bulk reorder
export async function PUT(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk update (reordering)
      for (const item of body) {
        await db
          .update(homepageCategories)
          .set({ order: item.order })
          .where(eq(homepageCategories.id, item.id));
      }
      return NextResponse.json({ success: true });
    } else {
      const { id, name, imageUrl, promoText, actionText, link, order, filterTypes } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "Category Card ID is required" },
          { status: 400 }
        );
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      if (promoText !== undefined) updates.promoText = promoText;
      if (actionText !== undefined) updates.actionText = actionText;
      if (link !== undefined) updates.link = link || null;
      if (order !== undefined) updates.order = order;
      if (filterTypes !== undefined) updates.filterTypes = filterTypes || null;

      const result = await db
        .update(homepageCategories)
        .set(updates)
        .where(eq(homepageCategories.id, id))
        .returning();

      if (result.length > 0) {
        return NextResponse.json({ success: true, data: result[0] });
      }
      return NextResponse.json(
        { success: false, error: "Category Card not found" },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Update Homepage Category Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category card" },
      { status: 500 }
    );
  }
}

// DELETE a homepage category card
export async function DELETE(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category Card ID is required" },
        { status: 400 }
      );
    }

    await db.delete(homepageCategories).where(eq(homepageCategories.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Homepage Category Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete category card" },
      { status: 500 }
    );
  }
}
