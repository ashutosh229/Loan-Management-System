export type Role =
  | "admin"
  | "sales"
  | "sanction"
  | "disbursement"
  | "collection"
  | "borrower";

export type LoanStatus =
  | "LEAD"
  | "APPLIED"
  | "REJECTED"
  | "SANCTIONED"
  | "DISBURSED"
  | "CLOSED";

export type EmploymentMode = "Salaried" | "Self-Employed" | "Unemployed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface PersonalDetails {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface SalarySlip {
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

export interface BreResult {
  passed: boolean;
  reasons: string[];
  checkedAt: string;
}

export interface SanctionInfo {
  decision?: "APPROVED" | "REJECTED";
  reason?: string;
  decidedAt?: string;
}

export interface Loan {
  _id: string;
  borrower: string | { _id: string; name: string; email: string; phone?: string; createdAt?: string };
  status: LoanStatus;
  personalDetails?: PersonalDetails;
  salarySlip?: SalarySlip;
  breResult?: BreResult;
  loanAmount?: number;
  tenureDays?: number;
  interestRate: number;
  interestAmount?: number;
  totalRepayment?: number;
  outstandingBalance?: number;
  appliedAt?: string;
  sanction?: SanctionInfo;
  disbursement?: { disbursedAt?: string };
  closedAt?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  utrNumber: string;
  amount: number;
  date: string;
}
