import { useState } from "react";
import {
  Building2,
  MapPin,
  Edit3,
  X,
  Check,
  Loader2,
  AlertCircle,
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

    if (!name.trim()) {
      setValidationError("Property name is required.");
      return;
    }
    if (!address.trim()) {
      setValidationError("Address is required.");
      return;
    }

    updateProperty(
      { name: name.trim(), address: address.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {property?.name || "Property"}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3" />
              <span>{property?.address || "No address set"}</span>
            </div>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 active:scale-95"
          >
            <Edit3 className="h-3 w-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="mt-2 flex flex-col gap-2.5 border-t border-slate-100 pt-3"
        >
          {apiError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
              <span>{apiError.message || "Failed to update property."}</span>
            </div>
          )}

          {validationError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-prop-name"
              className="text-[11px] font-semibold text-slate-600 block"
            >
              Property Name
            </label>
            <input
              id="edit-prop-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-0.5 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-prop-address"
              className="text-[11px] font-semibold text-slate-600 block"
            >
              Address
            </label>
            <textarea
              id="edit-prop-address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-1 flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {totalFloors} Floors
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {totalBeds} Bed Spaces
          </span>
        </div>
      )}
    </div>
  );
}
