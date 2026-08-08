import { Request, Response } from "express";
import { Loan } from "../models/Loan";
import { Payment } from "../models/Payment";

// ---- Collection module: active (disbursed) loans ----
export async function listActiveLoans(_req: Request, res: Response) {
  const loans = await Loan.find({ status: "DISBURSED" })
    .populate("borrower", "name email phone")
    .sort({ "disbursement.disbursedAt": 1 });
  return res.json({ loans });
}

export async function listPaymentsForLoan(req: Request, res: Response) {
  const { id } = req.params;
  const payments = await Payment.find({ loan: id }).sort({ date: -1 });
  return res.json({ payments });
}

export async function recordPayment(req: Request, res: Response) {
  try {
    const { id } = req.params; // loan id
    const { utrNumber, amount, date } = req.body;

    if (!utrNumber || !amount) {
      return res.status(400).json({ message: "utrNumber and amount are required." });
    }
    const amt = Number(amount);
    if (amt <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Loan not found." });
    if (loan.status !== "DISBURSED") {
      return res.status(409).json({ message: `Cannot record payment for a loan in status ${loan.status}.` });
    }

    const outstanding = loan.outstandingBalance ?? 0;
    if (amt > outstanding) {
      return res.status(400).json({
        message: `Amount exceeds outstanding balance of ₹${outstanding.toFixed(2)}.`,
      });
    }

    // UTR uniqueness is enforced at the schema level (unique index) too;
    // this check gives a clean error message instead of a raw duplicate-key error.
    const existingUtr = await Payment.findOne({ utrNumber });
    if (existingUtr) {
      return res.status(409).json({ message: "This UTR number has already been used." });
    }

    const payment = await Payment.create({
      loan: loan._id,
      utrNumber,
      amount: amt,
      date: date ? new Date(date) : new Date(),
      recordedBy: req.userId,
    });

    const newOutstanding = Math.round((outstanding - amt) * 100) / 100;
    loan.outstandingBalance = newOutstanding;

    if (newOutstanding <= 0) {
      loan.status = "CLOSED";
      loan.closedAt = new Date();
    }
    await loan.save();

    return res.status(201).json({ message: "Payment recorded.", payment, loan });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "This UTR number has already been used." });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to record payment." });
  }
}
