import { useState, useMemo } from "react";
import { Building2, Search, X, Check, CheckCircle2 } from "lucide-react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useTenantDirectory } from "../../data/tenants/useTenantDirectory.js";
import { CollectionSummaryRibbon } from "./components/CollectionSummaryRibbon.jsx";
import { CollectionQueueCard } from "./components/CollectionQueueCard.jsx";
import { BottomSheet } from "../../components/BottomSheet.jsx";
import { CollectPaymentWorkflow } from "../../workflows/CollectPaymentWorkflow.jsx";

const FILTER_CHIPS = [
  { id: "NEEDS_COLLECTION", label: "Needs Collection" },
  { id: "OVERDUE", label: "Overdue" },
  { id: "ALL_ACTIVE", label: "All Active" },
  { id: "SETTLED", label: "Settled / Paid" },
];

export function PaymentsScreen() {
  const { selectedPropertyId } = useProperty();

  const [activeChip, setActiveChip] = useState("NEEDS_COLLECTION");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Read active occupants directory for this property
  const {
    data: tenants = [],
    isLoading,
    isError,
    error,
  } = useTenantDirectory({
    propertyId: selectedPropertyId,
    status: "ACTIVE",
  });

  // Calculate high-level summary metrics
  const { totalOutstandingPaise, unpaidCount } = useMemo(() => {
    let sum = 0;
    let unpaid = 0;

    for (const t of tenants) {
      const outstanding = t.balances?.totalOutstandingPaise || 0;
      if (outstanding > 0) {
        sum += outstanding;
        unpaid += 1;
      }
    }

    return { totalOutstandingPaise: sum, unpaidCount: unpaid };
  }, [tenants]);

  // Filter & prioritize queue locally
  const filteredQueue = useMemo(() => {
    let list = [...tenants];

    // 1. Text Search Filter (name, phone, room number)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const nameMatch = t.name?.toLowerCase().includes(q);
        const phoneMatch = t.phone?.includes(q);
        const roomMatch = t.currentBed?.roomNumber?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || roomMatch;
      });
    }

    // 2. Chip Filtering
    if (activeChip === "NEEDS_COLLECTION") {
      list = list.filter((t) => (t.balances?.totalOutstandingPaise || 0) > 0);
    } else if (activeChip === "OVERDUE") {
      list = list.filter((t) => (t.balances?.overduePaise || 0) > 0);
    } else if (activeChip === "SETTLED") {
      list = list.filter((t) => (t.balances?.totalOutstandingPaise || 0) === 0);
    }

    // 3. Priority Sorting
    // Priority 1: Overdue > 0
    // Priority 2: Pending > 0
    // Priority 3: Settled
    list.sort((a, b) => {
      const aOverdue = a.balances?.overduePaise || 0;
      const bOverdue = b.balances?.overduePaise || 0;
      if (aOverdue > 0 || bOverdue > 0) return bOverdue - aOverdue;

      const aOut = a.balances?.totalOutstandingPaise || 0;
      const bOut = b.balances?.totalOutstandingPaise || 0;
      return bOut - aOut;
    });

    return list;
  }, [tenants, searchQuery, activeChip]);

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
          Select a property in the header above to launch the payment desk.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 py-2 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
          <div className="h-24 rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
        </div>
        <div className="h-11 w-full rounded-2xl bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-xl bg-slate-200/80 dark:bg-neutral-800/80" />
          <div className="h-8 w-20 rounded-xl bg-slate-200/80 dark:bg-neutral-800/80" />
        </div>
        <div className="h-36 rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
        <div className="h-36 rounded-[28px] bg-slate-200/80 dark:bg-neutral-800/80" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center justify-center rounded-[32px] border border-rose-200/80 bg-rose-50/70 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <h3 className="text-sm font-black text-rose-900 dark:text-rose-200">
          Failed to load collection queue
        </h3>
        <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error?.message || "Please check connection or retry."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-3.5 px-1 py-1 select-none">
      {/* 1. Top Outstanding & Pending Count Ribbon */}
      <CollectionSummaryRibbon
        totalOutstandingPaise={totalOutstandingPaise}
        unpaidCount={unpaidCount}
      />

      {/* 2. Fast Search Bar */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[2.2] text-slate-400 dark:text-neutral-500" />
        <input
          type="text"
          placeholder="Filter by name, phone, or room (e.g. 102)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-10 text-xs font-bold text-slate-900 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04)] transition-all placeholder:text-slate-400 focus:border-[#FF5E36] focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-[#16171C] dark:text-white dark:placeholder:text-neutral-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="spring-press absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* 3. Filter Chips Rail */}
      <div className="no-scrollbar -mx-1 flex items-center space-x-1.5 overflow-x-auto px-1 py-0.5">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveChip(chip.id)}
              className={`spring-press shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "border border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 dark:border-neutral-800 dark:bg-[#16171C] dark:text-neutral-300"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* 4. Section Status Counter */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
          Collection Queue
        </span>
        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
          {filteredQueue.length}{" "}
          {filteredQueue.length === 1 ? "Occupant" : "Occupants"}
        </span>
      </div>

      {/* 5. Prioritized Collection List */}
      {filteredQueue.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-300 bg-white/50 py-16 text-center backdrop-blur-sm dark:border-neutral-800 dark:bg-[#16171C]/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-neutral-200">
            All Dues Cleared
          </h4>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-neutral-500">
            No occupants match the active queue filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-3 pb-8">
          {filteredQueue.map((tenant) => (
            <CollectionQueueCard
              key={tenant.id}
              tenant={tenant}
              onCollect={(t) => setSelectedTenant(t)}
            />
          ))}
        </div>
      )}

      {/* 6. Single-Host Bottom Sheet for Collect Payment Workflow */}
      <BottomSheet
        isOpen={Boolean(selectedTenant)}
        title="Collect Rent Payment"
        subtitle={selectedTenant?.name}
        onClose={() => setSelectedTenant(null)}
      >
        {selectedTenant && selectedTenant.currentBed && (
          <CollectPaymentWorkflow
            propertyId={selectedPropertyId}
            bed={{
              id: selectedTenant.currentBed.bedId,
              bedLabel: selectedTenant.currentBed.bedLabel,
              tenant: selectedTenant,
            }}
            room={{
              id: selectedTenant.currentBed.roomId,
              roomNumber: selectedTenant.currentBed.roomNumber,
            }}
            onSuccess={() => setSelectedTenant(null)}
            onCancel={() => setSelectedTenant(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
