import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MediaItem from "@/models/MediaItem";
import { verifyAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

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

    const item = await MediaItem.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Media item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error: any) {
    console.error("MEDIA UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;
    const item = await MediaItem.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Media item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Media item deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("MEDIA DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


