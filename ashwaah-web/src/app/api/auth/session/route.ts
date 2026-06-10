import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVerifiedPhoneFromCookie } from "@/db/auth-helper";

export async function GET() {
  try {
    const phoneNumber = await getVerifiedPhoneFromCookie("auth_session");

    if (!phoneNumber) {
      return NextResponse.json({ authenticated: false });
    }

    const userResult = await db.select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      const response = NextResponse.json({ authenticated: false });
      const cookieStore = await cookies();
      cookieStore.delete("auth_session");
      return response;
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
      } 
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
