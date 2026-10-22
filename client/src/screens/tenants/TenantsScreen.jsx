import { useState } from "react";
import { Building2, Users } from "lucide-react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useTenantDirectory } from "../../data/tenants/useTenantDirectory.js";
import { TenantSearchBar } from "./components/TenantSearchBar.jsx";
import { TenantFilterTabs } from "./components/TenantFilterTabs.jsx";
import { TenantList } from "./components/TenantList.jsx";
import { BottomSheet } from "../../components/BottomSheet.jsx";
import { TenantLedgerView } from "../dashboard/sheets/TenantLedgerView.jsx";
import { TENANT_STATUS } from "../../shared/constants.js";

export function TenantsScreen() {
  const { selectedPropertyId } = useProperty();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(TENANT_STATUS.ACTIVE);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  const {
    data: tenants = [],
    isLoading,
    isError,
    error,
  } = useTenantDirectory({
    propertyId: selectedPropertyId,
    status,
    search: search.trim() || undefined,
    paymentStatus: paymentStatus || undefined,
  });

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
          Select a property in the header above to view tenant directory.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 px-1 py-1 select-none">
      {/* Search Input Bar */}
      <TenantSearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch("")}
      />

      {/* Segmented Occupancy Toggle & Horizontal Payment Filter Chips */}
      <TenantFilterTabs
        status={status}
        onStatusChange={setStatus}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
        totalCount={tenants.length}
      />

      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
            Occupant Directory
          </span>
          <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-neutral-800/80 dark:text-neutral-400">
            {tenants.length} {tenants.length === 1 ? "Tenant" : "Tenants"}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
          Tap card for statement
        </span>
      </div>

      {/* Tenant Directory Stream */}
      <TenantList
        tenants={tenants}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onSelectTenant={(tenant) => setSelectedTenant(tenant)}
      />

      {/* Screen-Owned Bottom Sheet for Tenant Statement Drilldown */}
      <BottomSheet
        isOpen={Boolean(selectedTenant)}
        title="Tenant Statement"
        subtitle={selectedTenant?.name}
        onClose={() => setSelectedTenant(null)}
      >
        {selectedTenant && <TenantLedgerView tenantId={selectedTenant.id} />}
      </BottomSheet>
    </div>
  );
}
