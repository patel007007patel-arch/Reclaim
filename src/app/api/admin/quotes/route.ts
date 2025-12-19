import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quote from "@/models/Quote";
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
    const active = searchParams.get("active");
    const author = searchParams.get("author") || "";
    const tag = searchParams.get("tag") || "";

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }
    if (active !== null && active !== "") {
      query.active = active === "true";
    }
    if (author) {
      query.author = { $regex: author, $options: "i" };
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }

    const total = await Quote.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const items = await Quote.find(query)
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
    console.error("QUOTE LIST ERROR:", error);
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

    const { text, author, tags, active } = body;
    if (!text) {
      return NextResponse.json(
        { success: false, message: "text is required" },
        { status: 400 }
      );
    }

    const item = await Quote.create({
      text,
      author,
      tags: tags || [],
      active: typeof active === "boolean" ? active : true,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("QUOTE CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


