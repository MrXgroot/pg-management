import { useState } from "react";
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <h2 className="text-sm font-bold text-slate-800">
          No Property Selected
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Select a property in the header above to view tenant directory.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <TenantSearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch("")}
      />

      <TenantFilterTabs
        status={status}
        onStatusChange={setStatus}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
      />

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
