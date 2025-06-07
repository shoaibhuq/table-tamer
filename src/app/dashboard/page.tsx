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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
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
                  <div className="grid md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                      <Link key={index} href={action.href}>
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
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
