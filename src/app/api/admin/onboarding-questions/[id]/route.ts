import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OnboardingQuestion from "@/models/OnboardingQuestion";
import { verifyAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH: update a question (title, options, active, etc.)
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

    const question = await OnboardingQuestion.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, question },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ONBOARDING UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: delete a question
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;

    const question = await OnboardingQuestion.findByIdAndDelete(id);
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Question deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ONBOARDING DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


