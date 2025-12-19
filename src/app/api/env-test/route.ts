import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mongo: process.env.MONGODB_URI || "NOT FOUND",
  });
}
