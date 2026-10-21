import { Building2, ChevronDown } from "lucide-react";
import { useProperty } from "../context/PropertyContext.jsx";
import { useProperties } from "../data/structure/useProperties.js";

export function TopAppBar() {
  const { selectedPropertyId, selectProperty } = useProperty();
  const { data: properties = [], isLoading } = useProperties();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900">
          Stay Ledger
        </span>
      </div>

      <div className="relative">
        <label htmlFor="property-switcher" className="sr-only">
          Select Property
        </label>
        <div className="flex items-center">
          <select
            id="property-switcher"
            value={selectedPropertyId || ""}
            onChange={(e) => selectProperty(e.target.value)}
            disabled={isLoading || properties.length === 0}
            aria-label="Select Property"
            className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <option value="">Loading...</option>
            ) : properties.length === 0 ? (
              <option value="">No properties</option>
            ) : (
              properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="pointer-events-none -ml-6 h-3.5 w-3.5 text-slate-500" />
        </div>
      </div>
    </header>
  );
}
