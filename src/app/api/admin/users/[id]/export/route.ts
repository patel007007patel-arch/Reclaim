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

    // Get user's posts
    const posts = await Post.find({ user: id, deletedAt: null })
      .select("title content imageUrl status visibility createdAt")
      .lean();

    // Prepare export data
    const exportData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate,
        streak: user.streak || 0,
        activity: user.activity || {},
        onboardingAnswers: user.onboardingAnswers || [],
        dailyCheckinAnswers: user.dailyCheckinAnswers || [],
        deviceSyncStatus: user.deviceSyncStatus || {},
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      posts: posts,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error("Export user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export user data", error: error.message },
      { status: 500 }
    );
  }
}

