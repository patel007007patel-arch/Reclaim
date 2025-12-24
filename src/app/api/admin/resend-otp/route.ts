import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import OTP from "@/models/OTP";
import { sendOTPEmail } from "@/lib/email";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "If the email exists, an OTP has been sent.",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase(), type: "admin" });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      type: "admin",
      expiresAt,
      verified: false,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, "admin");

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP has been resent to your email",
    });
  } catch (error: any) {
    console.error("RESEND OTP ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

