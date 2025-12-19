import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
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

    const data = { ...body } as any;
    if (data.scheduledFor) {
      data.scheduledFor = new Date(data.scheduledFor);
    }
    if (data.target === "all") {
      data.userIds = [];
    }

    const item = await Notification.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("userIds", "name email");
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error: any) {
    console.error("NOTIFICATION UPDATE ERROR:", error);
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
    const item = await Notification.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("NOTIFICATION DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


