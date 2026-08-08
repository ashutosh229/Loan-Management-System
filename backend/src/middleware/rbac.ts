import { Request, Response, NextFunction } from "express";
import { Role } from "../types";

/**
 * Restricts a route to the given roles. "admin" is always allowed through
 * automatically, since Admin can access every module.
 *
 * Usage: router.get('/sales', requireAuth, requireRole('sales'), handler)
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.userRole;
    if (!role) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    if (role === "admin" || allowed.includes(role)) {
      return next();
    }
    return res.status(403).json({
      message: `Forbidden: role '${role}' cannot access this resource.`,
    });
  };
}
