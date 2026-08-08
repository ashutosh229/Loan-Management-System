import { Request, Response } from "express";
import { Loan } from "../models/Loan";

// ---- Sales module: leads (registered, not yet applied) ----
export async function listLeads(_req: Request, res: Response) {
  const leads = await Loan.find({ status: "LEAD" })
    .populate("borrower", "name email phone createdAt")
    .sort({ createdAt: -1 });
  return res.json({ leads });
}

// ---- Sanction module: review applied loans ----
export async function listApplied(_req: Request, res: Response) {
  const loans = await Loan.find({ status: "APPLIED" })
    .populate("borrower", "name email phone")
    .sort({ appliedAt: 1 }); // oldest first, FIFO queue
  return res.json({ loans });
}

export async function decideSanction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body as {
      decision: "APPROVED" | "REJECTED";
      reason?: string;
    };

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "decision must be APPROVED or REJECTED." });
    }
    if (decision === "REJECTED" && !reason) {
      return res.status(400).json({ message: "A reason is required to reject an application." });
    }

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Loan not found." });
    if (loan.status !== "APPLIED") {
      return res.status(409).json({ message: `Cannot decide on a loan in status ${loan.status}.` });
    }

    loan.sanction = {
      decidedBy: req.userId as any,
      decision,
      reason,
      decidedAt: new Date(),
    };
    loan.status = decision === "APPROVED" ? "SANCTIONED" : "REJECTED";
    await loan.save();

    return res.json({ message: `Loan ${decision.toLowerCase()}.`, loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to record sanction decision." });
  }
}

// ---- Disbursement module: release funds on sanctioned loans ----
export async function listSanctioned(_req: Request, res: Response) {
  const loans = await Loan.find({ status: "SANCTIONED" })
    .populate("borrower", "name email phone")
    .sort({ "sanction.decidedAt": 1 });
  return res.json({ loans });
}

export async function markDisbursed(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Loan not found." });
    if (loan.status !== "SANCTIONED") {
      return res.status(409).json({ message: `Cannot disburse a loan in status ${loan.status}.` });
    }

    loan.disbursement = {
      disbursedBy: req.userId as any,
      disbursedAt: new Date(),
    };
    loan.status = "DISBURSED";
    loan.outstandingBalance = loan.totalRepayment;
    await loan.save();

    return res.json({ message: "Loan marked as disbursed.", loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to mark loan as disbursed." });
  }
}

// ---- Shared: full list for Admin overview ----
export async function listAllLoans(_req: Request, res: Response) {
  const loans = await Loan.find()
    .populate("borrower", "name email phone")
    .sort({ createdAt: -1 });
  return res.json({ loans });
}
