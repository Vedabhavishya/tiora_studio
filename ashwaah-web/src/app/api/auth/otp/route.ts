import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, otpVerifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Auth Request ${requestId}] Received OTP request`);

  try {
    const body = await request.json();
    const { action, phone, otp, portal } = body;

    console.log(`[Auth Request ${requestId}] Action: ${action}, Phone: ${phone}`);

    if (!phone) {
      return NextResponse.json({ success: false, error: "Please enter a valid phone number" }, { status: 400 });
    }

    // Action 1: Send OTP
    if (action === "send") {
      console.log(`[Auth Request ${requestId}] MOCK Sending OTP to ${phone}`);
      
      // Always use 123456 for everyone during development
      const generatedOtp = "123456";
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clear existing OTPs for this number
      await db.delete(otpVerifications).where(eq(otpVerifications.phoneNumber, phone));

      // Insert new OTP
      await db.insert(otpVerifications).values({
        phoneNumber: phone,
        otp: generatedOtp,
        expiresAt: expiresAt.toISOString(),
      });

      console.log(`[DEVELOPMENT MOCK] OTP for ${phone} is ${generatedOtp}`);

      return NextResponse.json({ success: true, message: "OTP sent successfully (Dev Mode: 123456)" });
    }

    // Action 2: Verify OTP
    if (action === "verify") {
      console.log(`[Auth Request ${requestId}] Verifying OTP for ${phone}`);
      
      // Allow 123456 for any number, or check DB
      const isDevOtp = otp === "123456";
      
      let validRecord = false;
      if (isDevOtp) {
        validRecord = true;
      } else {
        const otpRecords = await db.select()
          .from(otpVerifications)
          .where(
            and(
              eq(otpVerifications.phoneNumber, phone),
              eq(otpVerifications.otp, otp)
            )
          );
        validRecord = otpRecords.some(record => new Date(record.expiresAt) > new Date());
      }

      if (!validRecord) {
        return NextResponse.json({ success: false, error: "Invalid or expired OTP. Please try again." }, { status: 400 });
      }

      // Delete the OTP as it's been used
      await db.delete(otpVerifications).where(eq(otpVerifications.phoneNumber, phone));

      let user = null;
      let isNewUser = false;
      const adminPhone = "9999999999";

      try {
        console.log(`[Auth Request ${requestId}] Querying database for phone: ${phone}`);
        const userResult = await db.select()
          .from(users)
          .where(eq(users.phoneNumber, phone))
          .limit(1);
        
        user = userResult[0];

        if (!user) {
          console.log(`[Auth Request ${requestId}] User not found, creating new entry`);
          // Register new user automatically if not found
          await db.insert(users).values({
            phoneNumber: phone,
            role: phone === adminPhone ? "admin" : "user",
            lastLoginAt: new Date().toISOString(),
          });
          isNewUser = true;
          console.log(`[Auth Request ${requestId}] New user created`);
        } else {
          // Update lastLoginAt
          await db.update(users)
            .set({ 
              lastLoginAt: new Date().toISOString(),
              ...(phone === adminPhone && user.role !== "admin" ? { role: "admin" } : {})
            })
            .where(eq(users.phoneNumber, phone));
          
          if (!user.fullName) {
            console.log(`[Auth Request ${requestId}] User exists but profile incomplete`);
            isNewUser = true;
          } else {
            console.log(`[Auth Request ${requestId}] Existing user found: ${user.fullName}`);
          }
        }
      } catch (dbError: any) {

        console.error(`[Auth Request ${requestId}] Database Error:`, dbError.message);
        
        // Handle ECONNREFUSED specifically
        if (dbError.code === 'ECONNREFUSED' || dbError.message.includes('ECONNREFUSED')) {
          return NextResponse.json({ 
            success: false, 
            error: "Database Connection Refused. Please ensure your MySQL server is running on localhost:3306." 
          }, { status: 503 });
        }

        // Handle Table Not Found
        if (dbError.code === 'ER_NO_SUCH_TABLE') {
          return NextResponse.json({ 
            success: false, 
            error: "Database tables are missing. Please run the migration or setup the users table." 
          }, { status: 500 });
        }

        throw dbError; // Rethrow to be caught by outer catch
      }

      // Session Persistence: Set a secure cookie
      try {
        const cookieStore = await cookies();
        const cookieName = portal === "admin" ? "admin_session" : "auth_session";
        const isSecure = request.url.startsWith("https");

        cookieStore.set(cookieName, phone, {
          httpOnly: true,
          secure: isSecure,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
        console.log(`[Auth Request ${requestId}] ${cookieName} set for ${phone} (Secure: ${isSecure})`);
      } catch (cookieError) {
        console.error(`[Auth Request ${requestId}] Cookie Error:`, cookieError);
      }

      return NextResponse.json({ 
        success: true, 
        isNewUser, 
        message: isNewUser ? "Welcome! Please tell us your name." : "Welcome back!" 
      });
    }

    return NextResponse.json({ success: false, error: "Invalid request action" }, { status: 400 });

  } catch (error: any) {
    console.error(`[Auth Request ${requestId}] Critical Server Error:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: "A critical server error occurred. Please check server logs for details.",
      devDetails: error?.cause?.message || error?.message || String(error),
      debugConnection: process.env.DATABASE_URL ? "USING_DATABASE_URL" : (process.env.DATABASE_URI ? "USING_DATABASE_URI" : "FALLBACK_SQLITE_DB"),
      debugUrlPreview: process.env.DATABASE_URI?.substring(0, 15) || process.env.DATABASE_URL?.substring(0, 15)
    }, { status: 500 });
  }
}



