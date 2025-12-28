import mongoose, { Schema, Document, Model } from "mongoose";

export type DailyQuestionType = "single" | "multi" | "single-picker" | "text";
export type TextInputType = "plain-text" | "number" | "price";

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
  textInputType?: TextInputType; // For text type: plain-text, number, or price
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
      enum: ["single", "multi", "single-picker", "text"],
      required: true,
    },
    options: { type: [DailyOptionSchema], default: [] },
    textInputType: {
      type: String,
      enum: ["plain-text", "number", "price"],
    },
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


