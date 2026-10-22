import { useState, useEffect } from "react";
import { X, Layers, Loader2, AlertCircle } from "lucide-react";
import { useCreateFloor } from "../../../data/structure/useStructureMutations.js";

export function AddFloorSheet({
  isOpen,
  currentFloorCount,
  propertyId,
  onClose,
}) {
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("1");
  const [validationError, setValidationError] = useState(null);

  const {
    mutate: createFloor,
    isPending,
    error: apiError,
  } = useCreateFloor(propertyId);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      const nextOrder = (currentFloorCount || 0) + 1;
      setName(`Floor ${nextOrder}`);
      setDisplayOrder(String(nextOrder));
    }
  }, [isOpen, currentFloorCount]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError("Floor display name is required.");
      return;
    }

    const orderNum = parseInt(displayOrder, 10);
    if (isNaN(orderNum) || orderNum < 1) {
      setValidationError("Display order must be a positive integer.");
      return;
    }

    createFloor(
      { name: trimmed, displayOrder: orderNum },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative z-10 w-full rounded-t-[36px] border-t border-slate-200/90 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#16171C]">
        <div
          className="mx-auto mb-4 h-1.5 w-12 cursor-pointer rounded-full bg-slate-200 dark:bg-neutral-700"
          onClick={onClose}
        />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-neutral-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5E36]">
              Structure Setup
            </span>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Add New Floor
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="spring-press flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:text-slate-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {(validationError || apiError) && (
          <div className="mt-3.5 flex items-start space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{validationError || apiError?.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Floor Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ground Floor, Floor 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-4 text-xs font-bold text-slate-900 transition-colors focus:border-[#FF5E36] focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-[#121316] dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tab Display Order
            </label>
            <input
              type="number"
              min="1"
              required
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-4 text-xs font-bold text-slate-900 transition-colors focus:border-[#FF5E36] focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-[#121316] dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="spring-press flex w-full items-center justify-center space-x-2 rounded-[24px] bg-[#FF5E36] py-3.5 text-xs font-extrabold text-white shadow-[0_10px_25px_-4px_rgba(255,94,54,0.38)] disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Floor...</span>
              </>
            ) : (
              <>
                <Layers className="h-4 w-4" />
                <span>Create Floor</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
