import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { verifyJWT } from "@/lib/verify";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const admin = await Admin.findById(decoded.id).select("-password").lean();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: (admin as any).name || admin.email.split("@")[0], // Use name if exists, else email prefix
      },
    });
  } catch (error: any) {
    console.error("Get admin error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin", error: error.message },
      { status: 500 }
    );
  }
}

