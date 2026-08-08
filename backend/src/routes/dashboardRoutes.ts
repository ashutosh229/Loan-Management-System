import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  listLeads,
  listApplied,
  decideSanction,
  listSanctioned,
  markDisbursed,
  listAllLoans,
} from "../controllers/dashboardController";

const router = Router();

router.use(requireAuth);

// Sales module
router.get("/sales/leads", requireRole("sales"), listLeads);

// Sanction module
router.get("/sanction/applied", requireRole("sanction"), listApplied);
router.patch("/sanction/:id/decide", requireRole("sanction"), decideSanction);

// Disbursement module
router.get("/disbursement/sanctioned", requireRole("disbursement"), listSanctioned);
router.patch("/disbursement/:id/disburse", requireRole("disbursement"), markDisbursed);

// Admin overview (requireRole('admin') would be redundant since admin bypasses
// all checks, but every executive role can also see the full list here for context)
router.get("/all", requireRole("admin"), listAllLoans);

export default router;
