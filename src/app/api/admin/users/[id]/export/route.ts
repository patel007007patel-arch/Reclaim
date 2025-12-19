import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import OnboardingQuestion from "@/models/OnboardingQuestion";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get user's posts
    const posts = await Post.find({ user: id, deletedAt: null })
      .select("title content imageUrl status visibility createdAt")
      .lean();

    // Populate question titles for onboarding answers
    let onboardingAnswers = user.onboardingAnswers || [];
    if (onboardingAnswers.length > 0) {
      const onboardingQuestionIds = onboardingAnswers.map((ans: any) => ans.questionId);
      const onboardingQuestions = await OnboardingQuestion.find({
        _id: { $in: onboardingQuestionIds },
      })
        .select("_id title")
        .lean();
      
      const onboardingQuestionMap = new Map(
        onboardingQuestions.map((q) => [q._id.toString(), q.title])
      );

      onboardingAnswers = onboardingAnswers.map((ans: any) => ({
        ...ans,
        questionTitle: onboardingQuestionMap.get(ans.questionId) || "Question not found",
      }));
    }

    // Populate question titles for daily check-in answers
    let dailyCheckinAnswers = user.dailyCheckinAnswers || [];
    if (dailyCheckinAnswers.length > 0) {
      const dailyCheckinQuestionIds = dailyCheckinAnswers.map((ans: any) => ans.questionId);
      const dailyCheckinQuestions = await DailyCheckinQuestion.find({
        _id: { $in: dailyCheckinQuestionIds },
      })
        .select("_id title")
        .lean();
      
      const dailyCheckinQuestionMap = new Map(
        dailyCheckinQuestions.map((q) => [q._id.toString(), q.title])
      );

      dailyCheckinAnswers = dailyCheckinAnswers.map((ans: any) => ({
        ...ans,
        questionTitle: dailyCheckinQuestionMap.get(ans.questionId) || "Question not found",
      }));
    }

    // Prepare export data
    const exportData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate,
        streak: user.streak || 0,
        activity: user.activity || {},
        onboardingAnswers,
        dailyCheckinAnswers,
        deviceSyncStatus: user.deviceSyncStatus || {},
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      posts: posts,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error("Export user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export user data", error: error.message },
      { status: 500 }
    );
  }
}

