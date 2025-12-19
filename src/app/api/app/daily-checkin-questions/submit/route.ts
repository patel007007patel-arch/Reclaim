import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";
import { verifyUser } from "@/lib/auth-helpers";

// POST: submit daily check-in question answers
// Authentication required - Bearer token in Authorization header
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { answers, checkInDate } = body; // Array of { questionId, answer }, optional checkInDate

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, message: "answers must be a non-empty array" },
        { status: 400 }
      );
    }

    // Use provided checkInDate or default to today
    const checkIn = checkInDate ? new Date(checkInDate) : new Date();
    checkIn.setHours(0, 0, 0, 0); // Set to start of day

    // Validate all questions exist and are active
    const questionIds = answers.map((a: any) => a.questionId);
    const questions = await DailyCheckinQuestion.find({
      _id: { $in: questionIds },
      active: true,
    }).lean();

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { success: false, message: "Some questions are invalid or inactive" },
        { status: 400 }
      );
    }

    // Create answer objects (only store questionId, fetch title when needed)
    const answerObjects = answers.map((ans: any) => {
      return {
        questionId: ans.questionId,
        answer: ans.answer,
        answeredAt: new Date(),
        checkInDate: checkIn,
      };
    });

    // Update user's daily check-in answers
    // Remove existing answers for this check-in date and add new ones
    const existingAnswers = user!.dailyCheckinAnswers || [];
    const checkInDateStr = checkIn.toISOString().split("T")[0]; // YYYY-MM-DD

    const updatedAnswers = existingAnswers.filter((ans: any) => {
      const ansDateStr = new Date(ans.checkInDate).toISOString().split("T")[0];
      return ansDateStr !== checkInDateStr;
    });

    // Add new answers
    updatedAnswers.push(...answerObjects);

    // Update user's activity and streak
    const activity = user!.activity || {};
    const lastCheckIn = activity.lastCheckIn
      ? new Date(activity.lastCheckIn)
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = user!.streak || 0;
    if (lastCheckIn) {
      lastCheckIn.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If daysDiff === 0, same day, keep streak
    } else {
      // First check-in
      newStreak = 1;
    }

    await User.findByIdAndUpdate(user!._id, {
      dailyCheckinAnswers: updatedAnswers,
      streak: newStreak,
      activity: {
        ...activity,
        lastCheckIn: new Date(),
        totalCheckIns: (activity.totalCheckIns || 0) + 1,
      },
    });

    // Fetch question titles for response
    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q.title])
    );

    const answersWithTitles = answerObjects.map((ans: any) => ({
      ...ans,
      questionTitle: questionMap.get(ans.questionId) || "Question not found",
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Daily check-in answers submitted successfully",
        answers: answersWithTitles,
        streak: newStreak,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DAILY CHECK-IN SUBMIT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET: get user's daily check-in answers
// Authentication required - Bearer token in Authorization header
// Optional query param: date (YYYY-MM-DD) to get answers for specific date
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let answers = user!.dailyCheckinAnswers || [];

    // Filter by date if provided
    if (dateParam) {
      const filterDate = new Date(dateParam);
      filterDate.setHours(0, 0, 0, 0);
      const filterDateStr = filterDate.toISOString().split("T")[0];

      answers = answers.filter((ans: any) => {
        const ansDateStr = new Date(ans.checkInDate).toISOString().split("T")[0];
        return ansDateStr === filterDateStr;
      });
    }

    // Fetch question titles by questionId
    const questionIds = answers.map((ans: any) => ans.questionId);
    const questions = await DailyCheckinQuestion.find({
      _id: { $in: questionIds },
    })
      .select("_id title")
      .lean();

    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q.title])
    );

    // Populate questionTitle in response
    const answersWithTitles = answers.map((ans: any) => ({
      ...ans,
      questionTitle: questionMap.get(ans.questionId) || "Question not found",
    }));

    return NextResponse.json(
      {
        success: true,
        answers: answersWithTitles,
        streak: user!.streak || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET DAILY CHECK-IN ANSWERS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

