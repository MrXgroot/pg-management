import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";

export function useToggleBedActive(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId, isActive }) => {
      return await apiClient.patch(`/beds/${bedId}/toggle-active`, {
        isActive,
      });
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
    },
  });
}
