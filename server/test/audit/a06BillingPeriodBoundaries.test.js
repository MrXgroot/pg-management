import { describe, expect, it } from "vitest";
import { computeNextBillingPeriod } from "../../src/core/policies/billingPolicy.js";

describe("A-06 documented billing period boundaries", () => {
  it.each([
    ["January 31 in a leap year", "2024-01-31", 31, "2024-02-29"],
    ["January 31 in a non-leap year", "2025-01-31", 31, "2025-02-28"],
    ["the original anchor after a leap-year clamp", "2024-02-29", 31, "2024-03-31"],
    ["the original anchor after a non-leap-year clamp", "2025-02-28", 31, "2025-03-31"],
    ["a 30th-day anchor through February", "2025-01-30", 30, "2025-02-28"],
    ["a 30th-day anchor after February", "2025-02-28", 30, "2025-03-30"],
    ["the year boundary", "2026-12-31", 31, "2027-01-31"],
  ])("preserves the anchor and clamps %s to the target month", (_scenario, currentPeriodStart, anchorDay, expectedEnd) => {
    const period = computeNextBillingPeriod({ currentPeriodStart, anchorDay });

    expect(period.periodStart).toBe(currentPeriodStart);
    expect(period.periodEndExclusive).toBe(expectedEnd);
    expect(period.periodStart < period.periodEndExclusive).toBe(true);
  });

  it.each([
    ["a non-leap-year February start", "currentPeriodStart", "2025-02-29"],
    ["a February 30 checkout date", "checkoutDate", "2026-02-30"],
  ])("rejects %s instead of calculating a billing period", (_scenario, field, value) => {
    expect(() =>
      computeNextBillingPeriod({
        currentPeriodStart: field === "currentPeriodStart" ? value : "2026-01-31",
        anchorDay: 31,
        checkoutDate: field === "checkoutDate" ? value : null,
      }),
    ).toThrow(`Invalid calendar date for ${field}`);
  });
});
