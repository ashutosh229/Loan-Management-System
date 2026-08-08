export type Role =
  | "admin"
  | "sales"
  | "sanction"
  | "disbursement"
  | "collection"
  | "borrower";

export const ROLES: Role[] = [
  "admin",
  "sales",
  "sanction",
  "disbursement",
  "collection",
  "borrower",
];

// Loan lifecycle statuses.
// LEAD          -> user signed up as borrower, no application yet (Sales module)
// APPLIED       -> personal details passed BRE, applied for a loan amount (Sanction module)
// REJECTED      -> sanction executive rejected the application (terminal)
// SANCTIONED    -> sanction executive approved (Disbursement module)
// DISBURSED     -> funds released (Collection module)
// CLOSED        -> total repayment collected (terminal)
export type LoanStatus =
  | "LEAD"
  | "APPLIED"
  | "REJECTED"
  | "SANCTIONED"
  | "DISBURSED"
  | "CLOSED";

export const LOAN_STATUSES: LoanStatus[] = [
  "LEAD",
  "APPLIED",
  "REJECTED",
  "SANCTIONED",
  "DISBURSED",
  "CLOSED",
];

export type EmploymentMode = "Salaried" | "Self-Employed" | "Unemployed";
