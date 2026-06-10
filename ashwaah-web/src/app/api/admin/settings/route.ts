import { verifyAdminRequest } from "@/utils/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}

// GET setting(s)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
      if (setting.length > 0) {
        return NextResponse.json({ success: true, data: setting[0] });
      }
      return NextResponse.json({ success: true, data: null });
    }

    const allSettings = await db.select().from(siteSettings);
    return NextResponse.json({ success: true, data: allSettings });
  } catch (error: any) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST/PUT setting
export async function POST(request: Request) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Key and value are required" }, { status: 400 });
    }

    // Check if the setting already exists
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);

    if (existing.length > 0) {
      await db.update(siteSettings)
        .set({ value, updatedAt: new Date().toISOString() })
        .where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({
        key,
        value,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save Setting Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save setting" }, { status: 500 });
  }
}
