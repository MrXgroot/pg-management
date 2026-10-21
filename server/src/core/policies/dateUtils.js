// server/src/core/policies/dateUtils.js

const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validates strict YYYY-MM-DD calendar dates.
 * Enforces correct day counts per month and leap-year rules for February.
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== "string" || !ISO_DATE_REGEX.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split("-").map(Number);

  // UTC day 0 of the following month yields the exact number of days in the current month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/**
 * Asserts that a date string matches strict YYYY-MM-DD format.
 * Throws an error if invalid.
 *
 * @param {string} dateStr
 * @param {string} fieldName
 */
export function assertValidDate(dateStr, fieldName = "date") {
  if (!isValidDateString(dateStr)) {
    throw new Error(
      `Invalid calendar date for ${fieldName}: "${dateStr}". Must be a valid strict YYYY-MM-DD date.`,
    );
  }
}

/**
 * Adds months to a calendar date while preserving an anchor day.
 * Example: Jan 31 + 1 month -> Feb 28 (or Feb 29 in leap year) -> Mar 31.
 *
 * @param {string} startDateStr - Strict YYYY-MM-DD start date
 * @param {number} monthsToAdd - Number of months to add
 * @param {number} anchorDay - Original day of month to preserve (1-31)
 * @returns {string} - Strict YYYY-MM-DD target date
 */
export function addMonthsPreservingAnchor(
  startDateStr,
  monthsToAdd,
  anchorDay,
) {
  assertValidDate(startDateStr, "startDate");

  if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) {
    throw new Error(
      `Anchor day must be an integer between 1 and 31. Received: ${anchorDay}`,
    );
  }

  const [year, month] = startDateStr.split("-").map(Number);

  const totalMonths = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = (((totalMonths % 12) + 12) % 12) + 1;

  // Clamp anchor day to target month's maximum days
  const maxDays = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(anchorDay, maxDays);

  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");

  return `${targetYear}-${mm}-${dd}`;
}

/**
 * Checks if two half-open intervals [startA, endA) and [startB, endB) overlap.
 * An interval end of null/undefined indicates an ongoing (open-ended) interval.
 *
 * Rule: Adjacent intervals where endA === startB do NOT overlap.
 *
 * @param {string} startA - YYYY-MM-DD
 * @param {string|null} endA - YYYY-MM-DD or null
 * @param {string} startB - YYYY-MM-DD
 * @param {string|null} endB - YYYY-MM-DD or null
 * @returns {boolean}
 */
export function intervalsOverlap(startA, endA, startB, endB) {
  assertValidDate(startA, "startA");
  assertValidDate(startB, "startB");
  if (endA) assertValidDate(endA, "endA");
  if (endB) assertValidDate(endB, "endB");

  if (endA && startA >= endA) {
    throw new Error(
      `Interval A is invalid: start (${startA}) must be before end (${endA}).`,
    );
  }
  if (endB && startB >= endB) {
    throw new Error(
      `Interval B is invalid: start (${startB}) must be before end (${endB}).`,
    );
  }

  // [startA, endA) and [startB, endB) overlap iff startA < endB AND startB < endA
  const aStartsBeforeBEnds = !endB || startA < endB;
  const bStartsBeforeAEnds = !endA || startB < endA;

  return aStartsBeforeBEnds && bStartsBeforeAEnds;
}
