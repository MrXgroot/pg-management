import { useEffect, useRef } from "react";
import { ChevronLeft, X } from "lucide-react";

export function BottomSheet({
  isOpen,
  title,
  subtitle,
  onClose,
  onBack,
  children,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Bottom Sheet Dialog"}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface */}
      <div
        ref={sheetRef}
        className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-slate-200/80 bg-white shadow-2xl transition-transform"
      >
        {/* Drag handle pill */}
        <div className="flex w-full items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {subtitle && (
                <p className="text-xs font-medium text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Content body */}
        <div className="no-scrollbar overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
