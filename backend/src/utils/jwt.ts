import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "../types";

export interface JwtPayload {
  id: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as JwtPayload;
}
