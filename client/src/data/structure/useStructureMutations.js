import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, address }) => {
      return await apiClient.post("/properties", { name, address });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}

export function useCreateFloor(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, displayOrder }) => {
      return await apiClient.post("/floors", {
        propertyId,
        name,
        displayOrder,
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}

export function useCreateRoom(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ floorId, roomNumber }) => {
      return await apiClient.post("/rooms", {
        floorId,
        roomNumber,
      });
    },
    onSuccess: () => {
      if (propertyId) {
        queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "occupancy"],
        });
      }
    },
  });
}

export function useCreateBed(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, bedLabel }) => {
      return await apiClient.post("/beds", {
        roomId,
        bedLabel,
        isActive: true,
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

export function useDeleteBed(propertyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId }) => {
      return await apiClient.delete(`/beds/${bedId}`);
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
