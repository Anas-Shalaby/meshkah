import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  dateLabel?: string;
  status: "complete" | "current" | "upcoming";
}

interface TimelineStepperProps {
  steps?: TimelineStep[];
}

export function TimelineStepper({ steps = [] }: TimelineStepperProps) {
  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4 lg:gap-6">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex flex-1 flex-col">
            <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                  step.status === "complete" &&
                    "border-emerald-400 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/20",
                  step.status === "current" &&
                    "border-primary bg-primary/20 text-primary shadow-lg shadow-primary/30 ring-2 ring-primary/20",
                  step.status === "upcoming" &&
                    "border-slate-700 bg-slate-900 text-slate-500"
                )}
              >
                {index + 1}
              </div>
              <div className="flex flex-1 flex-col sm:mt-3">
                <span className="text-sm font-semibold text-slate-100">
                  {step.label}
                </span>
                {step.dateLabel ? (
                  <span className="mt-1 text-xs text-slate-400">
                    {step.dateLabel}
                  </span>
                ) : null}
              </div>
            </div>
            {!isLast ? (
              <span className="mr-5 mt-3 hidden h-[2px] flex-1 bg-gradient-to-l from-slate-700 via-slate-600 to-slate-700 sm:block lg:mt-5" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default TimelineStepper;
