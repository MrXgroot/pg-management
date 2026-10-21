import { Outlet } from "react-router-dom";
import { TopAppBar } from "./TopAppBar.jsx";
import { BottomNavbar } from "./BottomNavbar.jsx";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <TopAppBar />
      <main className="flex-1 pb-20 pt-2">
        <div className="mx-auto max-w-5xl px-4">
          <Outlet />
        </div>
      </main>
      <BottomNavbar />
    </div>
  );
}
