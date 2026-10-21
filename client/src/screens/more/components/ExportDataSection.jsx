import { Download, FileSpreadsheet } from "lucide-react";

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
      `${propertyName || "property"}_occupancy_snapshot.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Export & Reports
        </h3>
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={exportOccupancyCSV}
          className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100 active:scale-98"
        >
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Occupancy Snapshot
            </span>
            <span className="text-[11px] text-slate-500">
              Download room/bed roster as CSV
            </span>
          </div>
          <Download className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
