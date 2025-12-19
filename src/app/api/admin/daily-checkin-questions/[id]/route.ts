import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";
import { verifyAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH: update daily check-in question
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

    const question = await DailyCheckinQuestion.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, question },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DAILY UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: delete daily check-in question
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;

    const question = await DailyCheckinQuestion.findByIdAndDelete(id);
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Question deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DAILY DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


