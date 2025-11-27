import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface FilterDrawerProps {
  title?: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FilterDrawer({
  title,
  description,
  open,
  onClose,
  footer,
  children,
  className,
}: FilterDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-40 flex justify-end text-slate-100">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative flex h-full w-full max-w-sm flex-col rounded-s-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl",
          className
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="إغلاق التصفية"
            onClick={onClose}
            className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="thin-scrollbar mt-6 flex-1 space-y-6 overflow-y-auto pe-2">
          {children}
        </div>
        {footer ? <footer className="mt-6">{footer}</footer> : null}
      </aside>
    </div>
  );

  return typeof window === "undefined"
    ? null
    : createPortal(content, document.body);
}

export default FilterDrawer;
