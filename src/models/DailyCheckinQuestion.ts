import mongoose, { Schema, Document, Model } from "mongoose";

export type DailyQuestionType = "single" | "multi" | "scale" | "text";

export interface IDailyOption {
  _id?: string;
  label: string;
  value: string;
}

export interface IDailyCheckinQuestion extends Document {
  title: string;
  description?: string;
  type: DailyQuestionType;
  options: IDailyOption[];
  order: number;
  active: boolean;
}

const DailyOptionSchema = new Schema<IDailyOption>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: true }
);

const DailyCheckinQuestionSchema = new Schema<IDailyCheckinQuestion>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["single", "multi", "scale", "text"],
      required: true,
    },
    options: { type: [DailyOptionSchema], default: [] },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DailyCheckinQuestion: Model<IDailyCheckinQuestion> =
  (mongoose.models.DailyCheckinQuestion as Model<IDailyCheckinQuestion>) ||
  mongoose.model<IDailyCheckinQuestion>(
    "DailyCheckinQuestion",
    DailyCheckinQuestionSchema
  );

export default DailyCheckinQuestion;


