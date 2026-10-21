/**
 * Pure policy for allocating payments across outstanding obligations using FIFO rules.
 * Money is calculated strictly in positive integer paise.
 */

/**
 * Validates and allocates a payment amount against an array of outstanding obligations.
 *
 * @param {number} paymentAmountPaise - Payment received in integer paise (> 0).
 * @param {Array<{
 *   id: string,
 *   amountPaise: number,
 *   allocatedPaise?: number,
 *   periodStart: string,
 *   dueDate: string
 * }>} outstandingObligations - Unsettled obligations sorted in FIFO order.
 * @returns {{
 *   allocations: Array<{ obligationId: string, amountPaise: number }>,
 *   unallocatedPaise: number
 * }}
 */
export function allocatePayment(
  paymentAmountPaise,
  outstandingObligations = [],
) {
  if (!Number.isInteger(paymentAmountPaise) || paymentAmountPaise <= 0) {
    throw new Error("paymentAmountPaise must be a positive integer in paise.");
  }

  if (!Array.isArray(outstandingObligations)) {
    throw new Error("outstandingObligations must be an array.");
  }

  // Enforce deterministic FIFO sort: periodStart ASC, dueDate ASC, id ASC
  const sortedObligations = [...outstandingObligations].sort((a, b) => {
    if (a.periodStart !== b.periodStart) {
      return a.periodStart.localeCompare(b.periodStart);
    }
    if (a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.id.localeCompare(b.id);
  });

  let remainingPaymentPaise = paymentAmountPaise;
  const allocations = [];

  for (const obligation of sortedObligations) {
    if (remainingPaymentPaise <= 0) {
      break;
    }

    if (!obligation || typeof obligation.id !== "string") {
      throw new Error("Each obligation must possess a valid string id.");
    }

    const totalAmount = obligation.amountPaise;
    const currentAllocated = obligation.allocatedPaise ?? 0;

    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      throw new Error(
        `Obligation ${obligation.id} must have a positive integer amountPaise.`,
      );
    }

    if (!Number.isInteger(currentAllocated) || currentAllocated < 0) {
      throw new Error(
        `Obligation ${obligation.id} allocatedPaise must be a non-negative integer.`,
      );
    }

    const unpaidPaise = totalAmount - currentAllocated;
    if (unpaidPaise <= 0) {
      continue;
    }

    const allocateAmount = Math.min(remainingPaymentPaise, unpaidPaise);

    allocations.push({
      obligationId: obligation.id,
      amountPaise: allocateAmount,
    });

    remainingPaymentPaise -= allocateAmount;
  }

  return {
    allocations,
    unallocatedPaise: remainingPaymentPaise,
  };
}
