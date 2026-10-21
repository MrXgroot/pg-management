/**
 * Authoritative TanStack Query key factory matching implemented contracts.
 */
export const queryKeys = {
  properties: {
    all: ["properties"],
    detail: (id) => ["properties", id],
    occupancy: (propertyId, date) => [
      "properties",
      propertyId,
      "occupancy",
      date ?? "latest",
    ],
    financials: (propertyId, date) => [
      "properties",
      propertyId,
      "financials",
      date ?? "latest",
    ],
  },
  tenants: {
    all: ["tenants"],
    list: (filters = {}) => ["tenants", "list", filters],
    ledger: (tenantId) => ["tenants", tenantId, "ledger"],
  },
};
