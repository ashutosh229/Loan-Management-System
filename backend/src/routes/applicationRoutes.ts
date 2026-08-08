import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { uploadSalarySlip } from "../utils/upload";
import {
  getMyApplication,
  submitPersonalDetails,
  uploadSalarySlipHandler,
  calculatePreview,
  applyForLoan,
  myLoanHistory,
} from "../controllers/applicationController";

const router = Router();

// All routes here are for the logged-in borrower acting on their own application.
router.use(requireAuth, requireRole("borrower"));

router.get("/me", getMyApplication);
router.get("/history", myLoanHistory);
router.post("/personal-details", submitPersonalDetails);
router.post("/salary-slip", uploadSalarySlip.single("salarySlip"), uploadSalarySlipHandler);
router.get("/calculate", calculatePreview);
router.post("/apply", applyForLoan);

export default router;
