import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyUser } from "@/lib/auth-helpers";

/**
 * Register OneSignal Player ID for a user
 * This endpoint should be called from the mobile app when OneSignal initializes
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, message: "playerId is required" },
        { status: 400 }
      );
    }

    // Update user with OneSignal player ID
    await User.findByIdAndUpdate(user._id, {
      onesignalPlayerId: playerId,
    });

    return NextResponse.json({
      success: true,
      message: "OneSignal player ID registered successfully",
    });
  } catch (error: any) {
    console.error("OneSignal registration error:", error);
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

