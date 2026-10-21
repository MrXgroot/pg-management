import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen.jsx";
import { TenantsScreen } from "../screens/tenants/TenantsScreen.jsx";
import { PaymentsScreen } from "../screens/payments/PaymentsScreen.jsx";
import { ManageStructureScreen } from "../screens/manage/ManageStructureScreen.jsx";
import { MoreScreen } from "../screens/more/MoreScreen.jsx";

function NotFoundScreen() {
  return (
    <section className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-2xs">
      <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
      <p className="mt-1 text-sm text-slate-500">
        The destination you navigated to does not exist.
      </p>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardScreen />,
      },
      {
        path: "tenants",
        element: <TenantsScreen />,
      },
      {
        path: "payments",
        element: <PaymentsScreen />,
      },
      {
        path: "properties/manage",
        element: <ManageStructureScreen />,
      },
      {
        path: "more",
        element: <MoreScreen />,
      },
      {
        path: "*",
        element: <NotFoundScreen />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
