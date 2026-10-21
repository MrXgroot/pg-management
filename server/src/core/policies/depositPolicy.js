/**
 * Pure policy for calculating security deposit settlements, deductions, and liabilities.
 * Money is calculated strictly in positive integer paise.
 */

/**
 * Calculates deduction totals, refundable balance, and remaining liabilities for deposit settlement.
 *
 * @param {number} depositAmountPaise - Original deposit held in integer paise (> 0).
 * @param {Array<{
 *   amountPaise: number,
 *   reason: string
 * }>} deductions - Itemized deductions with non-empty reasons.
 * @returns {{
 *   deductionsTotalPaise: number,
 *   refundPaise: number,
 *   remainingLiabilityPaise: number
 * }}
 */
export function calculateDepositSettlement(
  depositAmountPaise,
  deductions = [],
) {
  if (!Number.isInteger(depositAmountPaise) || depositAmountPaise <= 0) {
    throw new Error("depositAmountPaise must be a positive integer in paise.");
  }

  if (!Array.isArray(deductions)) {
    throw new Error("deductions must be an array.");
  }

  let deductionsTotalPaise = 0;

  for (let index = 0; index < deductions.length; index += 1) {
    const item = deductions[index];

    if (!item || typeof item !== "object") {
      throw new Error(`Deduction item at index ${index} must be an object.`);
    }

    if (!Number.isInteger(item.amountPaise) || item.amountPaise <= 0) {
      throw new Error(
        `Deduction item at index ${index} must have a positive integer amountPaise.`,
      );
    }

    if (typeof item.reason !== "string" || item.reason.trim().length === 0) {
      throw new Error(
        `Deduction item at index ${index} must have a non-empty string reason.`,
      );
    }

    deductionsTotalPaise += item.amountPaise;
  }

  const refundPaise = Math.max(0, depositAmountPaise - deductionsTotalPaise);
  const remainingLiabilityPaise = Math.max(
    0,
    deductionsTotalPaise - depositAmountPaise,
  );

  return {
    deductionsTotalPaise,
    refundPaise,
    remainingLiabilityPaise,
  };
}
