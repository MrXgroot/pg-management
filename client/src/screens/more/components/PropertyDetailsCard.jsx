import { useState } from "react";
import {
  Building2,
  MapPin,
  Pencil,
  X,
  Check,
  Loader2,
  AlertCircle,
  Layers,
  Bed as BedIcon,
} from "lucide-react";
import { useUpdateProperty } from "../../../data/properties/usePropertySettings.js";

export function PropertyDetailsCard({
  property,
  totalFloors = 0,
  totalBeds = 0,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(property?.name || "");
  const [address, setAddress] = useState(property?.address || "");
  const [validationError, setValidationError] = useState(null);

  const {
    mutate: updateProperty,
    isPending,
    error: apiError,
  } = useUpdateProperty(property?.id);

  function handleStartEdit() {
    setName(property?.name || "");
    setAddress(property?.address || "");
    setValidationError(null);
    setIsEditing(true);
  }

  function handleSave(e) {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      setValidationError("Property branch name is required.");
      return;
    }
    if (!trimmedAddress) {
      setValidationError("Property address is required.");
      return;
    }

    updateProperty(
      { name: trimmedName, address: trimmedAddress },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
      {/* Top Identity & Action Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E64720] via-[#FF5E36] to-[#FF7A59] text-white shadow-[0_10px_25px_-4px_rgba(255,94,54,0.38)]">
            <Building2 className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Property Profile
              </span>
              <span className="rounded-md border border-emerald-500/25 bg-emerald-50 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                Active
              </span>
            </div>
            <h3 className="truncate text-base font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              {property?.name || "Property"}
            </h3>
            <p className="flex items-center space-x-1 text-xs font-semibold text-slate-400 dark:text-neutral-500 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-[#FF5E36]" />
              <span className="truncate">
                {property?.address || "No address configured"}
              </span>
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="spring-press flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 shadow-xs hover:border-slate-300 hover:text-slate-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5 stroke-[2.2]" />
          </button>
        )}
      </div>

      {/* Editing State Form */}
      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="mt-3.5 space-y-3 border-t border-slate-100 pt-3 dark:border-neutral-800"
        >
          {(validationError || apiError) && (
            <div className="flex items-start space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
              <span>{validationError || apiError?.message}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Property Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Locality / Address *
            </label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="spring-press rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="spring-press inline-flex items-center space-x-1.5 rounded-2xl bg-[#FF5E36] px-4 py-1.5 text-xs font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Read-Only Quick Metrics Strip */
        <div className="-mx-4 -mb-4 mt-3 flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs dark:border-neutral-800/80 dark:bg-neutral-900/40">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-neutral-300 font-bold">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>{totalFloors} Floors</span>
          </div>

          <div className="h-3.5 w-px bg-slate-200/90 dark:bg-neutral-800" />

          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-neutral-300 font-bold">
            <BedIcon className="h-3.5 w-3.5 text-slate-400" />
            <span>{totalBeds} Bed Spaces</span>
          </div>
        </div>
      )}
    </div>
  );
}
