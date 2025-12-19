import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import { verifyAdmin } from "@/lib/auth-helpers";

// GET: list community/public posts (for moderation)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const published = searchParams.get("published");
    const flagged = searchParams.get("flagged");

    // Build query
    const query: any = { deletedAt: null };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (published !== null && published !== "") {
      query.published = published === "true";
    }
    if (flagged !== null && flagged !== "") {
      query.flagged = flagged === "true";
    }

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const items = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      success: true, 
      posts: items,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("POST LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: (optional) create post on behalf of a user from admin
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { userId, title, content, imageUrl, status, visibility } = body;
    if (!userId || !title || !content) {
      return NextResponse.json(
        { success: false, message: "userId, title and content are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const item = await Post.create({
      user: user._id,
      title,
      content,
      imageUrl,
      status: status || "approved",
      visibility: visibility || "public",
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("POST CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


