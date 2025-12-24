import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OnboardingQuestion from "@/models/OnboardingQuestion";
import { verifyAdmin } from "@/lib/auth-helpers";

// POST: reorder questions by providing array of ids in desired order
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
        OnboardingQuestion.findByIdAndUpdate(id, { order: index + 1 }).exec()
      )
    );

    return NextResponse.json(
      { success: true, message: "Order updated" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ONBOARDING REORDER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


