import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WeeklyLecture from "@/models/WeeklyLecture";
import { verifyAdmin } from "@/lib/auth-helpers";

// GET: list weekly lectures (latest week first)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const published = searchParams.get("published");
    const archived = searchParams.get("archived");
    
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
        { affirmationText: { $regex: search, $options: "i" } },
        { reflectionText: { $regex: search, $options: "i" } },
      ];
    }
    if (published !== null && published !== "") {
      query.published = published === "true";
    }
    if (archived !== null && archived !== "") {
      query.archived = archived === "true";
    }

    const total = await WeeklyLecture.countDocuments(query);
    
    let queryBuilder = WeeklyLecture.find(query)
      .sort({ weekOf: -1 });
    
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
    console.error("LECTURE LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create weekly lecture
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

    const {
      title,
      imageUrl,
      affirmationText,
      reflectionText,
      weekOf,
      published,
      archived,
    } = body;

    if (!title || !affirmationText || !reflectionText || !weekOf) {
      return NextResponse.json(
        {
          success: false,
          message: "title, affirmationText, reflectionText and weekOf are required",
        },
        { status: 400 }
      );
    }

    const item = await WeeklyLecture.create({
      title,
      imageUrl,
      affirmationText,
      reflectionText,
      weekOf: new Date(weekOf),
      published: !!published,
      archived: !!archived,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("LECTURE CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


