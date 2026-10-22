import { useState, useEffect } from "react";
import { AlertCircle, Building2, ChevronRight } from "lucide-react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useOccupancy } from "../../data/occupancy/useOccupancy.js";
import { CycleObligationsCard } from "./components/CycleObligationsCard.jsx";
import { MinimalMetricsCapsule } from "./components/MinimalMetricsCapsule.jsx";
import { FloorSelector } from "./components/FloorSelector.jsx";
import { BedStatusLegend } from "./components/BedStatusLegend.jsx";
import { RoomGrid } from "./components/RoomGrid.jsx";
import { DashboardBottomSheet } from "./sheets/DashboardBottomSheet.jsx";

export function DashboardScreen() {
  const { selectedPropertyId } = useProperty();
  const {
    data: occupancy,
    isLoading,
    isError,
    error,
  } = useOccupancy(selectedPropertyId);

  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const floors = occupancy?.floors || [];
  const summary = occupancy?.summary || {};

  // Floor selector auto-sync
  useEffect(() => {
    if (floors.length > 0) {
      const stillValid = floors.some((floor) => floor.id === selectedFloorId);
      if (!stillValid) {
        setSelectedFloorId(floors[0].id);
      }
    } else {
      setSelectedFloorId(null);
    }
  }, [floors, selectedFloorId]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 py-2 animate-pulse">
        <div className="h-44 w-full rounded-[32px] bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="h-14 w-full rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="h-10 w-full rounded-2xl bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
          <div className="h-32 rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center justify-center rounded-[32px] border border-rose-200/80 bg-rose-50/70 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
          <AlertCircle className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h2 className="mt-3 text-sm font-black tracking-tight text-rose-900 dark:text-rose-200">
          Failed to load property occupancy
        </h2>
        <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error?.message || "Please check connection or retry later."}
        </p>
      </div>
    );
  }

  if (!selectedPropertyId) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center backdrop-blur-md dark:border-neutral-800 dark:bg-[#16171C]/60">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500">
          <Building2 className="h-7 w-7 stroke-[1.8]" />
        </div>
        <h2 className="mt-3 text-base font-black tracking-tight text-slate-800 dark:text-neutral-200">
          No Property Selected
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
          Select a property in the header above to begin.
        </p>
      </div>
    );
  }

  const activeFloor =
    floors.find((floor) => floor.id === selectedFloorId) || floors[0];
  const activeRooms = activeFloor?.rooms || [];

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 px-1 py-1 select-none">
      {/* 1. Cycle Rent Obligations Card */}
      <CycleObligationsCard summary={summary} />

      {/* 2. Minimal Metrics Capsule (Members • Unpaid • Occupancy) */}
      <MinimalMetricsCapsule summary={summary} />

      {/* 3. Floor Selector Pill Rail */}
      <FloorSelector
        floors={floors}
        selectedFloorId={selectedFloorId}
        onSelectFloor={setSelectedFloorId}
      />

      {/* 4. Color Indicator Legend */}
      <BedStatusLegend />

      {/* 5. Rooms Section Header */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
            Rooms Overview
          </span>
          <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-neutral-800/80 dark:text-neutral-400">
            {activeRooms.length} Rooms
          </span>
        </div>
        <span className="flex items-center text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
          Tap card to manage
          <ChevronRight className="ml-0.5 h-3.5 w-3.5 text-slate-400" />
        </span>
      </div>

      {/* 6. 2-Column Room Grid */}
      <RoomGrid rooms={activeRooms} onSelectRoom={setSelectedRoom} />

      {/* 7. Sheet Navigation Flow */}
      <DashboardBottomSheet
        selectedRoom={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        propertyId={selectedPropertyId}
        floors={floors}
      />
    </div>
  );
}
