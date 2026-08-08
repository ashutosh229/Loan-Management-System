"use client";

import { useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import { apiFetch, ApiError } from "@/lib/api";
import { Loan } from "@/lib/types";

function borrowerName(l: Loan) {
  return typeof l.borrower === "object" ? l.borrower.name : "—";
}
function borrowerEmail(l: Loan) {
  return typeof l.borrower === "object" ? l.borrower.email : "—";
}
function formatINR(n?: number) {
  if (n === undefined) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function DisbursementView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { loans } = await apiFetch<{ loans: Loan[] }>("/dashboard/disbursement/sanctioned");
      setLoans(loans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const disburse = async (id: string) => {
    setError("");
    setBusyId(id);
    try {
      await apiFetch(`/dashboard/disbursement/${id}/disburse`, { method: "PATCH" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to mark as disbursed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Disbursement — Sanctioned Loans</h1>
        <button onClick={load} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : loans.length === 0 ? (
        <p className="text-slate-500">No loans awaiting disbursement.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Borrower</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Tenure</th>
                <th className="px-4 py-2">Total Repayment</th>
                <th className="px-4 py-2">Sanctioned On</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l._id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <div>{borrowerName(l)}</div>
                    <div className="text-xs text-slate-400">{borrowerEmail(l)}</div>
                  </td>
                  <td className="px-4 py-2">{formatINR(l.loanAmount)}</td>
                  <td className="px-4 py-2">{l.tenureDays} days</td>
                  <td className="px-4 py-2">{formatINR(l.totalRepayment)}</td>
                  <td className="px-4 py-2">
                    {l.sanction?.decidedAt ? new Date(l.sanction.decidedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      disabled={busyId === l._id}
                      onClick={() => disburse(l._id)}
                      className="rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      Mark Disbursed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DisbursementPage() {
  return (
    <RequireRole allowed={["disbursement"]}>
      <Navbar />
      <DisbursementView />
    </RequireRole>
  );
}
