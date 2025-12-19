import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MediaItem from "@/models/MediaItem";
import { verifyAdmin } from "@/lib/auth-helpers";

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
    const type = searchParams.get("type") || "";
    const tag = searchParams.get("tag") || "";

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
    const totalPages = Math.ceil(total / limit);

    const items = await MediaItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      items,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      }
    }, { status: 200 });
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


