import crypto from "node:crypto";
import { getDatabase } from "../../../../server/db/connection.js";
import * as tenantRepo from "../repos/tenantRepo.js";
import * as bedRepo from "../repos/bedRepo.js";
import * as assignmentRepo from "../repos/assignmentRepo.js";
import { assertValidDate } from "../policies/dateUtils.js";

export function shiftBedWorkflow(
  { tenantId, targetBedId, shiftDate },
  db = getDatabase(),
) {
  assertValidDate(shiftDate, "shiftDate");

  const run = db.transaction(() => {
    const tenant = tenantRepo.findById(tenantId, db);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }
    if (tenant.status !== "ACTIVE") {
      throw new Error("TENANT_NOT_ACTIVE");
    }

    const currentAssignment = assignmentRepo.findActiveByTenantId(tenantId, db);
    if (!currentAssignment) {
      throw new Error("NO_ACTIVE_ASSIGNMENT");
    }

    if (currentAssignment.bedId === targetBedId) {
      throw new Error("CANNOT_SHIFT_TO_SAME_BED");
    }

    if (shiftDate <= currentAssignment.startDate) {
      throw new Error("SHIFT_DATE_BEFORE_START_DATE");
    }

    const targetBed = bedRepo.findById(targetBedId, db);
    if (!targetBed) {
      throw new Error("TARGET_BED_NOT_FOUND");
    }
    if (!targetBed.isActive) {
      throw new Error("TARGET_BED_INACTIVE");
    }

    const overlaps = assignmentRepo.findOverlapsForBed(
      {
        bedId: targetBedId,
        startDate: shiftDate,
        endDateExclusive: null,
      },
      db,
    );

    if (overlaps.length > 0) {
      throw new Error("TARGET_BED_OCCUPIED");
    }

    const closedAssignment = assignmentRepo.close(
      currentAssignment.id,
      shiftDate,
      db,
    );

    const newAssignmentId = crypto.randomUUID();
    const newAssignment = assignmentRepo.insert(
      {
        id: newAssignmentId,
        tenantId,
        bedId: targetBedId,
        startDate: shiftDate,
        endDateExclusive: null,
      },
      db,
    );

    return {
      closedAssignment,
      newAssignment,
    };
  });

  return run();
}
