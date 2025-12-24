import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MediaItem from "@/models/MediaItem";
import { verifyAdminOrUser, verifyAdmin } from "@/lib/auth-helpers";

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
    const type = searchParams.get("type") || "";
    const tag = searchParams.get("tag") || "";
    
    // Pagination is optional - if not provided, return all data
    const usePagination = pageParam !== null && limitParam !== null;
    const page = usePagination ? parseInt(pageParam || "1") : 1;
    const limit = usePagination ? parseInt(limitParam || "20") : 0;
    const skip = usePagination ? (page - 1) * limit : 0;

    // Build query
    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (type) {
      query.type = type;
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }

    const total = await MediaItem.countDocuments(query);
    
    let queryBuilder = MediaItem.find(query)
      .sort({ createdAt: -1 });
    
    if (usePagination) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }
    
    const items = await queryBuilder.lean();
    
    const response: any = {
      success: true,
      items,
    };
    
    if (usePagination) {
      response.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };
    }
    
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("MEDIA LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

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

    const { title, type, url, thumbnailUrl, durationSeconds, tags } = body;
    if (!title || !type || !url) {
      return NextResponse.json(
        { success: false, message: "title, type and url are required" },
        { status: 400 }
      );
    }

    const item = await MediaItem.create({
      title,
      type,
      url,
      thumbnailUrl,
      durationSeconds,
      tags: tags || [],
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("MEDIA CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


