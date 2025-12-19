import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { verifyJWT } from "@/lib/verify";

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { name } = body;

    const admin = await Admin.findByIdAndUpdate(
      decoded.id,
      { $set: { name } },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        name: (admin as any).name || admin.email.split("@")[0],
      },
    });
  } catch (error: any) {
    console.error("Update admin profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

