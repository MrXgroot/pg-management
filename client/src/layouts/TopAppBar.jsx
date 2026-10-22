import { useState, useEffect } from "react";
import { Building2, ChevronDown, Moon, Sun } from "lucide-react";
import { useProperty } from "../context/PropertyContext.jsx";
import { useProperties } from "../data/structure/useProperties.js";

export function TopAppBar() {
  const { selectedPropertyId, selectProperty } = useProperty();
  const { data: properties = [], isLoading } = useProperties();

  // Dark/Light mode state initialized from document root or localStorage
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark"
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-[#F1F4F9]/90 px-4 py-2.5 backdrop-blur-md transition-colors dark:bg-[#111215]/90">
      {/* Brand & Property Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E64720] via-[#FF5E36] to-[#FF7A59] text-white shadow-[0_10px_25px_-4px_rgba(255,94,54,0.38)] ring-2 ring-white/60 dark:ring-white/10">
          <Building2 className="h-5 w-5 stroke-[2.2]" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 transition-colors dark:text-white">
              {selectedProperty?.name || "Stay Ledger"}
            </h1>
            <span className="inline-flex items-center rounded-full border border-[#FF5E36]/25 bg-[#FF5E36]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#E64720] dark:text-[#FF7A59]">
              PRO
            </span>
          </div>

          {/* Quick Property Switcher Trigger */}
          <div className="relative mt-0.5 flex items-center">
            <label htmlFor="property-switcher" className="sr-only">
              Select Property
            </label>
            <select
              id="property-switcher"
              value={selectedPropertyId || ""}
              onChange={(e) => selectProperty(e.target.value)}
              disabled={isLoading || properties.length === 0}
              aria-label="Select Property"
              className="cursor-pointer appearance-none bg-transparent pr-4 text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {isLoading ? (
                <option value="">Loading properties...</option>
              ) : properties.length === 0 ? (
                <option value="">No properties available</option>
              ) : (
                properties.map((property) => (
                  <option
                    key={property.id}
                    value={property.id}
                    className="bg-white text-slate-800 dark:bg-[#16171C] dark:text-white"
                  >
                    Switch: {property.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="pointer-events-none -ml-3.5 h-3 w-3 text-slate-400 dark:text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Right Controls: Theme Toggle & Profile Avatar */}
      <div className="flex items-center space-x-2">
        {/* Dark/Light Mode Spring Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-700 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.06)] transition-all duration-150 active:scale-95 dark:border-neutral-800 dark:bg-[#1A1C20] dark:text-neutral-300"
        >
          {isDark ? (
            <Sun className="h-4 w-4 stroke-[2.2] text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 stroke-[2.2] text-slate-700" />
          )}
        </button>

        {/* Manager Avatar Badge */}
        <div className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-xs font-black text-white shadow-[0_4px_16px_-2px_rgba(15,23,42,0.06)] ring-2 ring-white transition-transform active:scale-95 dark:ring-neutral-800">
          <span>SL</span>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#111215]" />
        </div>
      </div>
    </header>
  );
}
