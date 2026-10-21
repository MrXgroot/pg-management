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
      setValidationError("Address is required.");
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
      aria-label="Create Property"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Add New Property
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banners */}
        {apiError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{apiError.message || "Failed to create property."}</span>
          </div>
        )}

        {validationError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label
              htmlFor="property-name"
              className="text-xs font-semibold text-slate-700 block"
            >
              Property Name *
            </label>
            <input
              id="property-name"
              type="text"
              required
              placeholder="e.g. Greenview Executive Stay"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="property-address"
              className="text-xs font-semibold text-slate-700 block"
            >
              Full Address *
            </label>
            <textarea
              id="property-address"
              rows={2}
              required
              placeholder="e.g. 123 Outer Ring Rd, Bellandur, Bengaluru"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Property</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
