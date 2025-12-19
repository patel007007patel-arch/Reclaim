import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const now = new Date();
    const last12Months = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
      });
    }

    // Get user signups per month
    const userSignupsData = await Promise.all(
      last12Months.map(async (month) => {
        const count = await User.countDocuments({
          createdAt: {
            $gte: month.startDate,
            $lte: month.endDate,
          },
        });
        return count;
      })
    );

    // Get posts per month
    const postsData = await Promise.all(
      last12Months.map(async (month) => {
        const count = await Post.countDocuments({
          createdAt: {
            $gte: month.startDate,
            $lte: month.endDate,
          },
          deletedAt: null,
        });
        return count;
      })
    );

    // Get approved posts per month
    const approvedPostsData = await Promise.all(
      last12Months.map(async (month) => {
        const count = await Post.countDocuments({
          createdAt: {
            $gte: month.startDate,
            $lte: month.endDate,
          },
          status: "approved",
          deletedAt: null,
        });
        return count;
      })
    );

    // Get last 7 days data for daily chart
    const last7Days = [];
    const dailyUserSignups = [];
    const dailyPosts = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      last7Days.push(
        date.toLocaleDateString("en-US", { weekday: "short" })
      );

      const userCount = await User.countDocuments({
        createdAt: {
          $gte: date,
          $lte: endDate,
        },
      });
      dailyUserSignups.push(userCount);

      const postCount = await Post.countDocuments({
        createdAt: {
          $gte: date,
          $lte: endDate,
        },
        deletedAt: null,
      });
      dailyPosts.push(postCount);
    }

    return NextResponse.json({
      success: true,
      monthly: {
        categories: last12Months.map((m) => m.month),
        userSignups: userSignupsData,
        posts: postsData,
        approvedPosts: approvedPostsData,
      },
      daily: {
        categories: last7Days,
        userSignups: dailyUserSignups,
        posts: dailyPosts,
      },
    });
  } catch (error: any) {
    console.error("Dashboard charts error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch chart data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

