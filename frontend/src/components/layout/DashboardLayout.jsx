import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Bot,
  Wrench,
  Database,
  BarChart3,
  Settings,
  Menu,
  X,
  Phone,
  MessageSquare,
  Workflow,
  Plug,
  MonitorPlay,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const buildItems = [
  { path: "/agents", icon: Bot, label: "Agents" },
  { path: "/tools", icon: Wrench, label: "Tools" },
];

const manageItems = [
  { path: "/knowledge", icon: Database, label: "Knowledge" },
  { path: "/integrations", icon: Plug, label: "Integrations" },
];

const monitorItems = [
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
      (item.path !== "/" && location.pathname.startsWith(item.path));
    
    return (
      <NavLink
        to={item.path}
        data-testid={`nav-${item.label.toLowerCase()}`}
        className={cn(
          "sidebar-item",
          isActive && "active"
        )}
      >
        <Icon className="w-5 h-5" />
        {sidebarOpen && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar - Dark */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen sidebar transition-all duration-300",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <span className="font-semibold text-white text-lg">AgentForge</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="sidebar-toggle"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin">
            {/* Dashboard */}
            <NavLink
              to="/"
              data-testid="nav-dashboard"
              className={cn(
                "sidebar-item mb-2",
                location.pathname === "/" && "active"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              {sidebarOpen && <span>Dashboard</span>}
            </NavLink>

            {/* BUILD Section */}
            {sidebarOpen && <div className="sidebar-section">Build</div>}
            {buildItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}

            {/* MANAGE Section */}
            {sidebarOpen && <div className="sidebar-section">Manage</div>}
            {manageItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}

            {/* MONITOR Section */}
            {sidebarOpen && <div className="sidebar-section">Monitor</div>}
            {monitorItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-3 border-t border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>All systems operational</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          sidebarOpen ? "ml-56" : "ml-16"
        )}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
