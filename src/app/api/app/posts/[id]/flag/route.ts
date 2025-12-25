import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { verifyUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// POST: Flag a post (user can flag/unflag)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;
    const { id } = await params;

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    const userId = user!._id.toString();
    const flags = post.flags || [];
    const isFlagged = flags.some((flagId: any) => flagId.toString() === userId);

    // If already flagged by this user, return "already flagged" message
    if (isFlagged) {
      return NextResponse.json({
        success: false,
        message: "Post already flagged by you",
        flagged: true,
        flagCount: flags.length,
      }, { status: 400 });
    }

    // Flag: add user ID to flags array
    const updatedFlags = [...flags, user!._id];

    // Update post with new flags array
    const flagCount = updatedFlags.length;
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        flags: updatedFlags,
        flagCount: flagCount,
        flagged: flagCount > 0,
      },
      { new: true }
    )
      .populate("user", "name email")
      .lean();
    
    // Ensure flagCount is set in the response
    if (updatedPost) {
      (updatedPost as any).flagCount = flagCount;
    }

    return NextResponse.json({
      success: true,
      message: "Post flagged successfully",
      post: updatedPost,
      flagged: true,
      flagCount: updatedFlags.length,
    });
  } catch (error: any) {
    console.error("FLAG POST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// GET: Check if current user has flagged this post
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;
    const { id } = await params;

    const post = await Post.findById(id).lean();
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    const userId = user!._id.toString();
    const flags = (post.flags || []) as any[];
    const isFlagged = flags.some((flagId: any) => flagId.toString() === userId);

    return NextResponse.json({
      success: true,
      flagged: isFlagged,
      flagCount: post.flagCount || flags.length || 0,
    });
  } catch (error: any) {
    console.error("CHECK FLAG ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

