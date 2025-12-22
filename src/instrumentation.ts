/**
 * Next.js Instrumentation Hook
 * This file runs once when the server starts
 * Note: In Next.js 16, we use an API route approach instead
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Initialize cron jobs
      const { startCronJobs } = await import("./lib/cron");
      startCronJobs();
      console.log("[INSTRUMENTATION] Cron jobs initialized");
    } catch (error) {
      console.error("[INSTRUMENTATION] Failed to initialize cron jobs:", error);
      // Don't fail the build if cron initialization fails
    }
  }
}

