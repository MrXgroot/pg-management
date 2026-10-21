import { RoomCard } from "./RoomCard.jsx";

export function RoomGrid({ rooms = [], onSelectRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <p className="text-sm font-medium text-slate-600">
          No rooms on this floor
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Add rooms in the structure manager.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onClick={onSelectRoom} />
      ))}
    </div>
  );
}
