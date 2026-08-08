export default function StepIndicator({ current }: { current: number }) {
  const steps = ["Sign Up", "Personal Details", "Salary Slip", "Loan Config"];
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const active = stepNum === current;
        const done = stepNum < current;
        return (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                done ? "bg-slate-900 text-white" : active ? "bg-slate-200 font-semibold" : "bg-slate-100 text-slate-400"
              }`}
            >
              {stepNum}
            </span>
            <span className={active ? "font-medium text-slate-900" : "text-slate-400"}>{s}</span>
            {stepNum < steps.length && <span className="mx-1 text-slate-300">—</span>}
          </div>
        );
      })}
    </div>
  );
}
