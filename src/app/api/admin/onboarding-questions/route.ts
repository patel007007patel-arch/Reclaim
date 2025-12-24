import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OnboardingQuestion from "@/models/OnboardingQuestion";
import { verifyAdminOrUser, verifyAdmin } from "@/lib/auth-helpers";

// GET: list all onboarding questions (ordered)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin or user authentication
    const { error } = await verifyAdminOrUser(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const active = searchParams.get("active");
    const type = searchParams.get("type") || "";

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (active !== null && active !== "") {
      query.active = active === "true";
    }
    if (type) {
      query.type = type;
    }

    const questions = await OnboardingQuestion.find(query)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, questions }, { status: 200 });
  } catch (error: any) {
    console.error("ONBOARDING LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create new question
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { title, description, type, options, order, active } = body;

    if (!title || !type) {
      return NextResponse.json(
        { success: false, message: "title and type are required" },
        { status: 400 }
      );
    }

    // If order is not provided, set it to the end (max order + 1)
    let finalOrder = typeof order === "number" ? order : undefined;
    if (finalOrder === undefined) {
      const maxOrderQuestion = await OnboardingQuestion.findOne()
        .sort({ order: -1 })
        .select("order")
        .lean();
      finalOrder = maxOrderQuestion ? maxOrderQuestion.order + 1 : 0;
    }

    const question = await OnboardingQuestion.create({
      title,
      description,
      type,
      options: options || [],
      order: finalOrder,
      active: typeof active === "boolean" ? active : true,
    });

    return NextResponse.json(
      { success: true, question },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("ONBOARDING CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


