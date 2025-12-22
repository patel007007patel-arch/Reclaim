import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { verifyAdmin } from "@/lib/auth-helpers";
import {
  sendNotificationToAll,
  sendNotificationToUsers,
} from "@/lib/onesignal";

type Params = { params: Promise<{ id: string }> };

/**
 * Manually send a notification via OneSignal
 * This endpoint allows sending a notification that is in draft or scheduled status
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const { id } = await params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    // Check if already sent
    if (notification.status === "sent" && notification.sentAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification has already been sent",
        },
        { status: 400 }
      );
    }

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
      // Verify users exist and are active
      // Convert userIds to strings properly (handle Mongoose ObjectIds and populated objects)
      const userIdStrings = notification.userIds
        .map((id: any) => {
          if (!id) return null;
          
          // If it's already a string, validate and return it
          if (typeof id === "string") {
            if (/^[0-9a-fA-F]{24}$/.test(id)) return id;
            return null;
          }
          
          // If it's a populated object with _id property
          if (id && typeof id === "object" && id._id) {
            const idValue = id._id;
            if (typeof idValue === "string") {
              if (/^[0-9a-fA-F]{24}$/.test(idValue)) return idValue;
            } else if (idValue && typeof idValue.toString === "function") {
              const str = idValue.toString();
              if (/^[0-9a-fA-F]{24}$/.test(str)) return str;
            }
            return null;
          }
          
          // If it's a Mongoose ObjectId or has toString method
          if (id && typeof id.toString === "function") {
            const str = id.toString();
            // Make sure it's a valid ObjectId string (24 hex characters)
            if (/^[0-9a-fA-F]{24}$/.test(str)) return str;
          }
          
          return null;
        })
        .filter((id: string | null): id is string => id !== null);

      if (userIdStrings.length === 0) {
        oneSignalResult = {
          success: false,
          error: "No valid user IDs found",
        };
      } else {
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
          // Send using User IDs directly (frontend sets External User ID automatically)
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
            error: "No active users found",
          };
        }
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "No recipients specified for this notification",
        },
        { status: 400 }
      );
    }

    // Update notification status
    if (oneSignalResult?.success) {
      notification.sentAt = new Date();
      notification.status = "sent";
      await notification.save();

      return NextResponse.json({
        success: true,
        message: "Notification sent successfully",
        notificationId: oneSignalResult.notificationId,
        item: notification,
      });
    } else {
      // Mark as failed if OneSignal send failed
      notification.status = "failed";
      await notification.save();

      return NextResponse.json(
        {
          success: false,
          message: "Failed to send notification",
          error: oneSignalResult?.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending notification:", error);
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

