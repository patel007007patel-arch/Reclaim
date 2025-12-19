import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Affirmation from "@/models/Affirmation";
import { verifyAdmin } from "@/lib/auth-helpers";

// GET: list affirmations (latest first)
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
    const archived = searchParams.get("archived");

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { text: { $regex: search, $options: "i" } },
      ];
    }
    if (archived !== null && archived !== "") {
      query.archived = archived === "true";
    }

    const total = await Affirmation.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const items = await Affirmation.find(query)
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
    console.error("AFFIRMATION LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create affirmation
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

    const { title, text, reflectionPrompt, scheduledFor, archived } = body;
    if (!text) {
      return NextResponse.json(
        { success: false, message: "text is required" },
        { status: 400 }
      );
    }

    const item = await Affirmation.create({
      title,
      text,
      reflectionPrompt,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      archived: !!archived,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("AFFIRMATION CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


