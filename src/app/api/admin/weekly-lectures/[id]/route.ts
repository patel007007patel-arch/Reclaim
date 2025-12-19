import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WeeklyLecture from "@/models/WeeklyLecture";
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
    if (data.weekOf) {
      data.weekOf = new Date(data.weekOf);
    }

    const item = await WeeklyLecture.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Weekly lecture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error: any) {
    console.error("LECTURE UPDATE ERROR:", error);
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
    const item = await WeeklyLecture.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Weekly lecture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Weekly lecture deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("LECTURE DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


