import { useState } from "react";
import { ChevronDown, ChevronRight, Layers, Plus } from "lucide-react";
import { RoomStructureRow } from "./RoomStructureRow.jsx";

export function FloorAccordion({ floor, propertyId, onAddRoom, onAddBed }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const rooms = floor?.rooms || [];
  const totalBeds = rooms.reduce((acc, r) => acc + (r.beds?.length || 0), 0);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition">
      {/* Floor Header Bar */}
      <div className="flex items-center justify-between p-3.5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {floor.name}
              </span>
              <span className="text-xs text-slate-400">
                Order: #{floor.displayOrder}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              {rooms.length} {rooms.length === 1 ? "Room" : "Rooms"} •{" "}
              {totalBeds} Beds Capacity
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAddRoom(floor)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-100 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Room</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse floor" : "Expand floor"}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Room List */}
      {isExpanded && (
        <div className="flex flex-col gap-2.5 border-t border-slate-100 p-3.5 pt-2">
          {rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center">
              <p className="text-xs font-semibold text-slate-600">
                No rooms on this floor
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Click "+ Add Room" to create the first room.
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomStructureRow
                key={room.id}
                room={room}
                propertyId={propertyId}
                onAddBed={onAddBed}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
