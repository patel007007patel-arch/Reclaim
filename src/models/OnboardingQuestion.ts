import mongoose, { Schema, Document, Model } from "mongoose";

export type QuestionType = "single" | "multi" | "date" | "number" | "days" | "text";

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
      enum: ["single", "multi", "date", "number", "days", "text"],
      required: true,
    },
    options: { type: [OptionSchema], default: [] },
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


