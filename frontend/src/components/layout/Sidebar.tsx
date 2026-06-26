import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Bell,
  Activity,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useIncidents, useAlerts } from "../../hooks/useWindOps";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: incidents } = useIncidents();
  const { data: alerts } = useAlerts();

  const openIncidents =
    incidents?.filter((i) => i.status !== "resolved").length ?? 0;
  const unacknowledgedAlerts =
    alerts?.filter((a) => !a.acknowledged).length ?? 0;

  const navItems: NavItem[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/simulate", label: "Simulation", icon: Radio },
    {
      to: "/incidents",
      label: "Incidents",
      icon: AlertTriangle,
      badge: openIncidents > 0 ? openIncidents : undefined,
    },
    {
      to: "/alerts",
      label: "Alertes",
      icon: Bell,
      badge: unacknowledgedAlerts > 0 ? unacknowledgedAlerts : undefined,
    },
    { to: "/metrics", label: "Métriques", icon: Activity },
    { to: "/emails", label: "Emails", icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sm font-bold text-sky-400">
          WO
        </div>
        {!collapsed && (
          <span className="truncate text-base font-semibold text-slate-100">
            WindOps
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-l-2 border-sky-400 bg-sky-900/50 text-sky-400"
                  : "border-l-2 border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
