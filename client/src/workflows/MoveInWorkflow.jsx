import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  IndianRupee,
  Loader2,
  Phone,
  User,
} from "lucide-react";
import { parseRupeesToPaise } from "../shared/formatters.js";
import { useMoveIn } from "../data/mutations/useMoveIn.js";

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MoveInWorkflow({ propertyId, bed, room, onSuccess, onCancel }) {
  const today = getTodayString();
  const {
    mutate: moveIn,
    isPending,
    error: mutationError,
  } = useMoveIn(propertyId);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    joiningDate: today,
    rentRupees: "",
    depositRupees: "",
    dueDate: today,
  });

  const [validationErrors, setValidationErrors] = useState({});

  function handleChange(field, value) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Keep dueDate aligned with joiningDate unless manually edited
      if (field === "joiningDate" && prev.dueDate === prev.joiningDate) {
        next.dueDate = value;
      }
      return next;
    });

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  function validate() {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Tenant name is required";
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      errors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.joiningDate) {
      errors.joiningDate = "Joining date is required";
    }

    const rentPaise = parseRupeesToPaise(formData.rentRupees);
    if (!formData.rentRupees || rentPaise <= 0) {
      errors.rentRupees = "Monthly rent must be greater than ₹0";
    }

    if (!formData.dueDate) {
      errors.dueDate = "First due date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate() || isPending) return;

    const payload = {
      propertyId,
      bedId: bed.id,
      name: formData.name.trim(),
      phone: formData.phone.replace(/\D/g, ""),
      joiningDate: formData.joiningDate,
      rentPaise: parseRupeesToPaise(formData.rentRupees),
      depositPaise: parseRupeesToPaise(formData.depositRupees),
      dueDate: formData.dueDate,
    };

    moveIn(payload, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Target Location Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Target Assignment
        </span>
        <p className="mt-0.5 text-xs font-semibold text-slate-800">
          Room {room?.roomNumber} • {bed?.bedLabel}
        </p>
      </div>

      {mutationError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="text-xs">
            <span className="font-bold">Move-in failed: </span>
            <span>
              {mutationError.message || "Unable to record assignment."}
            </span>
          </div>
        </div>
      )}

      {/* Tenant Name */}
      <div>
        <label
          htmlFor="tenant-name"
          className="text-xs font-semibold text-slate-700 block"
        >
          Tenant Name *
        </label>
        <div className="relative mt-1.5">
          <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="tenant-name"
            type="text"
            required
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
              validationErrors.name
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
        </div>
        {validationErrors.name && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">
            {validationErrors.name}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label
          htmlFor="tenant-phone"
          className="text-xs font-semibold text-slate-700 block"
        >
          Phone Number *
        </label>
        <div className="relative mt-1.5">
          <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="tenant-phone"
            type="tel"
            required
            maxLength={10}
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={`h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
              validationErrors.phone
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
        </div>
        {validationErrors.phone && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">
            {validationErrors.phone}
          </p>
        )}
      </div>

      {/* Financial Details (Rent & Deposit) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="monthly-rent"
            className="text-xs font-semibold text-slate-700 block"
          >
            Monthly Rent (₹) *
          </label>
          <div className="relative mt-1.5">
            <IndianRupee className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="monthly-rent"
              type="number"
              min="1"
              required
              placeholder="e.g. 8000"
              value={formData.rentRupees}
              onChange={(e) => handleChange("rentRupees", e.target.value)}
              className={`h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                validationErrors.rentRupees
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
            />
          </div>
          {validationErrors.rentRupees && (
            <p className="mt-1 text-[11px] font-medium text-rose-600">
              {validationErrors.rentRupees}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="security-deposit"
            className="text-xs font-semibold text-slate-700 block"
          >
            Security Deposit (₹)
          </label>
          <div className="relative mt-1.5">
            <IndianRupee className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="security-deposit"
              type="number"
              min="0"
              placeholder="e.g. 10000"
              value={formData.depositRupees}
              onChange={(e) => handleChange("depositRupees", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Dates (Joining & Due Date) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="joining-date"
            className="text-xs font-semibold text-slate-700 block"
          >
            Joining Date *
          </label>
          <div className="relative mt-1.5">
            <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="joining-date"
              type="date"
              required
              value={formData.joiningDate}
              onChange={(e) => handleChange("joiningDate", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="due-date"
            className="text-xs font-semibold text-slate-700 block"
          >
            First Due Date *
          </label>
          <div className="relative mt-1.5">
            <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="due-date"
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Assigning...</span>
            </>
          ) : (
            <span>Complete Move-In</span>
          )}
        </button>
      </div>
    </form>
  );
}
