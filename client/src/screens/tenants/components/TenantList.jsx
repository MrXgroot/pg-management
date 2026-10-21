import { Users } from "lucide-react";
import { TenantCard } from "./TenantCard.jsx";

export function TenantList({
  tenants = [],
  isLoading,
  isError,
  error,
  onSelectTenant,
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-1 animate-pulse">
        <div className="h-28 w-full rounded-2xl bg-slate-200" />
        <div className="h-28 w-full rounded-2xl bg-slate-200" />
        <div className="h-28 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 py-12 text-center">
        <h3 className="text-sm font-bold text-rose-800">
          Failed to load tenants
        </h3>
        <p className="mt-1 text-xs text-rose-600">
          {error?.message || "Please check your connection and retry."}
        </p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-800">
          No occupants found
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          No records match your selected search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tenants.map((tenant) => (
        <TenantCard key={tenant.id} tenant={tenant} onClick={onSelectTenant} />
      ))}
    </div>
  );
}
