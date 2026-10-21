import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useUpdateProperty(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, address }) => {
      return await apiClient.patch(`/properties/${propertyId}`, {
        name,
        address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
      if (propertyId) {
        queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "occupancy"],
        });
        queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "financials"],
        });
      }
    },
  });
}
