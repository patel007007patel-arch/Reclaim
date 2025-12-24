import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Resource from "@/models/Resource";

// Public/app: get resources by category (journey, motivation, lesson)
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as "journey" | "motivation" | "lesson" | null;

    const query: any = {
      active: true,
      archived: false,
    };

    if (category && ["journey", "motivation", "lesson"].includes(category)) {
      query.category = category;
    }

    const resources = await Resource.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, resources }, { status: 200 });
  } catch (error: any) {
    console.error("RESOURCES ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

