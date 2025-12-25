import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPost extends Document {
  user?: Types.ObjectId;
  title: string;
  content: string;
  imageUrl?: string;
  status: "pending" | "approved" | "rejected";
  published: boolean;
  visibility: "public" | "private";
  flagged: boolean;
  flags?: Types.ObjectId[]; // Array of user IDs who flagged this post
  flagCount?: number; // Total number of users who flagged
  archived: boolean;
  deletedAt?: Date | null;
}

const PostSchema = new Schema<IPost>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    published: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    flagged: { type: Boolean, default: false },
    flags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    flagCount: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual for flagCount (auto-calculate from flags array length)
PostSchema.virtual("computedFlagCount").get(function() {
  return this.flags?.length || 0;
});

const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) ||
  mongoose.model<IPost>("Post", PostSchema);

export default Post;

