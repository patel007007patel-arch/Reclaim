import mongoose, { Schema, Document, Model } from "mongoose";

export type ResourceCategory = "journey" | "motivation" | "lesson";

export interface IResource extends Document {
  title: string;
  description?: string;
  content: string;
  category: ResourceCategory;
  imageUrl?: string;
  videoUrl?: string;
  order?: number;
  active: boolean;
  archived: boolean;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["journey", "motivation", "lesson"],
      required: true,
    },
    imageUrl: { type: String },
    videoUrl: { type: String },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Resource: Model<IResource> =
  (mongoose.models.Resource as Model<IResource>) ||
  mongoose.model<IResource>("Resource", ResourceSchema);

export default Resource;

