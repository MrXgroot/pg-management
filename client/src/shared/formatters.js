/**
 * Formats an integer amount in paise to Indian Rupee currency string.
 * Example: 800000 -> "₹8,000", 800050 -> "₹8,000.50"
 * @param {number} paise
 * @returns {string}
 */
export function formatPaiseToRupees(paise = 0) {
  if (typeof paise !== "number" || isNaN(paise)) return "₹0";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Converts a standard Rupee string/number input to integer paise.
 * Disallows negative values.
 * Example: "8000" -> 800000, "8,000.50" -> 800050
 * @param {string|number} rupeeAmount
 * @returns {number}
 */
export function parseRupeesToPaise(rupeeAmount) {
  const numeric =
    parseFloat(String(rupeeAmount).replace(/[^0-9.-]+/g, "")) || 0;
  if (numeric < 0) return 0;
  return Math.round(numeric * 100);
}

/**
 * Formats YYYY-MM-DD calendar date to human display string (e.g., "11 Oct 2026").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Formats a 10-digit Indian mobile number to a readable format (e.g., "+91 98765 43210" or "98765 43210").
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone = "") {
  if (!phone) return "—";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
