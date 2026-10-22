export function FloorSelector({ floors = [], selectedFloorId, onSelectFloor }) {
  if (floors.length === 0) return null;

  const activeFloor = floors.find((f) => f.id === selectedFloorId) || floors[0];

  const totalVacantOnFloor = activeFloor?.vacantBeds ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
            Select Floor
          </span>
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-neutral-800 dark:text-white">
            {floors.length} {floors.length === 1 ? "Floor" : "Floors"}
          </span>
        </div>
        <span className="text-xs font-bold text-[#E64720] dark:text-[#FF7A59]">
          {totalVacantOnFloor > 0
            ? `${totalVacantOnFloor} Vacant on ${activeFloor?.name}`
            : `${activeFloor?.name} Fully Occupied`}
        </span>
      </div>

      <div className="no-scrollbar -mx-1 flex items-center space-x-2 overflow-x-auto px-1 py-0.5">
        {floors.map((floor) => {
          const isSelected = floor.id === selectedFloorId;
          const hasVacancy = (floor.vacantBeds ?? 0) > 0;

          return (
            <button
              key={floor.id}
              type="button"
              onClick={() => onSelectFloor(floor.id)}
              className={`spring-press flex shrink-0 items-center space-x-1.5 rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_6px_16px_-2px_rgba(15,23,42,0.35)] dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200/90 bg-white text-slate-700 shadow-xs dark:border-neutral-800 dark:bg-[#16171C] dark:text-neutral-300"
              }`}
            >
              <span>{floor.name}</span>
              {hasVacancy && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-[#FF7A59]" : "bg-emerald-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
