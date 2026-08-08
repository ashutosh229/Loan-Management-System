"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import StepIndicator from "@/components/StepIndicator";
import { apiFetch, ApiError } from "@/lib/api";
import { PAN_REGEX, calculateAge } from "@/lib/bre";
import { EmploymentMode, Loan } from "@/lib/types";

function PersonalDetailsForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    pan: "",
    dob: "",
    monthlySalary: "",
    employmentMode: "" as EmploymentMode | "",
  });
  const [reasons, setReasons] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const age = calculateAge(form.dob);
  const panLooksValid = form.pan ? PAN_REGEX.test(form.pan.toUpperCase()) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setReasons([]);
    setSubmitting(true);
    try {
      await apiFetch<{ loan: Loan }>("/applications/personal-details", {
        method: "POST",
        body: {
          ...form,
          monthlySalary: Number(form.monthlySalary),
        },
      });
      router.push("/apply/salary-slip");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.reasons) setReasons(err.reasons);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <StepIndicator current={2} />
      <h1 className="mb-1 text-xl font-semibold">Personal Details</h1>
      <p className="mb-6 text-sm text-slate-500">
        We run an automated eligibility check (BRE) on these details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PAN</label>
          <input
            required
            placeholder="ABCDE1234F"
            value={form.pan}
            onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm uppercase"
          />
          {!panLooksValid && (
            <p className="mt-1 text-xs text-amber-600">Format should look like ABCDE1234F.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Date of Birth</label>
          <input
            type="date"
            required
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          {form.dob && (Number.isNaN(age) || age < 23 || age > 50) && (
            <p className="mt-1 text-xs text-amber-600">Age must be between 23 and 50 (currently {age}).</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Monthly Salary (₹)</label>
          <input
            type="number"
            required
            min={0}
            value={form.monthlySalary}
            onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          {form.monthlySalary && Number(form.monthlySalary) < 25000 && (
            <p className="mt-1 text-xs text-amber-600">Must be at least ₹25,000/month.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Employment Mode</label>
          <select
            required
            value={form.employmentMode}
            onChange={(e) => setForm({ ...form, employmentMode: e.target.value as EmploymentMode })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            <option value="Salaried">Salaried</option>
            <option value="Self-Employed">Self-Employed</option>
            <option value="Unemployed">Unemployed</option>
          </select>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">{error}</p>
            {reasons.length > 0 && (
              <ul className="mt-1 list-inside list-disc">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Checking eligibility…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default function PersonalDetailsPage() {
  return (
    <RequireRole allowed={["borrower"]}>
      <Navbar />
      <PersonalDetailsForm />
    </RequireRole>
  );
}
