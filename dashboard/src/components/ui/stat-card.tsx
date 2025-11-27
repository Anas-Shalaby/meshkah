import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardVariant = "neutral" | "positive" | "attention";
type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  delta?: {
    value: string;
    trend?: Trend;
  };
  variant?: StatCardVariant;
  footer?: ReactNode;
  compact?: boolean;
}

const variantClasses: Record<StatCardVariant, string> = {
  neutral: "bg-slate-900 text-slate-100",
  positive: "bg-emerald-900/30 text-emerald-200",
  attention: "bg-amber-900/30 text-amber-200",
};

export function StatCard({
  label,
  value,
  description,
  icon,
  delta,
  variant = "neutral",
  footer,
  compact = false,
}: StatCardProps) {
  const renderDeltaIcon = () => {
    if (!delta?.trend || delta.trend === "neutral") return null;
    return delta.trend === "up" ? (
      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
    ) : (
      <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" aria-hidden />
    );
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800/70 p-5 transition-all duration-200 hover:shadow-card",
        compact ? "min-h-[140px]" : "min-h-[160px]",
        variantClasses[variant] || variantClasses.neutral
      )}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-100">
            {icon}
          </div>
        ) : null}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-300">{label}</p>
            {delta?.value ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-200">
                {renderDeltaIcon()}
                {delta.value}
              </span>
            ) : null}
          </div>
          <div className="text-2xl font-semibold text-slate-100">{value}</div>
          {description ? (
            <p className="text-sm leading-relaxed text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {footer ? (
        <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export default StatCard;
