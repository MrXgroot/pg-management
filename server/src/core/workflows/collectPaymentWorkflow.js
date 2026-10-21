import crypto from "node:crypto";
import { getDatabase } from "../../../../server/db/connection.js";
import * as tenantRepo from "../repos/tenantRepo.js";
import * as rentalTermRepo from "../repos/rentalTermRepo.js";
import * as obligationRepo from "../repos/obligationRepo.js";
import * as paymentRepo from "../repos/paymentRepo.js";
import * as paymentAllocationRepo from "../repos/paymentAllocationRepo.js";
import { assertValidDate } from "../policies/dateUtils.js";
import { allocatePayment } from "../policies/allocationPolicy.js";
import { computeNextBillingPeriod } from "../policies/billingPolicy.js";

export function collectPaymentWorkflow(
  {
    tenantId,
    amountPaise,
    paidOn,
    paymentMethod,
    referenceNote = null,
    idempotencyKey = null,
    nextDueDateOverride = null,
  },
  db = getDatabase(),
) {
  assertValidDate(paidOn, "paidOn");
  if (nextDueDateOverride)
    assertValidDate(nextDueDateOverride, "nextDueDateOverride");

  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("INVALID_PAYMENT_AMOUNT");
  }

  const run = db.transaction(() => {
    if (idempotencyKey) {
      const existingPayment = paymentRepo.findByIdempotencyKey(
        idempotencyKey,
        db,
      );
      if (existingPayment) {
        const allocations = paymentAllocationRepo.findByPaymentId(
          existingPayment.id,
          db,
        );
        const allocatedPaise = allocations.reduce(
          (sum, a) => sum + a.amountPaise,
          0,
        );
        return {
          payment: existingPayment,
          allocations,
          unallocatedPaise: existingPayment.amountPaise - allocatedPaise,
          isDuplicate: true,
        };
      }
    }

    const tenant = tenantRepo.findById(tenantId, db);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const terms = rentalTermRepo.findByTenantId(tenantId, db);
    if (terms.length > 0) {
      let latestObligation = obligationRepo.findLatestBoundaryByTenantId(
        tenantId,
        db,
      );
      if (latestObligation) {
        const anchorDay = parseInt(tenant.joiningDate.slice(8, 10), 10);
        while (latestObligation.periodEndExclusive <= paidOn) {
          const nextPeriod = computeNextBillingPeriod({
            currentPeriodStart: latestObligation.periodEndExclusive,
            anchorDay,
            checkoutDate: tenant.checkoutDate,
          });
          if (!nextPeriod) break;

          const activeTerm =
            rentalTermRepo.findActiveByTenantId(
              tenantId,
              nextPeriod.periodStart,
              db,
            ) || terms[terms.length - 1];
          latestObligation = obligationRepo.insertIfPeriodMissing(
            {
              id: crypto.randomUUID(),
              tenantId,
              periodStart: nextPeriod.periodStart,
              periodEndExclusive: nextPeriod.periodEndExclusive,
              dueDate: nextPeriod.dueDate,
              amountPaise: activeTerm.rentPaise,
              rentalTermId: activeTerm.id,
            },
            db,
          );
        }
      }
    }

    if (nextDueDateOverride) {
      const outstanding = obligationRepo.findOutstandingByTenantId(
        tenantId,
        db,
      );
      if (outstanding.length > 0) {
        obligationRepo.updateDueDate(
          outstanding[0].id,
          nextDueDateOverride,
          db,
        );
      }
    }

    const outstandingObligations = obligationRepo.findOutstandingByTenantId(
      tenantId,
      db,
    );
    const { allocations: computedAllocations, unallocatedPaise } =
      allocatePayment(amountPaise, outstandingObligations);

    const paymentId = crypto.randomUUID();
    const payment = paymentRepo.insert(
      {
        id: paymentId,
        tenantId,
        amountPaise,
        paidOn,
        paymentMethod,
        referenceNote,
        idempotencyKey,
      },
      db,
    );

    const allocationRecords = computedAllocations.map((a) => ({
      id: crypto.randomUUID(),
      paymentId: payment.id,
      obligationId: a.obligationId,
      amountPaise: a.amountPaise,
    }));

    if (allocationRecords.length > 0) {
      paymentAllocationRepo.insertMany(allocationRecords, db);
    }

    return {
      payment,
      allocations: allocationRecords,
      unallocatedPaise,
      isDuplicate: false,
    };
  });

  return run();
}
