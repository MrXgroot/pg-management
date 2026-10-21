import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useFinancials(propertyId, dateStr) {
  return useQuery({
    queryKey: queryKeys.properties.financials(propertyId, dateStr),
    queryFn: async () => {
      const params = dateStr ? { date: dateStr } : {};
      return await apiClient.get("/financials/summary", {
        params: {
          propertyId,
          ...params,
        },
      });
    },
    enabled: Boolean(propertyId),
  });
}
