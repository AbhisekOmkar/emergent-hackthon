import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Bot,
  Wrench,
  Database,
  BarChart3,
  Settings,
  Menu,
  X,
  Plug,
  Workflow,
  BookOpen,
  Sparkles,
  HelpCircle,
  Bell,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

const buildItems = [
  { path: "/agents", icon: Bot, label: "Agents", description: "AI assistants" },
  { path: "/flows", icon: Workflow, label: "Flows", description: "Visual builder" },
  { path: "/tools", icon: Wrench, label: "Tools", description: "Custom actions" },
];

const manageItems = [
  { path: "/knowledge", icon: BookOpen, label: "Knowledge", description: "Training data" },
  { path: "/integrations", icon: Plug, label: "Integrations", description: "Connect apps" },
];

const monitorItems = [
  { path: "/analytics", icon: BarChart3, label: "Analytics", description: "Performance" },
  { path: "/settings", icon: Settings, label: "Settings", description: "Configuration" },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
      (item.path !== "/" && location.pathname.startsWith(item.path));
    
    return (
      <NavLink
        to={item.path}
        data-testid={`nav-${item.label.toLowerCase()}`}
        className={cn(
          "sidebar-item group",
          isActive && "active"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && (
          <div className="flex-1 min-w-0">
            <span className="block truncate">{item.label}</span>
            {item.description && (
              <span className="text-xs opacity-60 block truncate">{item.description}</span>
            )}
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      {/* Sidebar - Dark */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen sidebar transition-all duration-200 ease-out",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <span className="font-bold text-white text-lg tracking-tight">Intelliax</span>
                  <span className="text-[10px] text-gray-500 block -mt-0.5">AI Agent Platform</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-white hover:bg-white/5 h-8 w-8 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="sidebar-toggle"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
            {/* Dashboard */}
            <NavLink
              to="/"
              data-testid="nav-dashboard"
              className={cn(
                "sidebar-item group mb-2",
                location.pathname === "/" && "active"
              )}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <span className="block truncate">Dashboard</span>
                  <span className="text-xs opacity-60 block truncate">Overview</span>
                </div>
              )}
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
            <div className="p-3 border-t border-white/5">
              {/* Upgrade Card */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 mb-3 transition-all hover:border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-white block">Upgrade to Pro</span>
                    <span className="text-[10px] text-gray-500">Unlimited everything</span>
                  </div>
                </div>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-md font-medium shadow-sm">
                  Upgrade Now
                </Button>
              </div>
              
              {/* Status */}
              <div className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-200 ease-out",
          sidebarOpen ? "ml-60" : "ml-16"
        )}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Breadcrumb or search could go here */}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="w-px h-6 bg-gray-200" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || user.username} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-3.5rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
