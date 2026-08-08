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

function SanctionView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { loans } = await apiFetch<{ loans: Loan[] }>("/dashboard/sanction/applied");
      setLoans(loans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, decision: "APPROVED" | "REJECTED", rejectReason?: string) => {
    setError("");
    setBusyId(id);
    try {
      await apiFetch(`/dashboard/sanction/${id}/decide`, {
        method: "PATCH",
        body: { decision, reason: rejectReason },
      });
      setRejectingId(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to record decision.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sanction — Applied Loans</h1>
        <button onClick={load} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : loans.length === 0 ? (
        <p className="text-slate-500">No pending applications.</p>
      ) : (
        <div className="space-y-4">
          {loans.map((l) => (
            <div key={l._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{borrowerName(l)}</p>
                  <p className="text-sm text-slate-500">{borrowerEmail(l)}</p>
                  <p className="mt-2 text-sm">
                    PAN: {l.personalDetails?.pan} · Salary: {formatINR(l.personalDetails?.monthlySalary)} ·{" "}
                    {l.personalDetails?.employmentMode}
                  </p>
                  <p className="text-sm">
                    Requested: {formatINR(l.loanAmount)} for {l.tenureDays} days → Repay {formatINR(l.totalRepayment)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === l._id}
                      onClick={() => decide(l._id, "APPROVED")}
                      className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === l._id}
                      onClick={() => setRejectingId(rejectingId === l._id ? null : l._id)}
                      className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>

                  {rejectingId === l._id && (
                    <div className="flex w-64 flex-col gap-2">
                      <textarea
                        placeholder="Reason for rejection…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="rounded border border-slate-300 p-2 text-sm"
                      />
                      <button
                        disabled={!reason || busyId === l._id}
                        onClick={() => decide(l._id, "REJECTED", reason)}
                        className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SanctionPage() {
  return (
    <RequireRole allowed={["sanction"]}>
      <Navbar />
      <SanctionView />
    </RequireRole>
  );
}
