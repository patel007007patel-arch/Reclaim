import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyAffirmation extends Document {
  title?: string;
  text: string;
  reflectionPrompt?: string;
  scheduledFor?: Date | null;
  active: boolean;
  archived: boolean;
}

const DailyAffirmationSchema = new Schema<IDailyAffirmation>(
  {
    title: { type: String },
    text: { type: String, required: true },
    reflectionPrompt: { type: String },
    scheduledFor: { type: Date, default: null },
    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const DailyAffirmation: Model<IDailyAffirmation> =
  (mongoose.models.DailyAffirmation as Model<IDailyAffirmation>) ||
  mongoose.model<IDailyAffirmation>("DailyAffirmation", DailyAffirmationSchema);

export default DailyAffirmation;

