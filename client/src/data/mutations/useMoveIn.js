import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useMoveIn(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await apiClient.post("/tenants/move-in", payload);
    },
    onSuccess: () => {
      if (propertyId) {
        queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "occupancy"],
        });
        queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "financials"],
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenants.all,
      });
    },
  });
}
