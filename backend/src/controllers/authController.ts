import { Request, Response } from "express";
import { User } from "../models/User";
import { Loan } from "../models/Loan";
import { signToken } from "../utils/jwt";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Public signup always creates a borrower. Internal roles are seeded, not self-registered.
    const user = await User.create({ name, email, password, phone, role: "borrower" });

    // Creating a "lead" record so the Sales module can see this registered-but-not-yet-applied user.
    await Loan.create({ borrower: user._id, status: "LEAD" });

    const token = signToken({ id: user._id.toString(), role: user.role });
    res.cookie("token", token, COOKIE_OPTS);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Signup failed." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken({ id: user._id.toString(), role: user.role });
    res.cookie("token", token, COOKIE_OPTS);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed." });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  return res.json({ message: "Logged out." });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ user });
}
