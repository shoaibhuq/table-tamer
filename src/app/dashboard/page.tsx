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
  Users,
  Settings,
  LogOut,
  Mail,
  Phone,
  CheckCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  XCircle,
  UserMinus,
  Table,
  Trash2,
  User,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRealTimeStats } from "@/hooks/useRealTimeStats";

export default function DashboardPage() {
  const { user, userProfile, loading, logout } = useAuth();
  const { stats, recentActivity } = useRealTimeStats();
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 animate-pulse">
              <div>
                <div className="h-10 bg-gray-200 rounded w-96 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-80"></div>
              </div>
              <div className="flex items-center space-x-4 mt-6 md:mt-0">
                <div className="h-11 w-28 bg-gray-200 rounded-lg"></div>
                <div className="h-11 w-24 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="p-6 rounded-xl bg-gray-50">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
                          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
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

  if (!user) {
    return null; // Will redirect to login
  }

  const quickActions = [
    {
      title: "Create Event",
      description: "Start planning a new event",
      icon: Calendar,
      href: "/events/create",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50/80",
      count: "Start Fresh",
    },
    {
      title: "Manage Events",
      description: "View and manage your existing events",
      icon: Settings,
      href: "/events",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50/80",
      count: "View All",
    },
  ];

  const displayStats = [
    {
      title: "Total Events",
      value: stats.totalEvents.toString(),
      change: `+${stats.weeklyChange.events} this week`,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Guests Managed",
      value: stats.totalGuests.toLocaleString(),
      change: `+${stats.weeklyChange.guests} this week`,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Tables Assigned",
      value: stats.totalTables.toString(),
      change: `+${stats.weeklyChange.tables} this week`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const formatActivityTime = (timestamp: unknown) => {
    if (!timestamp) return "Unknown time";

    try {
      const date = (timestamp as { toDate: () => Date }).toDate
        ? (timestamp as { toDate: () => Date }).toDate()
        : new Date(timestamp as string);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return "Just now";
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString();
    } catch {
      return "Unknown time";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event_created":
        return CheckCircle;
      case "event_deleted":
        return XCircle;
      case "event_updated":
        return Settings;
      case "event_completed":
        return CheckCircle;
      case "guests_imported":
      case "guest_added":
        return Users;
      case "guest_deleted":
        return UserMinus;
      case "tables_assigned":
      case "table_created":
      case "tables_created":
        return Table;
      case "table_deleted":
      case "tables_deleted":
        return Trash2;
      case "profile_updated":
        return User;
      case "theme_changed":
        return Sparkles;
      case "appearance_customized":
        return Settings;
      case "appearance_reset":
        return RotateCcw;
      default:
        return Clock;
    }
  };

  const getActivityStatus = (type: string) => {
    switch (type) {
      case "event_deleted":
      case "guest_deleted":
      case "table_deleted":
      case "tables_deleted":
        return "deleted";
      case "event_completed":
        return "completed";
      case "guests_imported":
      case "tables_assigned":
      case "theme_changed":
      case "appearance_customized":
      case "appearance_reset":
        return "completed";
      default:
        return "in-progress";
    }
  };

  const firstName =
    userProfile?.displayName?.split(" ")[0] ||
    user.displayName?.split(" ")[0] ||
    "User";

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <div className="flex items-center mb-3">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Welcome back, {firstName}! 👋
                </h1>
                <Sparkles className="w-8 h-8 text-yellow-500 ml-3 animate-pulse" />
              </div>
              <p className="text-xl text-gray-600 leading-relaxed">
                Ready to create some{" "}
                <span className="font-semibold text-blue-600">table magic</span>
                ? Your events are waiting!
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-6 md:mt-0">
              <Button
                asChild
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
              >
                <Link href="/profile">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayStats.map((stat, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {stat.change}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Quick Actions
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-lg">
                        Jump into your most common tasks
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {quickActions.map((action, index) => (
                      <Link
                        key={index}
                        href={action.href}
                        className="group block cursor-pointer"
                      >
                        <div
                          className={`relative p-6 rounded-2xl ${action.bgColor} border border-white/50 hover:shadow-xl transition-all duration-500 overflow-hidden group-hover:scale-105`}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                          ></div>
                          <div className="relative z-10">
                            <div
                              className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
                            >
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-300">
                              {action.title}
                            </h3>
                            <p className="text-gray-600 mb-3 leading-relaxed">
                              {action.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="secondary"
                                className="bg-white/80 text-gray-600"
                              >
                                {action.count}
                              </Badge>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mt-8">
                <CardHeader>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Recent Activity
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Your latest event planning updates
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors">
                    <div className="space-y-4 pr-2">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => {
                          const ActivityIcon = getActivityIcon(activity.type);
                          const status = getActivityStatus(activity.type);

                          return (
                            <div
                              key={activity.id || index}
                              className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50/80 transition-colors duration-300 group"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  status === "deleted"
                                    ? "bg-red-100"
                                    : status === "completed"
                                    ? "bg-emerald-100"
                                    : "bg-blue-100"
                                } group-hover:scale-110 transition-transform duration-300`}
                              >
                                <ActivityIcon
                                  className={`w-5 h-5 ${
                                    status === "deleted"
                                      ? "text-red-600"
                                      : status === "completed"
                                      ? "text-emerald-600"
                                      : "text-blue-600"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                                  {activity.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {activity.description}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {formatActivityTime(activity.timestamp)}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  status === "deleted"
                                    ? "destructive"
                                    : status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  status === "deleted"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : status === "completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-blue-100 text-blue-700"
                                }
                              >
                                {status === "deleted"
                                  ? "Deleted"
                                  : status === "completed"
                                  ? "Complete"
                                  : "In Progress"}
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No recent activity</p>
                          <p className="text-xs mt-1">
                            Activity will appear here as you use the app
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm sticky top-8">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-2xl font-bold text-white">
                      {userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                        user.displayName?.charAt(0)?.toUpperCase() ||
                        user.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {userProfile?.displayName || user.displayName || "User"}
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    ✨ Event Planner
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.email && (
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors duration-300">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-sm text-gray-900 truncate">
                          {user.email}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}

                  {userProfile?.phoneNumber && (
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors duration-300">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Phone
                        </p>
                        <p className="text-sm text-gray-900">
                          {userProfile.phoneNumber}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Account Status</span>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/profile">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
