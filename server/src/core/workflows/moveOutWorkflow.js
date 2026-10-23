import { getDatabase } from "../../../../server/db/connection.js";
import * as tenantRepo from "../repos/tenantRepo.js";
import * as assignmentRepo from "../repos/assignmentRepo.js";
import * as rentalTermRepo from "../repos/rentalTermRepo.js";
import { assertValidDate } from "../policies/dateUtils.js";

export function moveOutWorkflow(
  { tenantId, checkoutDate },
  db = getDatabase(),
) {
  assertValidDate(checkoutDate, "checkoutDate");

  const run = db.transaction(() => {
    const tenant = tenantRepo.findById(tenantId, db);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }
    if (tenant.status === "CHECKED_OUT") {
      throw new Error("TENANT_ALREADY_CHECKED_OUT");
    }

    const activeAssignment = assignmentRepo.findActiveByTenantId(tenantId, db);
    if (!activeAssignment) {
      throw new Error("NO_ACTIVE_ASSIGNMENT");
    }

    if (checkoutDate <= activeAssignment.startDate) {
      throw new Error("CHECKOUT_DATE_MUST_BE_AFTER_START_DATE");
    }

    const closedAssignment = assignmentRepo.close(
      activeAssignment.id,
      checkoutDate,
      db,
    );

    const activeRentalTerm = rentalTermRepo.findActiveByTenantId(
      tenantId,
      checkoutDate,
      db,
    );
    if (activeRentalTerm && !activeRentalTerm.effectiveToExclusive) {
      rentalTermRepo.closeAt(activeRentalTerm.id, checkoutDate, db);
    }

    const updatedTenant = tenantRepo.updateStatus(
      tenantId,
      {
        status: "CHECKED_OUT",
        checkoutDate,
      },
      db,
    );

    return {
      tenant: updatedTenant,
      closedAssignment,
    };
  });

  return run();
}
