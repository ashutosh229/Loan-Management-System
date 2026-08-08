"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import StepIndicator from "@/components/StepIndicator";
import { apiFetch, ApiError } from "@/lib/api";
import { Loan } from "@/lib/types";

const MIN_AMOUNT = 50000;
const MAX_AMOUNT = 500000;
const MIN_TENURE = 30;
const MAX_TENURE = 365;
const RATE = 12;

function calcSI(principal: number, tenureDays: number) {
  const si = (principal * RATE * tenureDays) / (365 * 100);
  const total = principal + si;
  return { si: Math.round(si * 100) / 100, total: Math.round(total * 100) / 100 };
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function LoanConfigForm() {
  const router = useRouter();
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(90);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState("");
  const [checkingGate, setCheckingGate] = useState(true);

  // Make sure the borrower has actually completed steps 2 & 3 before letting them apply.
  useEffect(() => {
    (async () => {
      try {
        const { loan } = await apiFetch<{ loan: Loan }>("/applications/me");
        if (!loan.breResult?.passed) {
          setGateError("Please complete Personal Details (Step 2) first.");
        } else if (!loan.salarySlip) {
          setGateError("Please upload your Salary Slip (Step 3) first.");
        } else if (loan.status === "APPLIED") {
          setGateError("You already have a pending application.");
        }
      } finally {
        setCheckingGate(false);
      }
    })();
  }, []);

  const { si, total } = useMemo(() => calcSI(amount, tenure), [amount, tenure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch<{ loan: Loan }>("/applications/apply", {
        method: "POST",
        body: { loanAmount: amount, tenureDays: tenure },
      });
      router.push("/apply/status");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingGate) {
    return <div className="mx-auto max-w-lg px-4 py-10 text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <StepIndicator current={4} />
      <h1 className="mb-1 text-xl font-semibold">Loan Configuration</h1>
      <p className="mb-6 text-sm text-slate-500">Interest rate is fixed at {RATE}% p.a. (Simple Interest).</p>

      {gateError ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{gateError}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Loan Amount</label>
              <span className="text-sm font-semibold">{formatINR(amount)}</span>
            </div>
            <input
              type="range"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{formatINR(MIN_AMOUNT)}</span>
              <span>{formatINR(MAX_AMOUNT)}</span>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Tenure</label>
              <span className="text-sm font-semibold">{tenure} days</span>
            </div>
            <input
              type="range"
              min={MIN_TENURE}
              max={MAX_TENURE}
              step={1}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{MIN_TENURE} days</span>
              <span>{MAX_TENURE} days</span>
            </div>
          </div>

          {/* Live calculation panel */}
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Principal</span>
              <span className="font-medium">{formatINR(amount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Interest Rate</span>
              <span className="font-medium">{RATE}% p.a.</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Tenure</span>
              <span className="font-medium">{tenure} days</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Simple Interest</span>
              <span className="font-medium">{formatINR(si)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-200 py-2 text-base">
              <span className="font-semibold">Total Repayment</span>
              <span className="font-semibold">{formatINR(total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Apply"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoanConfigPage() {
  return (
    <RequireRole allowed={["borrower"]}>
      <Navbar />
      <LoanConfigForm />
    </RequireRole>
  );
}
