import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import Affirmation from "@/models/Affirmation";
import WeeklyLecture from "@/models/WeeklyLecture";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    // Active users count
    const activeUsersCount = await User.countDocuments({ active: true });

    // Total users count
    const totalUsers = await User.countDocuments({});

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Total posts
    const totalPosts = await Post.countDocuments({ deletedAt: null });

    // Pending posts
    const pendingPosts = await Post.countDocuments({
      status: "pending",
      deletedAt: null,
    });

    // Flagged posts
    const flaggedPosts = await Post.countDocuments({
      flagged: true,
      deletedAt: null,
    });

    // Recent community posts (last 7 days, approved)
    const recentPosts = await Post.countDocuments({
      status: "approved",
      createdAt: { $gte: sevenDaysAgo },
      deletedAt: null,
    });

    // Upcoming scheduled content (affirmations + weekly lectures)
    const now = new Date();
    const upcomingAffirmations = await Affirmation.countDocuments({
      scheduledFor: { $gte: now },
      archived: false,
    });
    const upcomingLectures = await WeeklyLecture.countDocuments({
      weekOf: { $gte: now },
      archived: false,
      published: false,
    });
    const upcomingContent = upcomingAffirmations + upcomingLectures;

    return NextResponse.json({
      success: true,
      stats: {
        activeUsers: activeUsersCount,
        totalUsers,
        recentSignups,
        totalPosts,
        pendingPosts,
        flaggedPosts,
        recentPosts,
        upcomingContent,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats", error: error.message },
      { status: 500 }
    );
  }
}

