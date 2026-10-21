import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropertyProvider } from "../context/PropertyContext.jsx";
import { useProperties } from "../data/structure/useProperties.js";

function PropertyStateBridge({ children }) {
  const { data: properties = [] } = useProperties();

  return (
    <PropertyProvider initialProperties={properties}>
      {children}
    </PropertyProvider>
  );
}

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PropertyStateBridge>{children}</PropertyStateBridge>
    </QueryClientProvider>
  );
}
