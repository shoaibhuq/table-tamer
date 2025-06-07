"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Upload,
  Users,
  Settings,
  LogOut,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user, userProfile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/landing");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
          <div className="max-w-6xl mx-auto px-4">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 animate-pulse">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-80"></div>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <div className="h-9 w-20 bg-gray-200 rounded"></div>
                <div className="h-9 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card Skeleton */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="animate-pulse">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className="p-6 rounded-lg animate-pulse bg-gray-50"
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded mb-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity Skeleton */}
                <Card className="shadow-lg mt-6">
                  <CardHeader>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-40 mx-auto"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const quickActions = [
    {
      title: "Create Event",
      description: "Start planning a new event",
      icon: Calendar,
      href: "/events",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      title: "Import Guests",
      description: "Upload a guest list",
      icon: Upload,
      href: "/events",
      color: "bg-green-50 text-green-600 hover:bg-green-100",
    },
    {
      title: "Assign Tables",
      description: "Manage seating arrangements",
      icon: Users,
      href: "/assign",
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
    {
      title: "Guest View",
      description: "Find table assignments",
      icon: Search,
      href: "/guest-view",
      color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
      openInNewTab: true,
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back,{" "}
                {userProfile?.displayName || user.displayName || "User"}!
              </h1>
              <p className="text-gray-600">
                Manage your events and guest lists from your dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button asChild variant="outline">
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">
                        {(userProfile?.displayName ||
                          user.displayName ||
                          "U")[0].toUpperCase()}
                      </span>
                    </div>
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    {user.emailVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>

                  {userProfile?.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{userProfile.phoneNumber}</p>
                      </div>
                      {userProfile.phoneVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">
                      Account Status
                    </span>
                    <Badge
                      variant={user.emailVerified ? "default" : "secondary"}
                    >
                      {user.emailVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  {!user.emailVerified && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Verify Email
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with your event management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <Link
                        key={index}
                        href={action.href}
                        target={action.openInNewTab ? "_blank" : undefined}
                        rel={
                          action.openInNewTab
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <div
                          className={`p-6 rounded-lg transition-all duration-200 cursor-pointer ${action.color}`}
                        >
                          <action.icon className="w-8 h-8 mb-3" />
                          <h3 className="font-semibold mb-2">{action.title}</h3>
                          <p className="text-sm opacity-75">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Placeholder */}
              <Card className="shadow-lg mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest events and actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">
                      Start by creating your first event!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Table Naming Quick Setup */}
              <Card className="shadow-lg mt-6 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Settings className="w-5 h-5 mr-2" />
                    Table Naming Setup
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Set your default table naming preference for creating new
                    tables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          value: "numbers",
                          label: "Numbers",
                          example: "1, 2, 3...",
                          color: "bg-blue-100 text-blue-800",
                        },
                        {
                          value: "letters",
                          label: "Letters",
                          example: "A, B, C...",
                          color: "bg-green-100 text-green-800",
                        },
                        {
                          value: "roman",
                          label: "Roman",
                          example: "I, II, III...",
                          color: "bg-purple-100 text-purple-800",
                        },
                        {
                          value: "custom",
                          label: "Custom",
                          example: "Table 1, 2...",
                          color: "bg-orange-100 text-orange-800",
                        },
                      ].map((option) => (
                        <div
                          key={option.value}
                          className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-600">
                                {option.example}
                              </div>
                            </div>
                            <Badge className={option.color}>
                              {option.label}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-blue-200">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Link href="/profile">
                          <Settings className="w-4 h-4 mr-2" />
                          Customize Table Naming
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
