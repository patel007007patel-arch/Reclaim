import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdmin extends Document {
  name?: string;
  email: string;
  password: string;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Admin as Model<IAdmin>) ||
  mongoose.model<IAdmin>("Admin", AdminSchema);
