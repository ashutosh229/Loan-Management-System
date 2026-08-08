import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  loan: Types.ObjectId;
  utrNumber: string;
  amount: number;
  date: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loan: { type: Schema.Types.ObjectId, ref: "Loan", required: true },
    utrNumber: {
      type: String,
      required: true,
      unique: true, // UTR must be unique across ALL payments, not just per loan
      trim: true,
    },
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
