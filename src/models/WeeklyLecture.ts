import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeeklyLecture extends Document {
  title: string;
  imageUrl?: string;
  affirmationText: string;
  reflectionText: string;
  weekOf: Date; // start date of the week
  published: boolean;
  archived: boolean;
}

const WeeklyLectureSchema = new Schema<IWeeklyLecture>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String },
    affirmationText: { type: String, required: true },
    reflectionText: { type: String, required: true },
    weekOf: { type: Date, required: true },
    published: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const WeeklyLecture: Model<IWeeklyLecture> =
  (mongoose.models.WeeklyLecture as Model<IWeeklyLecture>) ||
  mongoose.model<IWeeklyLecture>("WeeklyLecture", WeeklyLectureSchema);

export default WeeklyLecture;


