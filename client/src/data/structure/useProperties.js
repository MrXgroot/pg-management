import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/httpClient.js";
import { queryKeys } from "../../api/queryKeys.js";

export function useProperties() {
  return useQuery({
    queryKey: queryKeys.properties.all,
    queryFn: async () => {
      return await apiClient.get("/properties");
    },
  });
}
