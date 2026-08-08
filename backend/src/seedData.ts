import { User } from "./models/User";
import { Loan } from "./models/Loan";
import { Payment } from "./models/Payment";

export const SEED_USERS = [
  { name: "Admin User", email: "admin@lms.test", password: "Password123", role: "admin" as const },
  { name: "Sales Exec", email: "sales@lms.test", password: "Password123", role: "sales" as const },
  { name: "Sanction Exec", email: "sanction@lms.test", password: "Password123", role: "sanction" as const },
  { name: "Disbursement Exec", email: "disbursement@lms.test", password: "Password123", role: "disbursement" as const },
  { name: "Collection Exec", email: "collection@lms.test", password: "Password123", role: "collection" as const },
  { name: "Demo Borrower", email: "borrower@lms.test", password: "Password123", role: "borrower" as const },
];

/**
 * Creates one account per role. With force=true, wipes existing Users/Loans/
 * Payments first (used by `npm run seed`). With force=false, only seeds if
 * the User collection is completely empty — safe to call on every server
 * boot so a fresh `docker compose up` is immediately usable without any
 * manual seeding step, while never clobbering data on restarts.
 */
export async function seedDatabase(force: boolean): Promise<void> {
  if (!force) {
    const existing = await User.countDocuments();
    if (existing > 0) {
      console.log("Users already exist — skipping auto-seed.");
      return;
    }
  } else {
    console.log("Force seed: clearing existing Users, Loans, and Payments...");
    await Promise.all([User.deleteMany({}), Loan.deleteMany({}), Payment.deleteMany({})]);
  }

  console.log("Seeding one account per role...");
  for (const u of SEED_USERS) {
    const user = await User.create(u); // pre-save hook hashes the password
    if (user.role === "borrower") {
      await Loan.create({ borrower: user._id, status: "LEAD" });
    }
  }

  console.log("Seeded accounts (all passwords: Password123):");
  SEED_USERS.forEach((u) => console.log(`  ${u.role.padEnd(13)} ${u.email}`));
}
