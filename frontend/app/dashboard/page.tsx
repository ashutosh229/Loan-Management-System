"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const MODULE_ROUTE: Record<string, string> = {
  sales: "/dashboard/sales",
  sanction: "/dashboard/sanction",
  disbursement: "/dashboard/disbursement",
  collection: "/dashboard/collection",
};

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin" && MODULE_ROUTE[user.role]) {
      router.replace(MODULE_ROUTE[user.role]);
    }
  }, [user, loading, router]);

  if (!user || user.role !== "admin") {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-xl font-semibold">Operations Dashboard — Admin</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(MODULE_ROUTE).map(([role, href]) => (
            <a
              key={role}
              href={href}
              className="rounded-lg border border-slate-200 bg-white p-4 text-center capitalize shadow-sm hover:border-slate-400"
            >
              {role}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
