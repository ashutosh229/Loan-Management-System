"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { Loan, LoanStatus } from "@/lib/types";

const STATUS_STYLES: Record<LoanStatus, string> = {
  LEAD: "bg-slate-100 text-slate-600",
  APPLIED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  SANCTIONED: "bg-amber-100 text-amber-700",
  DISBURSED: "bg-purple-100 text-purple-700",
  CLOSED: "bg-green-100 text-green-700",
};

function formatINR(n?: number) {
  if (n === undefined) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function StatusView() {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { loan } = await apiFetch<{ loan: Loan }>("/applications/me");
        setLoan(loan);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="mx-auto max-w-lg px-4 py-10 text-slate-500">Loading…</div>;
  if (!loan) return <div className="mx-auto max-w-lg px-4 py-10 text-slate-500">No application found.</div>;

  const needsNextStep = loan.status === "LEAD" || loan.status === "REJECTED";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">My Application</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Status</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[loan.status]}`}>
            {loan.status}
          </span>
        </div>

        {loan.loanAmount && (
          <div className="space-y-1 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Loan Amount</span>
              <span>{formatINR(loan.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tenure</span>
              <span>{loan.tenureDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Interest</span>
              <span>{formatINR(loan.interestAmount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Repayment</span>
              <span>{formatINR(loan.totalRepayment)}</span>
            </div>
            {loan.outstandingBalance !== undefined && (
              <div className="flex justify-between font-medium text-slate-900">
                <span>Outstanding</span>
                <span>{formatINR(loan.outstandingBalance)}</span>
              </div>
            )}
          </div>
        )}

        {loan.status === "REJECTED" && loan.sanction?.reason && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Rejection reason: {loan.sanction.reason}
          </div>
        )}

        {needsNextStep && (
          <Link
            href="/apply/personal-details"
            className="mt-6 block w-full rounded bg-slate-900 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
          >
            {loan.status === "REJECTED" ? "Start a new application" : "Continue application"}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <RequireRole allowed={["borrower"]}>
      <Navbar />
      <StatusView />
    </RequireRole>
  );
}
