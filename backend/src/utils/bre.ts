import { EmploymentMode } from "../types";

// PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F) - official IT dept format
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export interface BreInput {
  dob: Date | string;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BreOutput {
  passed: boolean;
  reasons: string[];
}

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Runs the Business Rule Engine against applicant data.
 * This MUST run on the server — it is the source of truth for eligibility.
 * (A client-side mirror of these same checks is used only for instant UX
 * feedback; it is never trusted for the actual decision.)
 */
export function runBRE(input: BreInput): BreOutput {
  const reasons: string[] = [];

  const dob = new Date(input.dob);
  const age = calculateAge(dob);
  if (Number.isNaN(age) || age < 23 || age > 50) {
    reasons.push("Age must be between 23 and 50 years.");
  }

  if (!input.monthlySalary || input.monthlySalary < 25000) {
    reasons.push("Monthly salary must be at least ₹25,000.");
  }

  if (!PAN_REGEX.test((input.pan || "").toUpperCase())) {
    reasons.push("PAN does not match a valid format (e.g. ABCDE1234F).");
  }

  if (input.employmentMode === "Unemployed") {
    reasons.push("Applicant must be employed (Salaried or Self-Employed).");
  }

  return { passed: reasons.length === 0, reasons };
}
