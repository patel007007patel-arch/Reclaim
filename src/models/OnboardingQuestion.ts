import mongoose, { Schema, Document, Model } from "mongoose";

export type QuestionType = "single" | "multi" | "date" | "single-picker" | "text";
export type TextInputType = "plain-text" | "number" | "price";

export interface IOnboardingOption {
  _id?: string;
  label: string;
  value: string;
}

export interface IOnboardingQuestion extends Document {
  title: string;
  description?: string;
  type: QuestionType;
  options: IOnboardingOption[];
  textInputType?: TextInputType; // For text type: plain-text, number, or price
  order: number;
  active: boolean;
}

const OptionSchema = new Schema<IOnboardingOption>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: true }
);

const OnboardingQuestionSchema = new Schema<IOnboardingQuestion>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["single", "multi", "date", "single-picker", "text"],
      required: true,
    },
    options: { type: [OptionSchema], default: [] },
    textInputType: {
      type: String,
      enum: ["plain-text", "number", "price"],
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const OnboardingQuestion: Model<IOnboardingQuestion> =
  (mongoose.models.OnboardingQuestion as Model<IOnboardingQuestion>) ||
  mongoose.model<IOnboardingQuestion>(
    "OnboardingQuestion",
    OnboardingQuestionSchema
  );

export default OnboardingQuestion;


