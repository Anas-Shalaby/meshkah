import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActionToolbarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  endSlot?: ReactNode;
  className?: string;
}

export function ActionToolbar({
  title,
  subtitle,
  meta,
  primaryAction,
  secondaryActions,
  endSlot,
  className,
}: ActionToolbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/95 px-6 py-4 shadow-toolbar backdrop-blur-md",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-slate-300">{subtitle}</p>
          ) : null}
        </div>
        {meta ? (
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-400">
            {meta}
          </div>
        ) : null}
      </div>
      {(primaryAction || secondaryActions || endSlot) && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {primaryAction}
            {secondaryActions}
          </div>
          {endSlot ? <div className="ml-auto">{endSlot}</div> : null}
        </div>
      )}
    </header>
  );
}

export default ActionToolbar;
