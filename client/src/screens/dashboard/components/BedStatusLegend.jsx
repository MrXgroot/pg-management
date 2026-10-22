export function BedStatusLegend() {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-slate-200/80 bg-white px-3.5 py-2 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
      <div className="flex items-center space-x-1.5">
        <span className="h-2.5 w-2.5 rounded-xs border border-slate-300 bg-white dark:border-neutral-600 dark:bg-neutral-800" />
        <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400">
          Empty
        </span>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 shadow-xs" />
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          Paid
        </span>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 shadow-xs" />
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
          Unpaid
        </span>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="h-2.5 w-2.5 rounded-xs bg-slate-300 dark:bg-neutral-700" />
        <span className="text-[10px] font-bold text-slate-400">Disabled</span>
      </div>
    </div>
  );
}
