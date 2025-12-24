import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WeeklyAffirmation from "@/models/WeeklyAffirmation";

// Public/app: get this week's weekly affirmation
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Find weekly affirmation scheduled for this week or get a random active one
    let affirmation = await WeeklyAffirmation.findOne({
      active: true,
      archived: false,
      $or: [
        { scheduledFor: { $gte: startOfWeek, $lt: endOfWeek } },
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
    console.error("WEEKLY AFFIRMATION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
