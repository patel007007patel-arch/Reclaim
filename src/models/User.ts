import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  birthdate?: Date;
  googleId?: string;
  facebookId?: string;
  streak?: number; // daily check-in streak
  activity?: {
    lastCheckIn?: Date;
    totalCheckIns?: number;
    totalPosts?: number;
  };
  onboardingAnswers?: Array<{
    questionId: string;
    answer: any; // can be string, array, date, number
    answeredAt: Date;
  }>;
  dailyCheckinAnswers?: Array<{
    questionId: string;
    answer: any; // can be string, array, number
    answeredAt: Date;
    checkInDate: Date; // date of the check-in
  }>;
  deviceSyncStatus?: {
    lastSync?: Date;
    deviceId?: string;
    platform?: string;
  };
  active: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    birthdate: {
      type: Date,
    },

    googleId: {
      type: String,
      index: true,
    },

    facebookId: {
      type: String,
      index: true,
    },
    streak: {
      type: Number,
      default: 0,
    },
    activity: {
      lastCheckIn: { type: Date },
      totalCheckIns: { type: Number, default: 0 },
      totalPosts: { type: Number, default: 0 },
    },
    onboardingAnswers: [
      {
        questionId: { type: String, required: true },
        answer: { type: Schema.Types.Mixed, required: true },
        answeredAt: { type: Date, default: Date.now },
      },
    ],
    dailyCheckinAnswers: [
      {
        questionId: { type: String, required: true },
        answer: { type: Schema.Types.Mixed, required: true },
        answeredAt: { type: Date, default: Date.now },
        checkInDate: { type: Date, required: true, default: Date.now },
      },
    ],
    deviceSyncStatus: {
      lastSync: { type: Date },
      deviceId: { type: String },
      platform: { type: String },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;

