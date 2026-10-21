import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useOccupancy(propertyId, dateStr) {
  return useQuery({
    queryKey: queryKeys.properties.occupancy(propertyId, dateStr),
    queryFn: async () => {
      const params = dateStr ? { date: dateStr } : {};
      return await apiClient.get(`/properties/${propertyId}/occupancy`, {
        params,
      });
    },
    enabled: Boolean(propertyId),
  });
}
