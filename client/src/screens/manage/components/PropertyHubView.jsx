import { Building2, ChevronRight, Plus, MapPin } from "lucide-react";

export function PropertyHubView({
  properties = [],
  activePropertyId,
  onSelectProperty,
  onOpenCreateModal,
}) {
  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-4 px-1 py-1 select-none">
      {/* Hub Top Bar Banner */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E64720] via-[#FF5E36] to-[#FF7A59] text-white shadow-[0_10px_25px_-4px_rgba(255,94,54,0.38)]">
            <Building2 className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                Property Hub
              </h1>
              <span className="rounded-full border border-[#FF5E36]/25 bg-[#FF5E36]/10 px-2 py-0.5 text-[9px] font-extrabold text-[#E64720] dark:text-[#FF7A59]">
                {properties.length}{" "}
                {properties.length === 1 ? "BRANCH" : "BRANCHES"}
              </span>
            </div>
            <p className="mt-1 flex items-center space-x-1 text-[11px] font-semibold text-slate-400 dark:text-neutral-500">
              <MapPin className="h-3 w-3 text-[#FF5E36]" />
              <span>Select or configure active branch</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="spring-press flex items-center space-x-1 rounded-2xl bg-[#FF5E36] px-3 py-2 text-xs font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
          Your Properties
        </span>
        <span className="text-xs font-bold text-slate-400">
          Tap card to manage layout
        </span>
      </div>

      {/* Property Cards List */}
      <div className="flex flex-col space-y-3">
        {properties.map((prop) => {
          const isSelected = prop.id === activePropertyId;
          const floorCount = prop.floors?.length ?? 0;
          const bedCount =
            prop.floors?.reduce((acc, f) => {
              return (
                acc +
                (f.rooms?.reduce(
                  (rAcc, r) => rAcc + (r.beds?.length || 0),
                  0,
                ) || 0)
              );
            }, 0) ?? 0;

          return (
            <div
              key={prop.id}
              onClick={() => onSelectProperty(prop.id)}
              className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[28px] border bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] transition-all hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.10)] active:scale-[0.98] dark:bg-[#16171C] ${
                isSelected
                  ? "border-[#FF5E36]/50 ring-1 ring-[#FF5E36]/30 dark:border-[#FF5E36]/40"
                  : "border-slate-200/90 dark:border-neutral-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black transition-colors ${
                      isSelected
                        ? "bg-[#FF5E36] text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)]"
                        : "border border-slate-200/80 bg-slate-100 text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-[#FF5E36] dark:text-white">
                        {prop.name}
                      </h3>
                      {isSelected && (
                        <span className="rounded-md border border-emerald-500/25 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Active Branch
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                      {prop.address || "Bengaluru, Karnataka"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tinted Bottom Strip */}
              <div className="-mx-4 -mb-4 mt-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs dark:border-neutral-800/80 dark:bg-neutral-900/40">
                <div className="flex items-center space-x-2 font-bold text-slate-500 dark:text-neutral-400">
                  <span>{floorCount} Floors</span>
                  <span>•</span>
                  <span>{bedCount} Beds</span>
                </div>

                <div className="flex items-center space-x-1 font-extrabold text-slate-900 dark:text-white">
                  <span>Manage</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] text-[#FF5E36]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
