import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useCheckoutTenant(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, checkoutDate }) => {
      return await apiClient.post(`/tenants/${tenantId}/checkout`, {
        checkoutDate,
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

export function useSettleDeposit(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, depositId, deductions = [] }) => {
      return await apiClient.post(`/tenants/${tenantId}/settle-deposit`, {
        depositId,
        deductions,
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
