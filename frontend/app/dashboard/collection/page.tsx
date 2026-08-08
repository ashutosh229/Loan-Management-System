"use client";

import { useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import { apiFetch, ApiError } from "@/lib/api";
import { Loan, Payment } from "@/lib/types";

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

function PaymentPanel({ loan, onChanged }: { loan: Loan; onChanged: () => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [utrNumber, setUtrNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPayments = async () => {
    const { payments } = await apiFetch<{ payments: Payment[] }>(`/collection/${loan._id}/payments`);
    setPayments(payments);
  };

  useEffect(() => {
    loadPayments();
  }, [loan._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`/collection/${loan._id}/payments`, {
        method: "POST",
        body: { utrNumber, amount: Number(amount), date },
      });
      setUtrNumber("");
      setAmount("");
      await loadPayments();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-2 text-sm font-medium">Payment History</p>
      {payments.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">No payments recorded yet.</p>
      ) : (
        <ul className="mb-3 space-y-1 text-sm">
          {payments.map((p) => (
            <li key={p._id} className="flex justify-between">
              <span className="text-slate-500">
                UTR {p.utrNumber} · {new Date(p.date).toLocaleDateString()}
              </span>
              <span className="font-medium">{formatINR(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {loan.status === "DISBURSED" && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">UTR Number</label>
            <input
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-36 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Amount (₹)</label>
            <input
              required
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Record Payment
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CollectionView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { loans } = await apiFetch<{ loans: Loan[] }>("/collection/active-loans");
      setLoans(loans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Collection — Active Loans</h1>
        <button onClick={load} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
          Refresh
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Loans auto-close once the recorded payments cover the total repayment amount.
      </p>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : loans.length === 0 ? (
        <p className="text-slate-500">No active loans right now.</p>
      ) : (
        <div className="space-y-4">
          {loans.map((l) => (
            <div key={l._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                onClick={() => setExpandedId(expandedId === l._id ? null : l._id)}
              >
                <div>
                  <p className="font-medium">{borrowerName(l)}</p>
                  <p className="text-sm text-slate-500">{borrowerEmail(l)}</p>
                </div>
                <div className="text-right text-sm">
                  <p>
                    Total: {formatINR(l.totalRepayment)} · Outstanding:{" "}
                    <span className="font-semibold">{formatINR(l.outstandingBalance)}</span>
                  </p>
                  <p className="text-xs text-slate-400">Click to {expandedId === l._id ? "collapse" : "manage payments"}</p>
                </div>
              </button>
              {expandedId === l._id && <PaymentPanel loan={l} onChanged={load} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <RequireRole allowed={["collection"]}>
      <Navbar />
      <CollectionView />
    </RequireRole>
  );
}
