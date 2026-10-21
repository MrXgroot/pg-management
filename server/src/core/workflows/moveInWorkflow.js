import crypto from "node:crypto";
import { getDatabase } from "../../../../server/db/connection.js";
import * as propertyRepo from "../repos/propertyRepo.js";
import * as bedRepo from "../repos/bedRepo.js";
import * as tenantRepo from "../repos/tenantRepo.js";
import * as assignmentRepo from "../repos/assignmentRepo.js";
import * as rentalTermRepo from "../repos/rentalTermRepo.js";
import * as depositRepo from "../repos/depositRepo.js";
import * as obligationRepo from "../repos/obligationRepo.js";
import { assertValidDate } from "../policies/dateUtils.js";
import { computeNextBillingPeriod } from "../policies/billingPolicy.js";

export function moveInWorkflow(
  {
    propertyId,
    bedId,
    name,
    phone,
    joiningDate,
    rentPaise,
    depositPaise = 0,
    dueDate = null,
  },
  db = getDatabase(),
) {
  assertValidDate(joiningDate, "joiningDate");
  if (dueDate) assertValidDate(dueDate, "dueDate");

  if (!Number.isInteger(rentPaise) || rentPaise <= 0) {
    throw new Error("INVALID_RENT_AMOUNT");
  }
  if (!Number.isInteger(depositPaise) || depositPaise < 0) {
    throw new Error("INVALID_DEPOSIT_AMOUNT");
  }

  const run = db.transaction(() => {
    const property = propertyRepo.findById(propertyId, db);
    if (!property) {
      throw new Error("PROPERTY_NOT_FOUND");
    }

    const bed = bedRepo.findById(bedId, db);
    if (!bed) {
      throw new Error("BED_NOT_FOUND");
    }
    if (!bed.isActive) {
      throw new Error("BED_INACTIVE");
    }

    const overlaps = assignmentRepo.findOverlapsForBed(
      {
        bedId,
        startDate: joiningDate,
        endDateExclusive: null,
      },
      db,
    );

    if (overlaps.length > 0) {
      throw new Error("BED_ALREADY_OCCUPIED");
    }

    const tenantId = crypto.randomUUID();
    const tenant = tenantRepo.insert(
      {
        id: tenantId,
        propertyId,
        name,
        phone,
        status: "ACTIVE",
        joiningDate,
      },
      db,
    );

    const assignmentId = crypto.randomUUID();
    const assignment = assignmentRepo.insert(
      {
        id: assignmentId,
        tenantId,
        bedId,
        startDate: joiningDate,
        endDateExclusive: null,
      },
      db,
    );

    const rentalTermId = crypto.randomUUID();
    const rentalTerm = rentalTermRepo.insert(
      {
        id: rentalTermId,
        tenantId,
        rentPaise,
        effectiveFrom: joiningDate,
        effectiveToExclusive: null,
      },
      db,
    );

    let deposit = null;
    if (depositPaise > 0) {
      deposit = depositRepo.insert(
        {
          id: crypto.randomUUID(),
          tenantId,
          amountPaise: depositPaise,
          receivedOn: joiningDate,
          status: "HELD",
        },
        db,
      );
    }

    const anchorDay = parseInt(joiningDate.slice(8, 10), 10);
    const period = computeNextBillingPeriod({
      currentPeriodStart: joiningDate,
      anchorDay,
    });

    const obligationId = crypto.randomUUID();
    const obligation = obligationRepo.insert(
      {
        id: obligationId,
        tenantId,
        periodStart: period.periodStart,
        periodEndExclusive: period.periodEndExclusive,
        dueDate: dueDate || period.dueDate,
        amountPaise: rentPaise,
        rentalTermId: rentalTerm.id,
      },
      db,
    );

    return {
      tenant,
      assignment,
      rentalTerm,
      deposit,
      obligation,
    };
  });

  return run();
}
