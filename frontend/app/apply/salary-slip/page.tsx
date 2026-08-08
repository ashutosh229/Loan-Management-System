"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import Navbar from "@/components/Navbar";
import StepIndicator from "@/components/StepIndicator";
import { apiFetch, ApiError } from "@/lib/api";
import { Loan } from "@/lib/types";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function SalarySlipForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are accepted.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    const formData = new FormData();
    formData.append("salarySlip", file);

    setSubmitting(true);
    try {
      await apiFetch<{ loan: Loan }>("/applications/salary-slip", {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      router.push("/apply/loan-config");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <StepIndicator current={3} />
      <h1 className="mb-1 text-xl font-semibold">Upload Salary Slip</h1>
      <p className="mb-6 text-sm text-slate-500">PDF, JPG, or PNG — max {MAX_SIZE_MB} MB.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {fileName && <p className="text-xs text-slate-500">Selected: {fileName}</p>}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Uploading…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default function SalarySlipPage() {
  return (
    <RequireRole allowed={["borrower"]}>
      <Navbar />
      <SalarySlipForm />
    </RequireRole>
  );
}
