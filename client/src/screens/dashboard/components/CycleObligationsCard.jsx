import { useMemo } from "react";
import { AlertCircle, IndianRupee, Users } from "lucide-react";
import { formatPaiseToRupees } from "../../../shared/formatters.js";

export function CycleObligationsCard({ floors = [] }) {
  const metrics = useMemo(() => {
    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalOutstandingPaise = 0;
    let totalOverduePaise = 0;

    for (const floor of floors) {
      for (const room of floor.rooms || []) {
        for (const bed of room.beds || []) {
          if (bed.isActive) {
            totalBeds += 1;
            if (bed.status === "OCCUPIED" && bed.tenant) {
              occupiedBeds += 1;
              totalOutstandingPaise += bed.tenant.totalOutstandingPaise || 0;
              totalOverduePaise += bed.tenant.overduePaise || 0;
            }
          }
        }
      }
    }

    return {
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      totalOutstandingPaise,
      totalOverduePaise,
    };
  }, [floors]);

  return (
    <section className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-3">
      <div className="flex flex-col justify-between rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="h-4 w-4" />
          <span className="text-xs font-medium">Occupancy</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">
            {metrics.occupiedBeds}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            / {metrics.totalBeds} beds
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-amber-50/60 p-3">
        <div className="flex items-center gap-2 text-amber-700">
          <IndianRupee className="h-4 w-4" />
          <span className="text-xs font-medium">Pending Dues</span>
        </div>
        <div className="mt-2 text-xl font-bold text-amber-900">
          {formatPaiseToRupees(metrics.totalOutstandingPaise)}
        </div>
      </div>

      <div className="col-span-2 flex flex-col justify-between rounded-xl bg-rose-50/60 p-3 sm:col-span-1">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Overdue</span>
        </div>
        <div className="mt-2 text-xl font-bold text-rose-900">
          {formatPaiseToRupees(metrics.totalOverduePaise)}
        </div>
      </div>
    </section>
  );
}
