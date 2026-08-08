import { Request, Response } from "express";
import { Loan } from "../models/Loan";
import { runBRE } from "../utils/bre";
import { calculateLoan, validateLoanConfig } from "../utils/loanCalc";

// Returns (and lazily creates) the borrower's current in-progress loan/lead record.
async function getOrCreateActiveLoan(borrowerId: string) {
  let loan = await Loan.findOne({
    borrower: borrowerId,
    status: { $in: ["LEAD", "APPLIED"] },
  }).sort({ createdAt: -1 });

  if (!loan) {
    loan = await Loan.create({ borrower: borrowerId, status: "LEAD" });
  }
  return loan;
}

export async function getMyApplication(req: Request, res: Response) {
  const loan = await getOrCreateActiveLoan(req.userId as string);
  return res.json({ loan });
}

// Step 2 - Personal Details + server-side BRE
export async function submitPersonalDetails(req: Request, res: Response) {
  try {
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dob || !monthlySalary || !employmentMode) {
      return res.status(400).json({ message: "All personal detail fields are required." });
    }

    const breResult = runBRE({
      dob,
      monthlySalary: Number(monthlySalary),
      pan,
      employmentMode,
    });

    const loan = await getOrCreateActiveLoan(req.userId as string);

    loan.personalDetails = {
      fullName,
      pan: pan.toUpperCase(),
      dob: new Date(dob),
      monthlySalary: Number(monthlySalary),
      employmentMode,
    };
    loan.breResult = { ...breResult, checkedAt: new Date() };
    await loan.save();

    if (!breResult.passed) {
      // Block progression, but keep the record so the user can correct and resubmit.
      return res.status(422).json({
        message: "Application does not meet eligibility criteria.",
        reasons: breResult.reasons,
        loan,
      });
    }

    return res.json({ message: "Eligibility check passed.", loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to submit personal details." });
  }
}

// Step 3 - Upload Salary Slip
export async function uploadSalarySlipHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const loan = await getOrCreateActiveLoan(req.userId as string);
    if (!loan.breResult?.passed) {
      return res.status(400).json({ message: "Complete eligibility check (Step 2) first." });
    }

    loan.salarySlip = {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };
    await loan.save();

    return res.json({ message: "Salary slip uploaded.", loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Upload failed." });
  }
}

// Live calculation panel (also re-validated on Apply)
export async function calculatePreview(req: Request, res: Response) {
  const amount = Number(req.query.amount);
  const tenureDays = Number(req.query.tenureDays);

  const errors = validateLoanConfig(amount, tenureDays);
  if (errors.length) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  return res.json(calculateLoan(amount, tenureDays));
}

// Step 4 - Loan Configuration & Apply
export async function applyForLoan(req: Request, res: Response) {
  try {
    const { loanAmount, tenureDays } = req.body;
    const amount = Number(loanAmount);
    const tenure = Number(tenureDays);

    const configErrors = validateLoanConfig(amount, tenure);
    if (configErrors.length) {
      return res.status(400).json({ message: configErrors.join(" ") });
    }

    const loan = await getOrCreateActiveLoan(req.userId as string);

    if (!loan.breResult?.passed) {
      return res.status(400).json({ message: "You must pass the eligibility check before applying." });
    }
    if (!loan.salarySlip) {
      return res.status(400).json({ message: "Please upload your salary slip before applying." });
    }
    if (loan.status === "APPLIED") {
      return res.status(400).json({ message: "You already have a pending application." });
    }

    const calc = calculateLoan(amount, tenure);

    loan.loanAmount = amount;
    loan.tenureDays = tenure;
    loan.interestAmount = calc.simpleInterest;
    loan.totalRepayment = calc.totalRepayment;
    loan.outstandingBalance = calc.totalRepayment;
    loan.status = "APPLIED";
    loan.appliedAt = new Date();
    await loan.save();

    return res.status(201).json({ message: "Application submitted.", loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to submit application." });
  }
}

export async function myLoanHistory(req: Request, res: Response) {
  const loans = await Loan.find({ borrower: req.userId }).sort({ createdAt: -1 });
  return res.json({ loans });
}
