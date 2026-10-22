import { Building2 } from "lucide-react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useProperties } from "../../data/structure/useProperties.js";
import { useOccupancy } from "../../data/occupancy/useOccupancy.js";
import { PropertyDetailsCard } from "./components/PropertyDetailsCard.jsx";
import { PolicySettingsCard } from "./components/PolicySettingsCard.jsx";
import { ExportDataSection } from "./components/ExportDataSection.jsx";
import { SystemInfoCard } from "./components/SystemInfoCard.jsx";

export function MoreScreen() {
  const { selectedPropertyId } = useProperty();
  const { data: properties = [] } = useProperties();
  const { data: occupancy } = useOccupancy(selectedPropertyId);

  const activeProperty =
    properties.find((p) => p.id === selectedPropertyId) || occupancy?.property;

  const totalFloors = occupancy?.floors?.length || 0;
  const totalBeds =
    occupancy?.floors?.reduce(
      (sum, f) =>
        sum +
        (f.rooms?.reduce((rSum, r) => rSum + (r.beds?.length || 0), 0) || 0),
      0,
    ) || 0;

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
          Select a property in the header above to inspect configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 px-1 py-1 select-none pb-8">
      {/* 1. Branch Identity & Quick Metrics */}
      <PropertyDetailsCard
        property={activeProperty}
        totalFloors={totalFloors}
        totalBeds={totalBeds}
      />

      {/* 2. Billing & Cycle Policies */}
      <PolicySettingsCard />

      {/* 3. CSV Roster Exporter */}
      <ExportDataSection
        occupancy={occupancy}
        propertyName={activeProperty?.name}
      />

      {/* 4. Cache & Version Tool */}
      <SystemInfoCard />
    </div>
  );
}
