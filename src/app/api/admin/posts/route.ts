import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import { verifyAdminOrUser, verifyAdmin } from "@/lib/auth-helpers";

// GET: list community/public posts (for moderation)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin or user authentication
    const { error } = await verifyAdminOrUser(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const published = searchParams.get("published");
    const flagged = searchParams.get("flagged");
    
    // Pagination handling
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 20; // Default to 20 if not provided
    const skip = (page - 1) * limit;

    // Build query - only show non-deleted posts
    // In MongoDB, { deletedAt: null } matches both null and non-existent fields
    const query: any = { 
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };
    
    // Add search filter - combine with $and to properly merge conditions
    const conditions: any[] = [{ $or: query.$or }];
    
    if (search) {
      conditions.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ]
      });
    }
    
    // Build final query
    const finalQuery: any = conditions.length > 1 ? { $and: conditions } : query;
    
    // Add other filters directly (MongoDB will AND them)
    if (status && status !== "") {
      finalQuery.status = status;
    }
    if (published !== null && published !== "" && published !== undefined) {
      finalQuery.published = published === "true";
    }
    if (flagged !== null && flagged !== "" && flagged !== undefined) {
      finalQuery.flagged = flagged === "true";
    }
    
    // Use finalQuery for the actual database query
    const dbQuery = finalQuery;

    const total = await Post.countDocuments(dbQuery);
    
    let queryBuilder = Post.find(dbQuery)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("flags", "name email");
    
    // Always apply pagination (with default limit of 20)
    queryBuilder = queryBuilder.skip(skip).limit(limit);
    
    const items = await queryBuilder.lean();
    
    // Calculate flagCount for each post if not already set
    const itemsWithFlagCount = items.map((item: any) => ({
      ...item,
      flagCount: item.flagCount !== undefined ? item.flagCount : (item.flags?.length || 0),
      archived: item.archived !== undefined ? item.archived : false,
    }));

    const response: any = {
      success: true,
      posts: itemsWithFlagCount,
      total: total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };

    return NextResponse.json(response, { status: 200 });
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


