import mongoose, { Schema, Document, Model } from "mongoose";

export type MediaType = "video" | "audio";

export interface IMediaItem extends Document {
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  tags: string[];
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "audio"], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    durationSeconds: { type: Number },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const MediaItem: Model<IMediaItem> =
  (mongoose.models.MediaItem as Model<IMediaItem>) ||
  mongoose.model<IMediaItem>("MediaItem", MediaItemSchema);

export default MediaItem;


