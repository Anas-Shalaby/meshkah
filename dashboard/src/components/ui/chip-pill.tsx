import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipPillVariant = "default" | "success" | "warning" | "neutral";

interface ChipPillProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ChipPillVariant;
  className?: string;
}

const pillClasses: Record<ChipPillVariant, string> = {
  default: "bg-slate-800 text-slate-200",
  success: "bg-emerald-900/30 text-emerald-200",
  warning: "bg-amber-900/30 text-amber-200",
  neutral: "bg-slate-700 text-slate-200",
};

export function ChipPill({
  children,
  icon,
  variant = "default",
  className,
}: ChipPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        pillClasses[variant] || pillClasses.default,
        className
      )}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}

export default ChipPill;
