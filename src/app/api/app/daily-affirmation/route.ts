import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyAffirmation from "@/models/DailyAffirmation";

// Public/app: get today's daily affirmation
export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find daily affirmation scheduled for today or get a random active one
    let affirmation = await DailyAffirmation.findOne({
      active: true,
      archived: false,
      $or: [
        { scheduledFor: { $gte: today, $lt: tomorrow } },
        { scheduledFor: null },
      ],
    })
      .sort({ scheduledFor: -1, createdAt: -1 })
      .lean();

    if (!affirmation) {
      return NextResponse.json(
        { success: false, message: "No affirmation available" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, affirmation }, { status: 200 });
  } catch (error: any) {
    console.error("DAILY AFFIRMATION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
