import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";

// Public/app: get active daily check-in questions in order
export async function GET() {
  try {
    await connectDB();
    const questions = await DailyCheckinQuestion.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, questions }, { status: 200 });
  } catch (error: any) {
    console.error("APP DAILY LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


