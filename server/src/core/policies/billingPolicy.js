// server/src/core/policies/billingPolicy.js
import { assertValidDate, addMonthsPreservingAnchor } from "./dateUtils.js";

export function computeNextBillingPeriod({
  currentPeriodStart,
  anchorDay,
  checkoutDate = null,
  dueDateOffsetDays = 0,
}) {
  assertValidDate(currentPeriodStart, "currentPeriodStart");
  if (checkoutDate) assertValidDate(checkoutDate, "checkoutDate");

  if (checkoutDate && currentPeriodStart >= checkoutDate) {
    return null;
  }

  const periodEndExclusive = addMonthsPreservingAnchor(
    currentPeriodStart,
    1,
    anchorDay,
  );
  const dueDate = currentPeriodStart;

  return {
    periodStart: currentPeriodStart,
    periodEndExclusive,
    dueDate,
  };
}
