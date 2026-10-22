import { useState, useEffect } from "react";
import { X, DoorOpen, Minus, Plus, Loader2, AlertCircle } from "lucide-react";
import {
  useCreateRoom,
  useCreateBed,
} from "../../../data/structure/useStructureMutations.js";

export function AddRoomSheet({ isOpen, floor, propertyId, onClose }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [bedCapacity, setBedCapacity] = useState(2);
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: createRoomAsync } = useCreateRoom(propertyId);
  const { mutateAsync: createBedAsync } = useCreateBed(propertyId);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setIsSubmitting(false);
      setBedCapacity(2);

      // Auto-suggest next room number (e.g., Floor 1 with 2 rooms -> "103")
      const currentRoomCount = floor?.rooms?.length || 0;
      const floorDigits = floor?.displayOrder || 1;
      const nextNum = `${floorDigits}0${currentRoomCount + 1}`;
      setRoomNumber(nextNum);
    }
  }, [isOpen, floor]);

  if (!isOpen) return null;

  const handleAdjustBeds = (delta) => {
    const next = bedCapacity + delta;
    if (next >= 1 && next <= 6) {
      setBedCapacity(next);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedNumber = roomNumber.trim();
    if (!trimmedNumber) {
      setValidationError("Room number is required (e.g., 101, 204).");
      return;
    }

    if (!floor?.id) {
      setValidationError("Parent floor identifier missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Room on active floor
      const createdRoom = await createRoomAsync({
        floorId: floor.id,
        roomNumber: trimmedNumber,
      });

      const newRoomId = createdRoom?.id || createdRoom?.data?.id;

      // 2. Automatically generate sequential beds based on stepper count
      if (newRoomId && bedCapacity > 0) {
        for (let i = 0; i < bedCapacity; i++) {
          const bedLetter = String.fromCharCode(65 + i); // 'A', 'B', 'C', ...
          await createBedAsync({
            roomId: newRoomId,
            bedLabel: `Bed ${bedLetter}`,
          });
        }
      }

      onClose();
    } catch (err) {
      setValidationError(err?.message || "Failed to create room and beds.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-Up Bottom Sheet */}
      <div className="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-t-[36px] border-t border-slate-200/90 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#16171C]">
        {/* Drag Handle */}
        <div
          className="mx-auto mb-4 h-1.5 w-12 cursor-pointer rounded-full bg-slate-200 dark:bg-neutral-700"
          onClick={onClose}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-neutral-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5E36]">
              {floor?.name || "Floor Configuration"}
            </span>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Add Room & Capacity
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

        {/* Error Notice */}
        {validationError && (
          <div className="mt-3.5 flex items-start space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Room Number Input */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Room Number / Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101, 204"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-4 text-xs font-bold text-slate-900 transition-colors focus:border-[#FF5E36] focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-[#121316] dark:text-white"
            />
          </div>

          {/* Bed Stepper Control */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-[#121316]">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bed Capacity
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {bedCapacity} {bedCapacity === 1 ? "Bed" : "Beds"} (
                {bedCapacity} Sharing)
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center space-x-2.5 rounded-full border border-slate-200/80 bg-white p-1.5 shadow-xs dark:border-neutral-700 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => handleAdjustBeds(-1)}
                disabled={bedCapacity <= 1 || isSubmitting}
                className="spring-press flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-800 disabled:opacity-40 dark:bg-neutral-700 dark:text-white"
              >
                <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>

              <span className="w-5 text-center text-xs font-black text-slate-900 dark:text-white">
                {bedCapacity}
              </span>

              <button
                type="button"
                onClick={() => handleAdjustBeds(1)}
                disabled={bedCapacity >= 6 || isSubmitting}
                className="spring-press flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5E36] text-white shadow-xs disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Auto-Generation Helper Preview */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-neutral-800/80 dark:bg-neutral-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Auto-Registered Beds:
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Array.from({ length: bedCapacity }).map((_, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-700 shadow-2xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  Bed {String.fromCharCode(65 + idx)}
                </span>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="spring-press flex w-full items-center justify-center space-x-2 rounded-[24px] bg-[#FF5E36] py-3.5 text-xs font-extrabold text-white shadow-[0_10px_25px_-4px_rgba(255,94,54,0.38)] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Room & Beds...</span>
              </>
            ) : (
              <>
                <DoorOpen className="h-4 w-4" />
                <span>Create Room & Auto-Add Beds</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
