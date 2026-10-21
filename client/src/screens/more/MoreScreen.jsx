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
        sum + f.rooms?.reduce((rSum, r) => rSum + (r.beds?.length || 0), 0),
      0,
    ) || 0;

  if (!selectedPropertyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <h2 className="text-sm font-bold text-slate-800">
          No Property Selected
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Select a property in the header above to inspect configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <PropertyDetailsCard
        property={activeProperty}
        totalFloors={totalFloors}
        totalBeds={totalBeds}
      />

      <PolicySettingsCard />

      <ExportDataSection
        occupancy={occupancy}
        propertyName={activeProperty?.name}
      />

      <SystemInfoCard />
    </div>
  );
}
