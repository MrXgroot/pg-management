import { useState } from "react";
import { Building2, Layers, Plus } from "lucide-react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useOccupancy } from "../../data/occupancy/useOccupancy.js";
import { FloorAccordion } from "./components/FloorAccordion.jsx";
import { AddStructureModal } from "./components/AddStructureModal.jsx";
import { CreatePropertyModal } from "./components/CreatePropertyModal.jsx";

export function ManageStructureScreen() {
  const { selectedPropertyId } = useProperty();
  const {
    data: occupancy,
    isLoading,
    isError,
    error,
  } = useOccupancy(selectedPropertyId);

  // Modal State: null | { mode: 'FLOOR' | 'ROOM' | 'BED', contextData: object }
  const [modalConfig, setModalConfig] = useState(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  if (!selectedPropertyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <h2 className="text-sm font-bold text-slate-800">
          No Property Selected
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Select or create a property to manage structure.
        </p>
        <button
          type="button"
          onClick={() => setIsPropertyModalOpen(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 active:scale-95"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Add First Property</span>
        </button>

        <CreatePropertyModal
          isOpen={isPropertyModalOpen}
          onClose={() => setIsPropertyModalOpen(false)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2 animate-pulse">
        <div className="h-14 w-full rounded-2xl bg-slate-200" />
        <div className="h-28 w-full rounded-2xl bg-slate-200" />
        <div className="h-28 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 py-12 text-center">
        <h3 className="text-sm font-bold text-rose-800">
          Failed to load structure
        </h3>
        <p className="mt-1 text-xs text-rose-600">
          {error?.message || "Please check connection and retry."}
        </p>
      </div>
    );
  }

  const property = occupancy?.property;
  const floors = occupancy?.floors || [];

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Page Title & Dual Action Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-base font-bold text-slate-900 block">
            {property?.name || "Property Structure"}
          </span>
          <p className="mt-0.5 text-xs text-slate-500">
            {floors.length} {floors.length === 1 ? "Floor" : "Floors"}{" "}
            configured
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPropertyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 active:scale-95"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span>New Property</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setModalConfig({
                mode: "FLOOR",
                contextData: { currentFloorCount: floors.length },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Floor</span>
          </button>
        </div>
      </div>

      {/* Floors Accordion List */}
      {floors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            No Floors Configured
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Add a floor to begin configuring rooms and bed inventories.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {floors.map((floor) => (
            <FloorAccordion
              key={floor.id}
              floor={floor}
              propertyId={selectedPropertyId}
              onAddRoom={(targetFloor) =>
                setModalConfig({
                  mode: "ROOM",
                  contextData: { floor: targetFloor },
                })
              }
              onAddBed={(targetRoom) =>
                setModalConfig({
                  mode: "BED",
                  contextData: { room: targetRoom },
                })
              }
            />
          ))}
        </div>
      )}

      {/* Structure Modal Controller */}
      <AddStructureModal
        isOpen={Boolean(modalConfig)}
        mode={modalConfig?.mode}
        contextData={modalConfig?.contextData}
        propertyId={selectedPropertyId}
        onClose={() => setModalConfig(null)}
      />

      {/* Property Modal Controller */}
      <CreatePropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
      />
    </div>
  );
}
