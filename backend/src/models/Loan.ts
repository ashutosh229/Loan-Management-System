import { Schema, model, Document, Types } from "mongoose";
import { LoanStatus, LOAN_STATUSES, EmploymentMode } from "../types";

export interface IPersonalDetails {
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface ISalarySlip {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface IBreResult {
  passed: boolean;
  reasons: string[];
  checkedAt: Date;
}

export interface ISanctionInfo {
  decidedBy?: Types.ObjectId;
  decision?: "APPROVED" | "REJECTED";
  reason?: string;
  decidedAt?: Date;
}

export interface IDisbursementInfo {
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
}

export interface ILoan extends Document {
  _id: Types.ObjectId;
  borrower: Types.ObjectId;
  status: LoanStatus;
  personalDetails?: IPersonalDetails;
  salarySlip?: ISalarySlip;
  breResult?: IBreResult;
  loanAmount?: number;
  tenureDays?: number;
  interestRate: number;
  interestAmount?: number;
  totalRepayment?: number;
  outstandingBalance?: number;
  appliedAt?: Date;
  sanction?: ISanctionInfo;
  disbursement?: IDisbursementInfo;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: LOAN_STATUSES,
      default: "LEAD",
      required: true,
    },
    personalDetails: {
      fullName: String,
      pan: String,
      dob: Date,
      monthlySalary: Number,
      employmentMode: {
        type: String,
        enum: ["Salaried", "Self-Employed", "Unemployed"],
      },
    },
    salarySlip: {
      filename: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date,
    },
    breResult: {
      passed: Boolean,
      reasons: [String],
      checkedAt: Date,
    },
    loanAmount: { type: Number, min: 50000, max: 500000 },
    tenureDays: { type: Number, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    interestAmount: Number,
    totalRepayment: Number,
    outstandingBalance: Number,
    appliedAt: Date,
    sanction: {
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decision: { type: String, enum: ["APPROVED", "REJECTED"] },
      reason: String,
      decidedAt: Date,
    },
    disbursement: {
      disbursedBy: { type: Schema.Types.ObjectId, ref: "User" },
      disbursedAt: Date,
    },
    closedAt: Date,
  },
  { timestamps: true }
);

export const Loan = model<ILoan>("Loan", loanSchema);
