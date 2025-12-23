import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";
import { verifyAdmin } from "@/lib/auth-helpers";

/**
 * GET: Get all daily check-in submissions from all users
 * Query params:
 * - date: Filter by check-in date (YYYY-MM-DD)
 * - userId: Filter by specific user ID
 * - questionId: Filter by specific question ID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const userIdParam = searchParams.get("userId");
    const questionIdParam = searchParams.get("questionId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build query for users
    const userQuery: any = { active: true };
    if (userIdParam) {
      userQuery._id = userIdParam;
    }

    // Get all users with their check-in answers
    const users = await User.find(userQuery)
      .select("_id name email dailyCheckinAnswers")
      .lean();

    // Flatten all submissions with user info
    let allSubmissions: any[] = [];

    for (const user of users) {
      const answers = user.dailyCheckinAnswers || [];

      for (const answer of answers) {
        // Apply filters
        if (dateParam) {
          const filterDate = new Date(dateParam);
          filterDate.setHours(0, 0, 0, 0);
          const answerDate = new Date(answer.checkInDate);
          answerDate.setHours(0, 0, 0, 0);
          if (answerDate.getTime() !== filterDate.getTime()) {
            continue;
          }
        }

        if (questionIdParam && answer.questionId !== questionIdParam) {
          continue;
        }

        allSubmissions.push({
          _id: answer._id || `${user._id}-${answer.questionId}-${answer.checkInDate}`,
          userId: user._id.toString(),
          userName: user.name,
          userEmail: user.email,
          questionId: answer.questionId,
          answer: answer.answer,
          answeredAt: answer.answeredAt,
          checkInDate: answer.checkInDate,
        });
      }
    }

    // Sort by answeredAt (most recent first)
    allSubmissions.sort((a, b) => {
      const dateA = new Date(a.answeredAt).getTime();
      const dateB = new Date(b.answeredAt).getTime();
      return dateB - dateA;
    });

    // Pagination
    const total = allSubmissions.length;
    const paginatedSubmissions = allSubmissions.slice(skip, skip + limit);

    // Get question titles for all unique question IDs
    const questionIds = [...new Set(paginatedSubmissions.map((s) => s.questionId))];
    const questions = await DailyCheckinQuestion.find({
      _id: { $in: questionIds },
    })
      .select("_id title type")
      .lean();

    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), { title: q.title, type: q.type }])
    );

    // Add question titles to submissions
    const submissionsWithQuestions = paginatedSubmissions.map((submission) => ({
      ...submission,
      questionTitle: questionMap.get(submission.questionId)?.title || "Question not found",
      questionType: questionMap.get(submission.questionId)?.type || "unknown",
    }));

    return NextResponse.json(
      {
        success: true,
        submissions: submissionsWithQuestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET ALL SUBMISSIONS ERROR:", error);
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

