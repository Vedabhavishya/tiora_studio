import { NextResponse } from "next/server";
import { db } from "@/db";
import { navigationMenu, pageSections } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === "9999999999";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    
    if (showAll && !await isAdmin()) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    
    let query = db.select().from(navigationMenu);
    
    if (!showAll) {
      // @ts-ignore
      query = query.where(eq(navigationMenu.isActive, true));
    }
    
    const items = await query.orderBy(asc(navigationMenu.order));
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Fetch Nav Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch navigation", devDetails: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await db.insert(navigationMenu).values({
      label: body.label,
      href: body.href,
      imageUrl: body.imageUrl,
      order: body.order || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }).returning();
    
    const newItem = result[0];

    // Create default section for the new menu item
    await db.insert(pageSections).values({
      menuId: newItem.id,
      title: "Featured Carousel",
      productIds: "",
      displayOrder: 0,
    });
    
    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create menu item" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk update (reordering)
      for (const item of body) {
        await db.update(navigationMenu)
          .set({ order: item.order })
          .where(eq(navigationMenu.id, item.id));
      }
      return NextResponse.json({ success: true });
    } else {
      const { id, ...updates } = body;
      const result = await db.update(navigationMenu)
        .set(updates)
        .where(eq(navigationMenu.id, id))
        .returning();

      if (result.length > 0) {
        return NextResponse.json({ success: true, data: result[0] });
      }
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update menu item" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    
    await db.delete(navigationMenu).where(eq(navigationMenu.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete menu item" }, { status: 400 });
  }
}


