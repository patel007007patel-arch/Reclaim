import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const target = searchParams.get("target");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (target) query.target = target;

    // Build search query for MongoDB
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("userIds", "name email")
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
    console.error("NOTIFICATION LIST ERROR:", error);
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

    const { title, message, target, userIds, scheduledFor, status } = body;
    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "title and message are required" },
        { status: 400 }
      );
    }

    const item = await Notification.create({
      title,
      message,
      target: target || "all",
      userIds: userIds || [],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: status || "draft",
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("NOTIFICATION CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


