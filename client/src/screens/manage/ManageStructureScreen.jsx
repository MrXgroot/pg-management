import { useState } from "react";
import { Building2, AlertCircle } from "lucide-react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useProperties } from "../../data/structure/useProperties.js";
import { useOccupancy } from "../../data/occupancy/useOccupancy.js";
import { PropertyHubView } from "./components/PropertyHubView.jsx";
import { PropertyDetailView } from "./components/PropertyDetailView.jsx";
import { AddRoomSheet } from "./components/AddRoomSheet.jsx";
import { AddFloorSheet } from "./components/AddFloorSheet.jsx";
import { AddSingleBedSheet } from "./components/AddSingleBedSheet.jsx";
import { CreatePropertySheet } from "./components/CreatePropertySheet.jsx";

export function ManageStructureScreen() {
  const { selectedPropertyId, selectProperty } = useProperty();
  const { data: properties = [], isLoading: isPropertiesLoading } =
    useProperties();

  const {
    data: occupancy,
    isLoading: isOccupancyLoading,
    isError,
    error,
  } = useOccupancy(selectedPropertyId);

  // View state: "HUB" (all branches) | "DETAIL" (floor & room manager)
  const [currentView, setCurrentView] = useState("DETAIL");

  // Bottom Sheet Controller States
  const [isCreatePropOpen, setIsCreatePropOpen] = useState(false);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [activeFloorForRoom, setActiveFloorForRoom] = useState(null);
  const [activeRoomForBed, setActiveRoomForBed] = useState(null);

  const isLoading =
    isPropertiesLoading || (Boolean(selectedPropertyId) && isOccupancyLoading);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 py-3 animate-pulse">
        <div className="h-14 w-full rounded-[28px] bg-slate-200 dark:bg-neutral-800" />
        <div className="h-20 w-full rounded-[28px] bg-slate-200 dark:bg-neutral-800" />
        <div className="h-40 w-full rounded-[28px] bg-slate-200 dark:bg-neutral-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center justify-center rounded-[32px] border border-rose-200 bg-rose-50/70 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
          <AlertCircle className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h3 className="mt-3 text-sm font-black text-rose-900 dark:text-rose-200">
          Failed to load property structure
        </h3>
        <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error?.message || "Please check connection and retry."}
        </p>
      </div>
    );
  }

  // Zero-property fallback state
  if (!selectedPropertyId && properties.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center backdrop-blur-md dark:border-neutral-800 dark:bg-[#16171C]/60">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500">
          <Building2 className="h-7 w-7 stroke-[1.8]" />
        </div>
        <h2 className="mt-3 text-base font-black tracking-tight text-slate-800 dark:text-neutral-200">
          No Properties Configured
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
          Add your first property branch to start configuring floors and beds.
        </p>
        <button
          type="button"
          onClick={() => setIsCreatePropOpen(true)}
          className="spring-press mt-4 inline-flex items-center space-x-1.5 rounded-2xl bg-[#FF5E36] px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)]"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Add Property</span>
        </button>

        <CreatePropertySheet
          isOpen={isCreatePropOpen}
          onClose={() => setIsCreatePropOpen(false)}
        />
      </div>
    );
  }

  const property =
    occupancy?.property || properties.find((p) => p.id === selectedPropertyId);
  const floors = occupancy?.floors || [];

  return (
    <>
      {currentView === "HUB" ? (
        <PropertyHubView
          properties={properties}
          activePropertyId={selectedPropertyId}
          onSelectProperty={(propId) => {
            selectProperty(propId);
            setCurrentView("DETAIL");
          }}
          onOpenCreateModal={() => setIsCreatePropOpen(true)}
        />
      ) : (
        <PropertyDetailView
          property={property}
          floors={floors}
          propertyId={selectedPropertyId}
          onBackToHub={() => setCurrentView("HUB")}
          onOpenAddFloor={() => setIsAddFloorOpen(true)}
          onOpenAddRoom={(floor) => setActiveFloorForRoom(floor)}
          onOpenAddBed={(room) => setActiveRoomForBed(room)}
        />
      )}

      {/* 1. Add Room & Bed Capacity Stepper Bottom Sheet */}
      <AddRoomSheet
        isOpen={Boolean(activeFloorForRoom)}
        floor={activeFloorForRoom}
        propertyId={selectedPropertyId}
        onClose={() => setActiveFloorForRoom(null)}
      />

      {/* 2. Add Floor Bottom Sheet */}
      <AddFloorSheet
        isOpen={isAddFloorOpen}
        currentFloorCount={floors.length}
        propertyId={selectedPropertyId}
        onClose={() => setIsAddFloorOpen(false)}
      />

      {/* 3. Add Individual Bed Bottom Sheet */}
      <AddSingleBedSheet
        isOpen={Boolean(activeRoomForBed)}
        room={activeRoomForBed}
        propertyId={selectedPropertyId}
        onClose={() => setActiveRoomForBed(null)}
      />

      {/* 4. Create New Property Branch Bottom Sheet */}
      <CreatePropertySheet
        isOpen={isCreatePropOpen}
        onClose={() => setIsCreatePropOpen(false)}
      />
    </>
  );
}
