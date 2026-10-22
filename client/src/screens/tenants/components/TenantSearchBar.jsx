import { Search, X } from "lucide-react";

export function TenantSearchBar({ value, onChange, onClear }) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500">
        <Search className="h-4 w-4 stroke-[2.2]" />
      </div>

      <input
        type="text"
        placeholder="Search occupant by name or phone..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-10 text-xs font-bold text-slate-900 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04)] transition-all placeholder:text-slate-400 focus:border-[#FF5E36] focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-[#16171C] dark:text-white dark:placeholder:text-neutral-500"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="spring-press absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
