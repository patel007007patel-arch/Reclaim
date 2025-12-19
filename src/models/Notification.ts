import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationTarget = "all" | "users";

export interface INotification extends Document {
  title: string;
  message: string;
  target: NotificationTarget;
  userIds: Types.ObjectId[];
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  status: "draft" | "scheduled" | "sent" | "failed";
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    target: { type: String, enum: ["all", "users"], default: "all" },
    userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    scheduledFor: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;


