import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { verifyAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH: moderation update (approve, hide, flag, etc.)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const item = await Post.findByIdAndUpdate(id, body, {
      new: true,
    })
      .populate("user", "name email")
      .populate("flags", "name email")
      .lean();
    
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // Ensure flagCount is calculated
    const itemWithFlagCount = {
      ...item,
      flagCount: (item as any).flagCount || ((item as any).flags?.length || 0),
    };

    return NextResponse.json({ success: true, item: itemWithFlagCount }, { status: 200 });
  } catch (error: any) {
    console.error("POST UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: soft delete
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;
    const item = await Post.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Post deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


