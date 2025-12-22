import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { verifyAdmin } from "@/lib/auth-helpers";
import {
  sendNotificationToAll,
  sendNotificationToUsers,
} from "@/lib/onesignal";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const target = searchParams.get("target");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (target) query.target = target;

    // Build search query for MongoDB
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("userIds", "name email")
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      success: true, 
      items,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("NOTIFICATION LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

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

    const { title, message, target, userIds, scheduledFor, status } = body;
    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "title and message are required" },
        { status: 400 }
      );
    }

    // Determine status based on scheduledFor and status
    let finalStatus = status || "draft";
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      // If scheduledFor is in the future, set status to "scheduled"
      finalStatus = "scheduled";
    } else if (scheduledFor && new Date(scheduledFor) <= new Date() && !status) {
      // If scheduledFor is in the past/now and no status, set to "draft"
      finalStatus = "draft";
    }

    const item = await Notification.create({
      title,
      message,
      target: target || "all",
      userIds: userIds || [],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: finalStatus,
    });

    // Send notification via OneSignal if status is "sent" (not scheduled)
    if (finalStatus === "sent") {
      try {
        let oneSignalResult;
        if (target === "all") {
          // Send to all active users
          oneSignalResult = await sendNotificationToAll(title, message, {
            notificationId: item._id.toString(),
            target: "all",
          });
        } else if (userIds && userIds.length > 0) {
          // Verify users exist and are active
          const users = await User.find({
            _id: { $in: userIds },
            active: true,
          })
            .select("_id")
            .lean();

          const validUserIds = users.map((u: any) => u._id.toString());

          if (validUserIds.length > 0) {
            // Send using User IDs directly (frontend sets External User ID automatically)
            oneSignalResult = await sendNotificationToUsers(
              title,
              message,
              validUserIds,
              {
                notificationId: item._id.toString(),
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

        // Update notification with sent status
        if (oneSignalResult?.success) {
          item.sentAt = new Date();
          item.status = "sent";
          await item.save();
        } else {
          // Mark as failed if OneSignal send failed
          item.status = "failed";
          await item.save();
          console.error("OneSignal send failed:", oneSignalResult?.error);
        }
      } catch (error: any) {
        console.error("Error sending OneSignal notification:", error);
        item.status = "failed";
        await item.save();
      }
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("NOTIFICATION CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


