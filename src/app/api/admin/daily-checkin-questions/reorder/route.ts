import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";
import { verifyAdmin } from "@/lib/auth-helpers";

// POST: reorder daily check-in questions
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.order)) {
      return NextResponse.json(
        {
          success: false,
          message: "order must be an array of question ids",
        },
        { status: 400 }
      );
    }

    const { order } = body as { order: string[] };

    await Promise.all(
      order.map((id, index) =>
        DailyCheckinQuestion.findByIdAndUpdate(id, { order: index + 1 }).exec()
      )
    );

    return NextResponse.json(
      { success: true, message: "Order updated" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DAILY REORDER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


