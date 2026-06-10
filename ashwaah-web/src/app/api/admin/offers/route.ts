import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { offerBanners } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

// GET all offer banners (publicly accessible)
export async function GET(request: Request) {
  try {
    const data = await db.select().from(offerBanners).orderBy(asc(offerBanners.order));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Fetch Offers Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch offers" }, { status: 500 });
  }
}

// POST a new offer banner
export async function POST(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, link, order } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: "Offer text is required" }, { status: 400 });
    }

    const result = await db.insert(offerBanners).values({
      text,
      link: link || null,
      order: order || 0,
    }).returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error("Create Offer Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create offer" }, { status: 500 });
  }
}

// PUT (update) an offer banner or bulk reorder
export async function PUT(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk update (reordering)
      for (const item of body) {
        await db.update(offerBanners)
          .set({ order: item.order })
          .where(eq(offerBanners.id, item.id));
      }
      return NextResponse.json({ success: true });
    } else {
      const { id, text, link, order } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Offer ID is required" }, { status: 400 });
      }

      const updates: any = {};
      if (text !== undefined) updates.text = text;
      if (link !== undefined) updates.link = link || null;
      if (order !== undefined) updates.order = order;

      const result = await db.update(offerBanners)
        .set(updates)
        .where(eq(offerBanners.id, id))
        .returning();

      if (result.length > 0) {
        return NextResponse.json({ success: true, data: result[0] });
      }
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Update Offer Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update offer" }, { status: 500 });
  }
}

// DELETE an offer banner
export async function DELETE(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ success: false, error: "Offer ID is required" }, { status: 400 });
    }

    await db.delete(offerBanners).where(eq(offerBanners.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Offer Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete offer" }, { status: 500 });
  }
}
