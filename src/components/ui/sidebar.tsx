"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Home,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  LogOut,
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
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-b border-gray-200 flex items-center transition-all duration-300",
          collapsed ? "p-2 justify-center" : "p-4 justify-between"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <Link
              href="/landing"
              className="p-1 rounded-md hover:bg-blue-50 transition-colors group"
              title="Go to Landing Page"
            >
              <Home className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                Table Tamer
              </h1>
              <Link
                href="/landing"
                className="ml-2 p-1 rounded-md hover:bg-blue-50 transition-colors group"
                title="Go to Landing Page"
              >
                <Home className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
              </Link>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "p-2" : "p-4"
        )}
      >
        <ul
          className={cn("space-y-1", collapsed && "flex flex-col items-center")}
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className={collapsed ? "w-full" : ""}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center text-sm font-medium transition-all duration-200 relative cursor-pointer",
                    collapsed
                      ? "w-12 h-12 justify-center rounded-lg p-0 hover:scale-105"
                      : "px-3 py-3 rounded-lg",
                    isActive
                      ? collapsed
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300 shadow-md"
                        : "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    collapsed && "hover:bg-gray-100"
                  )}
                  title={
                    collapsed ? `${item.name} - ${item.description}` : undefined
                  }
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      collapsed ? "w-5 h-5" : "w-5 h-5",
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 group-hover:text-gray-700",
                      collapsed && "group-hover:scale-110"
                    )}
                  />
                  {!collapsed && (
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  )}

                  {/* Active indicator for collapsed state */}
                  {collapsed && isActive && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l-full shadow-sm" />
                  )}

                  {/* Hover indicator for collapsed state */}
                  {collapsed && !isActive && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-300 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className={cn("border-t border-gray-200 p-4", collapsed && "p-2")}>
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {getUserInitials(user?.displayName || "")}
              </span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-red-50 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {getUserInitials(user?.displayName || "")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <LogOut className="mr-2 h-3 w-3" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
