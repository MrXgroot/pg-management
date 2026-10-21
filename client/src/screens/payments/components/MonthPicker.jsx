import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export function MonthPicker({ selectedDate, onChange }) {
  const dateObj = new Date(selectedDate);

  function handlePrevMonth() {
    const next = new Date(dateObj.getFullYear(), dateObj.getMonth() - 1, 1);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  }

  function handleNextMonth() {
    const next = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  }

  const displayMonth = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(dateObj);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-xs">
      <button
        type="button"
        onClick={handlePrevMonth}
        aria-label="Previous month"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
        <span>{displayMonth}</span>
      </div>

      <button
        type="button"
        onClick={handleNextMonth}
        aria-label="Next month"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
