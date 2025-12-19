import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAffirmation extends Document {
  title?: string;
  text: string;
  reflectionPrompt?: string;
  scheduledFor?: Date | null;
  archived: boolean;
}

const AffirmationSchema = new Schema<IAffirmation>(
  {
    title: { type: String },
    text: { type: String, required: true },
    reflectionPrompt: { type: String },
    scheduledFor: { type: Date, default: null },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Affirmation: Model<IAffirmation> =
  (mongoose.models.Affirmation as Model<IAffirmation>) ||
  mongoose.model<IAffirmation>("Affirmation", AffirmationSchema);

export default Affirmation;


