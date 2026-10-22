import { Download, FileSpreadsheet, ArrowUpRight } from "lucide-react";

export function ExportDataSection({ occupancy, propertyName }) {
  function exportOccupancyCSV() {
    if (!occupancy?.floors) return;

    const rows = [
      [
        "Floor",
        "Room Number",
        "Bed Label",
        "Status",
        "Tenant Name",
        "Tenant Phone",
        "Outstanding Dues (Paise)",
      ],
    ];

    for (const floor of occupancy.floors) {
      for (const room of floor.rooms || []) {
        for (const bed of room.beds || []) {
          rows.push([
            floor.name,
            room.roomNumber,
            bed.bedLabel,
            bed.status,
            bed.tenant?.name || "—",
            bed.tenant?.phone || "—",
            bed.tenant?.totalOutstandingPaise || 0,
          ]);
        }
      }
    }

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${(propertyName || "property").toLowerCase().replace(/\s+/g, "_")}_occupancy_roster.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
      <div className="flex items-center space-x-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <FileSpreadsheet className="h-4.5 w-4.5 stroke-[2.2]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none">
            Data Exports
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            Download local audit spreadsheets
          </p>
        </div>
      </div>

      <div className="mt-3.5">
        <button
          type="button"
          onClick={exportOccupancyCSV}
          className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 text-left transition-all hover:border-[#FF5E36]/40 hover:bg-white active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-2xs dark:bg-neutral-800">
              <Download className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900 dark:text-white">
                Occupancy Roster (.CSV)
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Live floor, room, tenant & due balances
              </span>
            </div>
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 shadow-2xs group-hover:bg-[#FF5E36] group-hover:text-white group-hover:border-transparent transition-all dark:border-transparent dark:bg-neutral-800">
            <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.2]" />
          </div>
        </button>
      </div>
    </div>
  );
}
