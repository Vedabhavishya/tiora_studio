import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { adminAuth } from "@/db/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone: rawPhone, idToken } = body;
    const adminPhone = "9999999999";

    let phone = rawPhone;
    let verifiedToken = idToken;

    if (idToken) {
      // 1. Firebase Token Verification
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const firebasePhone = decoded.phone_number;
        if (!firebasePhone) {
          return NextResponse.json(
            { success: false, error: "Phone number missing in verified token" },
            { status: 400 }
          );
        }
        // Normalize the verified phone number by stripping country code (+91)
        phone = firebasePhone.replace(/^\+91/, "").replace(/\D/g, "");
      } catch (err: any) {
        console.error("Firebase ID Token verification failed during sync:", err.message);
        return NextResponse.json(
          { success: false, error: "Invalid or expired session token" },
          { status: 401 }
        );
      }
    } else {
      // 2. Local Mock Fallback for testing/development
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "Invalid parameters" },
          { status: 400 }
        );
      }
      // For local testing, use the plaintext phone directly as the token
      verifiedToken = phone;
    }

    let user = null;
    let isNewUser = false;

    const userResult = await db.select()
      .from(users)
      .where(eq(users.phoneNumber, phone))
      .limit(1);
    
    user = userResult[0];

    if (!user) {
      // Register new user automatically if not found
      await db.insert(users).values({
        phoneNumber: phone,
        role: phone === adminPhone ? "admin" : "user",
        lastLoginAt: new Date().toISOString(),
      });
      isNewUser = true;
    } else {
      // Update lastLoginAt and upgrade role to admin if matching admin number
      await db.update(users)
        .set({ 
          lastLoginAt: new Date().toISOString(),
          ...(phone === adminPhone && user.role !== "admin" ? { role: "admin" } : {})
        })
        .where(eq(users.phoneNumber, phone));
      
      if (!user.fullName) {
        isNewUser = true;
      }
    }

    const cookieName = phone === adminPhone ? "admin_session" : "auth_session";
    const response = NextResponse.json({ 
      success: true, 
      isNewUser, 
      message: isNewUser ? "Welcome! Please tell us your name." : "Welcome back!" 
    });

    response.cookies.set(cookieName, verifiedToken, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error(`Sync API Error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: "A server error occurred during sync." 
    }, { status: 500 });
  }
}
