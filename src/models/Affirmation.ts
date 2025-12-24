import mongoose, { Schema, Document, Model } from "mongoose";

export type AffirmationCategory = "daily" | "weekly";

export interface IAffirmation extends Document {
  title?: string;
  text: string;
  reflectionPrompt?: string;
  category: AffirmationCategory;
  scheduledFor?: Date | null;
  order?: number;
  active: boolean;
  archived: boolean;
}

const AffirmationSchema = new Schema<IAffirmation>(
  {
    title: { type: String },
    text: { type: String, required: true },
    reflectionPrompt: { type: String },
    category: {
      type: String,
      enum: ["daily", "weekly"],
      required: true,
      default: "daily",
    },
    scheduledFor: { type: Date, default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Affirmation: Model<IAffirmation> =
  (mongoose.models.Affirmation as Model<IAffirmation>) ||
  mongoose.model<IAffirmation>("Affirmation", AffirmationSchema);

export default Affirmation;


