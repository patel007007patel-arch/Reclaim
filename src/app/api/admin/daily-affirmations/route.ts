import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyAffirmation from "@/models/DailyAffirmation";
import { verifyAdminOrUser, verifyAdmin } from "@/lib/auth-helpers";

// GET: list daily affirmations
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin or user authentication
    const { error } = await verifyAdminOrUser(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
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
        { text: { $regex: search, $options: "i" } },
      ];
    }
    if (active !== null && active !== "") {
      query.active = active === "true";
    }
    if (archived !== null && archived !== "") {
      query.archived = archived === "true";
    }

    const total = await DailyAffirmation.countDocuments(query);
    
    let queryBuilder = DailyAffirmation.find(query)
      .sort({ createdAt: -1 });
    
    if (usePagination) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }
    
    const affirmations = await queryBuilder.lean();

    const response: any = {
      success: true,
      affirmations,
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
    console.error("DAILY AFFIRMATIONS LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create new daily affirmation
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

    const { title, text, reflectionPrompt, scheduledFor, active, archived } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, message: "text is required" },
        { status: 400 }
      );
    }

    const affirmation = await DailyAffirmation.create({
      title,
      text,
      reflectionPrompt,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      active: typeof active === "boolean" ? active : true,
      archived: typeof archived === "boolean" ? archived : false,
    });

    // Reload to ensure all fields are populated
    const savedAffirmation = await DailyAffirmation.findById(affirmation._id).lean();

    return NextResponse.json(
      { success: true, affirmation: savedAffirmation },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("DAILY AFFIRMATION CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
