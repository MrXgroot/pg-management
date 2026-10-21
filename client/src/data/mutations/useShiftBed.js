import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useShiftBed(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, targetBedId, shiftDate }) => {
      return await apiClient.post(`/tenants/${tenantId}/shift-bed`, {
        targetBedId,
        shiftDate,
      });
    },
    onSuccess: (_data, variables) => {
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
      if (variables?.tenantId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenants.ledger(variables.tenantId),
        });
      }
    },
  });
}
