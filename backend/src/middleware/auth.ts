import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { Role } from "../types";

// Augment Express Request with our auth fields
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const bearer = req.headers.authorization;
    const tokenFromHeader = bearer?.startsWith("Bearer ")
      ? bearer.split(" ")[1]
      : undefined;
    const token = tokenFromHeader || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. No token provided." });
    }

    const payload = verifyToken(token);
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
