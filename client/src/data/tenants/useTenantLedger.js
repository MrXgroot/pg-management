import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useTenantLedger(tenantId) {
  return useQuery({
    queryKey: queryKeys.tenants.ledger(tenantId),
    queryFn: async () => {
      return await apiClient.get(`/tenants/${tenantId}/ledger`);
    },
    enabled: Boolean(tenantId),
  });
}
