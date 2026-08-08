import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  listActiveLoans,
  listPaymentsForLoan,
  recordPayment,
} from "../controllers/paymentController";

const router = Router();

router.use(requireAuth, requireRole("collection"));

router.get("/active-loans", listActiveLoans);
router.get("/:id/payments", listPaymentsForLoan);
router.post("/:id/payments", recordPayment);

export default router;
