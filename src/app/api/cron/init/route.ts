import { NextRequest, NextResponse } from "next/server";

// Global flag to ensure cron only starts once
let cronStarted = false;

/**
 * Initialize cron jobs - call this endpoint once on server startup
 * This is a workaround for Next.js 16 where instrumentation hook may not work
 */
export async function GET(req: NextRequest) {
  // Only allow in server environment
  if (typeof window !== "undefined") {
    return NextResponse.json({ success: false, message: "Not available in browser" }, { status: 400 });
  }

  // Prevent multiple initializations
  if (cronStarted) {
    return NextResponse.json({ 
      success: true, 
      message: "Cron jobs already initialized" 
    });
  }

  try {
    // Dynamically import to avoid build-time issues
    const { startCronJobs } = await import("@/lib/cron");
    startCronJobs();
    cronStarted = true;

    return NextResponse.json({ 
      success: true, 
      message: "Cron jobs initialized successfully" 
    });
  } catch (error: any) {
    console.error("Failed to initialize cron jobs:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to initialize cron jobs",
      error: error.message 
    }, { status: 500 });
  }
}

