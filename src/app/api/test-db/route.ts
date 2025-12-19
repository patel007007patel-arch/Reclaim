import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI as string;

    await mongoose.connect(uri);

    return NextResponse.json({
      success: true,
      message: "MongoDB Connected",
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
