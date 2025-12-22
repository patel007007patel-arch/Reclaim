import cron from "node-cron";
import { connectDB } from "./db";
import Notification from "@/models/Notification";
import User from "@/models/User";
import {
  sendNotificationToAll,
  sendNotificationToUsers,
} from "./onesignal";

/**
 * Process scheduled notifications
 * This function is called by the cron job
 */
async function processScheduledNotifications() {
  try {
    await connectDB();

    const now = new Date();
    console.log(`[CRON] Checking for scheduled notifications at ${now.toISOString()}`);

    // Find all scheduled notifications that are due
    const scheduledNotifications = await Notification.find({
      status: "scheduled",
      scheduledFor: { $lte: now }, // scheduledFor is in the past or now
    }).lean();

    if (scheduledNotifications.length === 0) {
      console.log(`[CRON] No scheduled notifications to process`);
      return;
    }

    console.log(`[CRON] Found ${scheduledNotifications.length} scheduled notification(s) to process`);

    let successCount = 0;
    let failureCount = 0;

    // Process each scheduled notification
    for (const notification of scheduledNotifications) {
      try {
        console.log(`[CRON] Processing: "${notification.title}" (ID: ${notification._id})`);

        let oneSignalResult;

        if (notification.target === "all") {
          // Send to all active users
          oneSignalResult = await sendNotificationToAll(
            notification.title,
            notification.message,
            {
              notificationId: notification._id.toString(),
              target: "all",
            }
          );
        } else if (notification.userIds && notification.userIds.length > 0) {
          // Convert userIds to strings
          const userIdStrings = notification.userIds
            .map((id: any) => {
              if (typeof id === "string") return id;
              if (id && typeof id.toString === "function") {
                const str = id.toString();
                if (/^[0-9a-fA-F]{24}$/.test(str)) return str;
              }
              return null;
            })
            .filter((id: string | null): id is string => id !== null);

          // Verify users exist and are active
          const users = await User.find({
            _id: { $in: userIdStrings },
            active: true,
          })
            .select("_id")
            .lean();

          const validUserIds = users.map((u: any) => {
            const id = u._id;
            return typeof id === "string" ? id : id.toString();
          });

          if (validUserIds.length > 0) {
            oneSignalResult = await sendNotificationToUsers(
              notification.title,
              notification.message,
              validUserIds,
              {
                notificationId: notification._id.toString(),
                target: "users",
                userIds: validUserIds,
              }
            );
          } else {
            oneSignalResult = {
              success: false,
              error: "No active users found for targeted notification",
            };
          }
        } else {
          oneSignalResult = {
            success: false,
            error: "No recipients specified",
          };
        }

        // Update notification status
        if (oneSignalResult?.success) {
          await Notification.findByIdAndUpdate(notification._id, {
            status: "sent",
            sentAt: new Date(),
          });

          successCount++;
          console.log(`[CRON] ✅ Successfully sent: "${notification.title}"`);
        } else {
          await Notification.findByIdAndUpdate(notification._id, {
            status: "failed",
          });

          failureCount++;
          console.error(
            `[CRON] ❌ Failed to send: "${notification.title}" - ${oneSignalResult?.error}`
          );
        }
      } catch (error: any) {
        console.error(
          `[CRON] ❌ Error processing notification ${notification._id}:`,
          error.message
        );

        // Mark as failed
        await Notification.findByIdAndUpdate(notification._id, {
          status: "failed",
        });

        failureCount++;
      }
    }

    console.log(
      `[CRON] ✅ Completed: ${successCount} sent, ${failureCount} failed`
    );
  } catch (error: any) {
    console.error("[CRON] Error processing scheduled notifications:", error);
  }
}

/**
 * Start the cron job to check for scheduled notifications every minute
 */
export function startCronJobs() {
  // Only start in server environment (not during build)
  if (typeof window !== "undefined") {
    return;
  }

  // Schedule: Run every minute
  // Format: * * * * * = every minute of every hour of every day
  cron.schedule("* * * * *", async () => {
    await processScheduledNotifications();
  });

  console.log("[CRON] ✅ Scheduled notification cron job started (runs every minute)");
  
  // Also run immediately on startup to catch any missed notifications
  processScheduledNotifications();
}

