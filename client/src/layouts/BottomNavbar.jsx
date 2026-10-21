import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Building,
  Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/properties/manage", label: "Manage", icon: Building },
  { to: "/more", label: "More", icon: Menu },
];

export function BottomNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-slate-200 bg-white px-2">
      <div className="mx-auto flex h-full max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1.5 transition-colors ${
                isActive
                  ? "text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] tracking-tight">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
