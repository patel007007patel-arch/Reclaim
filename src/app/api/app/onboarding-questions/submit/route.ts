import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import OnboardingQuestion from "@/models/OnboardingQuestion";
import { verifyUser } from "@/lib/auth-helpers";

// POST: submit onboarding question answers
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

    const { answers } = body; // Array of { questionId, answer }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, message: "answers must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate all questions exist and are active
    const questionIds = answers.map((a: any) => a.questionId);
    const questions = await OnboardingQuestion.find({
      _id: { $in: questionIds },
      active: true,
    }).lean();

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { success: false, message: "Some questions are invalid or inactive" },
        { status: 400 }
      );
    }

    // Create answer objects with question titles
    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q])
    );

    const answerObjects = answers.map((ans: any) => {
      const question = questionMap.get(ans.questionId);
      if (!question) {
        throw new Error(`Question ${ans.questionId} not found`);
      }

      return {
        questionId: ans.questionId,
        questionTitle: question.title,
        answer: ans.answer,
        answeredAt: new Date(),
      };
    });

    // Update user's onboarding answers
    // Remove existing answers for these questions and add new ones
    const existingAnswers = user!.onboardingAnswers || [];
    const updatedAnswers = existingAnswers.filter(
      (ans: any) => !questionIds.includes(ans.questionId.toString())
    );

    // Add new answers
    updatedAnswers.push(...answerObjects);

    await User.findByIdAndUpdate(user!._id, {
      onboardingAnswers: updatedAnswers,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Onboarding answers submitted successfully",
        answers: answerObjects,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ONBOARDING SUBMIT ERROR:", error);
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

// GET: get user's onboarding answers
// Authentication required - Bearer token in Authorization header
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    const answers = user!.onboardingAnswers || [];

    return NextResponse.json(
      {
        success: true,
        answers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET ONBOARDING ANSWERS ERROR:", error);
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

