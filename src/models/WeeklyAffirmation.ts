import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeeklyAffirmation extends Document {
  title?: string;
  text: string;
  reflectionPrompt?: string;
  scheduledFor?: Date | null;
  active: boolean;
  archived: boolean;
}

const WeeklyAffirmationSchema = new Schema<IWeeklyAffirmation>(
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

const WeeklyAffirmation: Model<IWeeklyAffirmation> =
  (mongoose.models.WeeklyAffirmation as Model<IWeeklyAffirmation>) ||
  mongoose.model<IWeeklyAffirmation>("WeeklyAffirmation", WeeklyAffirmationSchema);

export default WeeklyAffirmation;

