import { Power, UserPlus, Phone, ChevronRight } from "lucide-react";
import {
  formatPaiseToRupees,
  formatPhone,
} from "../../../shared/formatters.js";
import { useToggleBedActive } from "../../../data/structure/useBedMutations.js";

export function RoomBedsView({
  room,
  propertyId,
  onSelectOccupiedBed,
  onAssignTenant,
}) {
  const { mutate: toggleBedActive, isPending } = useToggleBedActive(propertyId);
  const beds = room?.beds || [];

  return (
    <div className="flex flex-col gap-3">
      {beds.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No beds configured in this room.
        </div>
      ) : (
        beds.map((bed) => {
          const isOccupied = bed.status === "OCCUPIED" && bed.tenant;
          const tenant = bed.tenant;
          const isInactive = !bed.isActive;

          return (
            <div
              key={bed.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
                isInactive
                  ? "border-slate-200 bg-slate-100/70 opacity-60"
                  : isOccupied
                    ? "border-slate-200/90 bg-white shadow-sm"
                    : "border-dashed border-emerald-300 bg-emerald-50/30"
              }`}
            >
              {/* Bed Label & State Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {bed.bedLabel}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isInactive
                        ? "bg-slate-200 text-slate-700"
                        : isOccupied
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isInactive
                      ? "Decommissioned"
                      : isOccupied
                        ? "Occupied"
                        : "Vacant"}
                  </span>
                </div>

                <button
                  type="button"
                  title={bed.isActive ? "Decommission bed" : "Reactivate bed"}
                  disabled={isPending}
                  onClick={() =>
                    toggleBedActive({
                      bedId: bed.id,
                      isActive: !bed.isActive,
                    })
                  }
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                    bed.isActive
                      ? "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                      : "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Occupied State */}
              {isOccupied && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      {tenant.name}
                    </span>
                    <a
                      href={`tel:${tenant.phone}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600"
                    >
                      <Phone className="h-3 w-3" />
                      {formatPhone(tenant.phone)}
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    {tenant.totalOutstandingPaise > 0 ? (
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-slate-400 block">
                          Due
                        </span>
                        <span className="text-xs font-bold text-rose-600">
                          {formatPaiseToRupees(tenant.totalOutstandingPaise)}
                        </span>
                      </div>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Paid
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectOccupiedBed(bed)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 active:scale-95"
                      aria-label="Manage Tenant"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Vacant State */}
              {!isOccupied && bed.isActive && (
                <button
                  type="button"
                  onClick={() => onAssignTenant(bed)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-98"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign Tenant
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
