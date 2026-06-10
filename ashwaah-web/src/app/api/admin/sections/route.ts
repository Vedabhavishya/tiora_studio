import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { pageSections } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

export async function GET(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const menuId = parseInt(searchParams.get("menuId") || "0");
    
    if (!menuId) return NextResponse.json({ success: false, error: "Menu ID required" }, { status: 400 });

    const sections = await db.select()
      .from(pageSections)
      .where(eq(pageSections.menuId, menuId))
      .orderBy(asc(pageSections.displayOrder));
      
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await db.insert(pageSections).values({
      menuId: body.menuId,
      title: body.title || "New Carousel Section",
      productIds: body.productIds || "",
      displayOrder: body.displayOrder || 0,
    }).returning();
    
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create section" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk update (reordering)
      for (const item of body) {
        await db.update(pageSections)
          .set({ displayOrder: item.displayOrder })
          .where(eq(pageSections.id, item.id));
      }
      return NextResponse.json({ success: true });
    } else {
      const { id, ...updates } = body;
      const result = await db.update(pageSections)
        .set(updates)
        .where(eq(pageSections.id, id))
        .returning();
      return NextResponse.json({ success: true, data: result[0] });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update section" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    
    await db.delete(pageSections).where(eq(pageSections.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete section" }, { status: 400 });
  }
}
