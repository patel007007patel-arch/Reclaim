import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Resource from "@/models/Resource";
import { verifyAdminOrUser, verifyAdmin } from "@/lib/auth-helpers";

// GET: list all resources
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin or user authentication
    const { error } = await verifyAdminOrUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") as "journey" | "motivation" | "lesson" | null;
    const active = searchParams.get("active");
    const archived = searchParams.get("archived");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    // Pagination is optional - if not provided, return all data
    const usePagination = pageParam !== null && limitParam !== null;
    const page = usePagination ? parseInt(pageParam || "1") : 1;
    const limit = usePagination ? parseInt(limitParam || "20") : 0;
    const skip = usePagination ? (page - 1) * limit : 0;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }
    if (category && ["journey", "motivation", "lesson"].includes(category)) {
      query.category = category;
    }
    if (active !== null && active !== "") {
      query.active = active === "true";
    }
    if (archived !== null && archived !== "") {
      query.archived = archived === "true";
    }

    const total = await Resource.countDocuments(query);
    
    let queryBuilder = Resource.find(query)
      .sort({ category: 1, order: 1, createdAt: -1 });
    
    if (usePagination) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }
    
    const resources = await queryBuilder.lean();

    const response: any = {
      success: true,
      resources,
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
    console.error("RESOURCES LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create new resource
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

    const { title, description, content, category, imageUrl, videoUrl, order, active, archived } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, message: "title, content, and category are required" },
        { status: 400 }
      );
    }

    if (!["journey", "motivation", "lesson"].includes(category)) {
      return NextResponse.json(
        { success: false, message: "category must be journey, motivation, or lesson" },
        { status: 400 }
      );
    }

    // If order is not provided, set it to the end (max order + 1) for this category
    let finalOrder = typeof order === "number" ? order : undefined;
    if (finalOrder === undefined) {
      const maxOrderResource = await Resource.findOne({ category })
        .sort({ order: -1 })
        .select("order")
        .lean();
      finalOrder = maxOrderResource && typeof maxOrderResource.order === "number" 
        ? maxOrderResource.order + 1 
        : 0;
    }

    const resource = await Resource.create({
      title,
      description,
      content,
      category,
      imageUrl,
      videoUrl,
      order: finalOrder,
      active: typeof active === "boolean" ? active : true,
      archived: typeof archived === "boolean" ? archived : false,
    });

    return NextResponse.json(
      { success: true, resource },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("RESOURCE CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

