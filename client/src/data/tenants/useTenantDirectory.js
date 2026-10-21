import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useTenantDirectory({
  propertyId,
  status,
  search,
  paymentStatus,
}) {
  const filters = {
    propertyId,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
  };

  return useQuery({
    queryKey: queryKeys.tenants.list(filters),
    queryFn: async () => {
      return await apiClient.get("/tenants", { params: filters });
    },
    enabled: Boolean(propertyId),
  });
}
