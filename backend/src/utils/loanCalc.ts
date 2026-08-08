export const INTEREST_RATE = 12; // % p.a., fixed
export const MIN_LOAN_AMOUNT = 50000;
export const MAX_LOAN_AMOUNT = 500000;
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;

export interface LoanCalcResult {
  principal: number;
  interestRate: number;
  tenureDays: number;
  simpleInterest: number;
  totalRepayment: number;
}

/**
 * SI = (P x R x T) / (365 x 100), T in days
 * Total Repayment = P + SI
 */
export function calculateLoan(
  principal: number,
  tenureDays: number,
  rate: number = INTEREST_RATE
): LoanCalcResult {
  const simpleInterest = (principal * rate * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;

  return {
    principal,
    interestRate: rate,
    tenureDays,
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}

export function validateLoanConfig(
  principal: number,
  tenureDays: number
): string[] {
  const errors: string[] = [];
  if (principal < MIN_LOAN_AMOUNT || principal > MAX_LOAN_AMOUNT) {
    errors.push(
      `Loan amount must be between ₹${MIN_LOAN_AMOUNT.toLocaleString()} and ₹${MAX_LOAN_AMOUNT.toLocaleString()}.`
    );
  }
  if (tenureDays < MIN_TENURE_DAYS || tenureDays > MAX_TENURE_DAYS) {
    errors.push(
      `Tenure must be between ${MIN_TENURE_DAYS} and ${MAX_TENURE_DAYS} days.`
    );
  }
  return errors;
}
