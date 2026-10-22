import { AlertCircle, Users } from "lucide-react";
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
      <div className="flex flex-col space-y-3 py-1 animate-pulse">
        <div className="h-28 w-full rounded-[24px] bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="h-28 w-full rounded-[24px] bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="h-28 w-full rounded-[24px] bg-slate-200/80 dark:bg-neutral-800/80" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border border-rose-200/80 bg-rose-50/70 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
          <AlertCircle className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h3 className="mt-3 text-sm font-black tracking-tight text-rose-900 dark:text-rose-200">
          Failed to load tenants
        </h3>
        <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error?.message || "Please check your connection and retry."}
        </p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-300/80 bg-white/50 py-16 text-center backdrop-blur-sm dark:border-neutral-800 dark:bg-[#16171C]/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500">
          <Users className="h-6 w-6 stroke-[1.8]" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-neutral-200">
          No occupants found
        </h3>
        <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-neutral-500">
          No records match your selected search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {tenants.map((tenant) => (
        <TenantCard key={tenant.id} tenant={tenant} onClick={onSelectTenant} />
      ))}
    </div>
  );
}
