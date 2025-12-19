import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({
      user: id,
      deletedAt: null,
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        postsCount,
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;

    const body = await req.json();
    const { active, ...otherFields } = body;

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    Object.assign(updateData, otherFields);

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user", error: error.message },
      { status: 500 }
    );
  }
}

