"use client";

import { useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { Loan } from "@/lib/types";

function borrowerName(l: Loan) {
  return typeof l.borrower === "object" ? l.borrower.name : "—";
}
function borrowerEmail(l: Loan) {
  return typeof l.borrower === "object" ? l.borrower.email : "—";
}
function borrowerPhone(l: Loan) {
  return typeof l.borrower === "object" ? l.borrower.phone || "—" : "—";
}

function SalesView() {
  const [leads, setLeads] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { leads } = await apiFetch<{ leads: Loan[] }>("/dashboard/sales/leads");
      setLeads(leads);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales — Leads</h1>
        <button onClick={load} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
          Refresh
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Registered users who haven&apos;t yet submitted a loan application.
      </p>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="text-slate-500">No leads right now.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l._id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{borrowerName(l)}</td>
                  <td className="px-4 py-2">{borrowerEmail(l)}</td>
                  <td className="px-4 py-2">{borrowerPhone(l)}</td>
                  <td className="px-4 py-2">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SalesPage() {
  return (
    <RequireRole allowed={["sales"]}>
      <Navbar />
      <SalesView />
    </RequireRole>
  );
}
