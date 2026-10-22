import { Bed } from "lucide-react";
import { RoomCard } from "./RoomCard.jsx";

export function RoomGrid({ rooms = [], onSelectRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-300 bg-white/50 py-12 text-center backdrop-blur-sm dark:border-neutral-800 dark:bg-[#16171C]/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500">
          <Bed className="h-6 w-6 stroke-[1.8]" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700 dark:text-neutral-200">
          No rooms on this floor
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-neutral-500">
          Add rooms in the structure manager.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onClick={onSelectRoom} />
      ))}
    </div>
  );
}
