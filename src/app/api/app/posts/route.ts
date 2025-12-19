import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { verifyUser } from "@/lib/auth-helpers";

// GET: public community feed (approved, not deleted)
// No authentication required - public endpoint
export async function GET() {
  try {
    await connectDB();
    const items = await Post.find({
      status: "approved",
      visibility: "public",
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, items }, { status: 200 });
  } catch (error: any) {
    console.error("APP POST LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create post for logged-in user
// Authentication required - Bearer token in Authorization header
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { title, content, imageUrl, visibility } = body;
    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "title and content are required" },
        { status: 400 }
      );
    }

    const item = await Post.create({
      user: user!._id,
      title,
      content,
      imageUrl,
      visibility: visibility || "public",
      status: "pending", // admin must approve
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("APP POST CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


