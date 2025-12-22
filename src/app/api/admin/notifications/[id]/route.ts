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

    // Get existing notification to check previous status
    const existingNotification = await Notification.findById(id);
    if (!existingNotification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    const data = { ...body } as any;
    if (data.scheduledFor) {
      data.scheduledFor = new Date(data.scheduledFor);
    }
    if (data.target === "all") {
      data.userIds = [];
    }

    const item = await Notification.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("userIds", "name email");
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    // Send notification via OneSignal if status changed to "sent"
    const statusChangedToSent =
      data.status === "sent" && existingNotification.status !== "sent";

    if (statusChangedToSent) {
      try {
        let oneSignalResult;
        const target = data.target || item.target || "all";
        // Get raw userIds (ObjectIds) from the database, not populated objects
        // Use data.userIds if provided, otherwise get from database without population
        let userIds: any[] = [];
        if (data.userIds && data.userIds.length > 0) {
          userIds = data.userIds;
        } else {
          // Get raw userIds from database (not populated)
          const rawNotification = await Notification.findById(id).select("userIds").lean();
          userIds = rawNotification?.userIds || [];
        }

        if (target === "all") {
          // Send to all active users
          oneSignalResult = await sendNotificationToAll(
            item.title,
            item.message,
            {
              notificationId: item._id.toString(),
              target: "all",
            }
          );
        } else if (userIds && userIds.length > 0) {
          // Verify users exist and are active
          // Convert userIds to strings properly (handle Mongoose ObjectIds and populated objects)
          const userIdStrings = userIds
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
                item.title,
                item.message,
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

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error: any) {
    console.error("NOTIFICATION UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;
    const { id } = await params;
    const item = await Notification.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("NOTIFICATION DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


