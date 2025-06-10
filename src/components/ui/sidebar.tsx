"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Events",
    href: "/events",
    icon: Calendar,
    description: "Manage events",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: UserCircle,
    description: "Account settings",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = (displayName?: string) => {
    if (!displayName) return "U";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/50 flex flex-col transition-all duration-300 shadow-xl backdrop-blur-sm",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-b border-gray-200/50 flex items-center transition-all duration-300 bg-white/80 backdrop-blur-sm",
          collapsed ? "p-3 justify-center" : "p-4 justify-between"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <Link
              href="/dashboard"
              className="group relative"
              title="Table Tamer - Go to Dashboard"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-300 group"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="group flex items-center space-x-3"
                title="Go to Dashboard"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
                    Table Tamer
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    Event Planning
                  </p>
                </div>
              </Link>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 transition-all duration-300 pt-6",
          collapsed ? "px-2" : "px-4"
        )}
      >
        <ul
          className={cn("space-y-2", collapsed && "flex flex-col items-center")}
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className={collapsed ? "w-full" : ""}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center text-sm font-medium transition-all duration-300 relative cursor-pointer",
                    collapsed
                      ? "w-12 h-12 justify-center rounded-xl p-0 hover:scale-110"
                      : "px-4 py-3 rounded-xl",
                    isActive
                      ? collapsed
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl scale-105"
                        : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-lg"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 hover:text-gray-900 hover:shadow-md",
                    collapsed &&
                      "hover:bg-gradient-to-br hover:from-blue-400 hover:to-purple-500 hover:text-white"
                  )}
                  title={
                    collapsed ? `${item.name} - ${item.description}` : undefined
                  }
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 transition-all duration-300",
                      collapsed ? "w-5 h-5" : "w-5 h-5",
                      isActive
                        ? collapsed
                          ? "text-white"
                          : "text-blue-600"
                        : "text-gray-500 group-hover:text-gray-700",
                      collapsed && "group-hover:scale-125",
                      collapsed && isActive && "text-white"
                    )}
                  />
                  {!collapsed && (
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        {item.description}
                      </div>
                    </div>
                  )}

                  {/* Active indicator for collapsed state */}
                  {collapsed && isActive && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-full shadow-lg" />
                  )}

                  {/* Hover glow effect */}
                  {!collapsed && isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div
        className={cn(
          "border-t border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm",
          collapsed ? "p-3" : "p-4"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">
                {getUserInitials(user?.displayName || "")}
              </span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 hover:bg-red-50 hover:text-red-600 transition-all duration-300 rounded-xl group"
              title="Logout"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-sm font-bold text-white">
                  {getUserInitials(user?.displayName || "")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
