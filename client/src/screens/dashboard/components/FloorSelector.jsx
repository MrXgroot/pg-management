export function FloorSelector({ floors = [], selectedFloorId, onSelectFloor }) {
  if (floors.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
      {floors.map((floor) => {
        const isSelected = floor.id === selectedFloorId;
        const totalBeds =
          floor.rooms?.reduce((acc, r) => acc + (r.beds?.length || 0), 0) || 0;
        const occupiedBeds =
          floor.rooms?.reduce(
            (acc, r) =>
              acc +
              (r.beds?.filter((b) => b.status === "OCCUPIED").length || 0),
            0,
          ) || 0;

        return (
          <button
            key={floor.id}
            type="button"
            onClick={() => onSelectFloor(floor.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              isSelected
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span>{floor.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isSelected
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {occupiedBeds}/{totalBeds}
            </span>
          </button>
        );
      })}
    </div>
  );
}
