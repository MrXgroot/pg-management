import { useState, useEffect } from "react";
import { X, Building2, AlertCircle, Loader2 } from "lucide-react";
import { useCreateProperty } from "../../../data/structure/useStructureMutations.js";
import { useProperty } from "../../../context/PropertyContext.jsx";

export function CreatePropertyModal({ isOpen, onClose }) {
  const { selectProperty } = useProperty();
  const {
    mutate: createProperty,
    isPending,
    error: apiError,
  } = useCreateProperty();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setAddress("");
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Property name is required.");
      return;
    }

    if (!address.trim()) {
      setValidationError("Locality / Address is required.");
      return;
    }

    createProperty(
      {
        name: name.trim(),
        address: address.trim(),
      },
      {
        onSuccess: (newProperty) => {
          if (newProperty?.id) {
            selectProperty(newProperty.id);
          }
          onClose();
        },
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface Card */}
      <div className="relative z-10 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] border border-slate-200/90 bg-white p-5 shadow-2xl transition dark:border-neutral-800 dark:bg-[#16171C]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden dark:bg-neutral-700" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF5E36]/10 text-[#FF5E36]">
              <Building2 className="h-4 w-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Create New Branch
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="spring-press flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banners */}
        {apiError && (
          <div className="mt-3 flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{apiError.message || "Failed to create property."}</span>
          </div>
        )}

        {validationError && (
          <div className="mt-3 flex items-start space-x-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sri Sai Emerald PG"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Locality / Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Marathahalli Outer Ring Rd"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="spring-press rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="spring-press inline-flex items-center space-x-1.5 rounded-2xl bg-[#FF5E36] px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Branch</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
