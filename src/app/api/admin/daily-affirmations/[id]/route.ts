import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyAffirmation from "@/models/DailyAffirmation";
import { verifyAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH: update daily affirmation
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

    const affirmation = await DailyAffirmation.findByIdAndUpdate(
      id,
      body,
      { new: true }
    ).lean();

    if (!affirmation) {
      return NextResponse.json(
        { success: false, message: "Affirmation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, affirmation }, { status: 200 });
  } catch (error: any) {
    console.error("DAILY AFFIRMATION UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: delete daily affirmation
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const { id } = await params;

    const affirmation = await DailyAffirmation.findByIdAndDelete(id);

    if (!affirmation) {
      return NextResponse.json(
        { success: false, message: "Affirmation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Affirmation deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DAILY AFFIRMATION DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
