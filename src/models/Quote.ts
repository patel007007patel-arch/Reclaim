import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuote extends Document {
  text: string;
  author?: string;
  tags: string[];
  active: boolean;
}

const QuoteSchema = new Schema<IQuote>(
  {
    text: { type: String, required: true },
    author: { type: String },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Quote: Model<IQuote> =
  (mongoose.models.Quote as Model<IQuote>) ||
  mongoose.model<IQuote>("Quote", QuoteSchema);

export default Quote;


