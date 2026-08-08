"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const MODULE_LINKS: Record<string, { href: string; label: string }> = {
  sales: { href: "/dashboard/sales", label: "Sales" },
  sanction: { href: "/dashboard/sanction", label: "Sanction" },
  disbursement: { href: "/dashboard/disbursement", label: "Disbursement" },
  collection: { href: "/dashboard/collection", label: "Collection" },
};

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isExec = user.role !== "borrower";
  const visibleModules =
    user.role === "admin" ? Object.values(MODULE_LINKS) : user.role in MODULE_LINKS ? [MODULE_LINKS[user.role]] : [];

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">LMS</span>
          {!isExec && (
            <Link href="/apply/status" className="text-sm text-slate-600 hover:text-slate-900">
              My Application
            </Link>
          )}
          {isExec &&
            visibleModules.map((m) => (
              <Link key={m.href} href={m.href} className="text-sm text-slate-600 hover:text-slate-900">
                {m.label}
              </Link>
            ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {user.name} <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">{user.role}</span>
          </span>
          <button
            onClick={() => logout()}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
