import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error, admin } = await verifyAdmin(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const active = searchParams.get("active");
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
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (active !== null && active !== undefined) {
      query.active = active === "true";
    }

    const total = await User.countDocuments(query);
    
    let queryBuilder = User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    
    if (usePagination) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }
    
    const users = await queryBuilder.lean();

    const response: any = {
      success: true,
      users,
    };
    
    if (usePagination) {
      response.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users", error: error.message },
      { status: 500 }
    );
  }
}

