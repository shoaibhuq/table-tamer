"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import { authenticatedJsonFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Calendar,
  Users,
  Trash2,
  RotateCcw,
  Eye,
  Edit,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  name: string;
  description: string | null;
  createdAt: string | { seconds: number; nanoseconds: number };
  updatedAt: string | { seconds: number; nanoseconds: number };
  _count: {
    guests: number;
    tables: number;
  };
}

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const router = useRouter();

  const fetchEvents = useCallback(async () => {
    if (!user) {
      console.log("No user available, skipping fetchEvents");
      setFetchingEvents(false);
      return;
    }

    try {
      console.log("Starting fetchEvents for user:", user.uid);
      setError(null); // Clear any previous errors
      setFetchingEvents(true);
      const data = (await authenticatedJsonFetch("/api/events")) as {
        success: boolean;
        events?: Event[];
        error?: string;
      };
      if (data.success) {
        setEvents(data.events || []);
        console.log("Successfully fetched events:", data.events?.length || 0);
      } else {
        setError(data.error || "Failed to fetch events.");
      }
    } catch (error) {
      console.error("Error in fetchEvents:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch events."
      );
    } finally {
      setFetchingEvents(false);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch events when user is authenticated and not loading
    if (user && !authLoading) {
      fetchEvents();
    } else if (!authLoading && !user) {
      // User not authenticated, stop loading
      setFetchingEvents(false);
    }
  }, [user, authLoading, fetchEvents]);

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) {
      setError("Please enter an event name.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = (await authenticatedJsonFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({
          name: newEventName.trim(),
          description: newEventDescription.trim() || null,
        }),
      })) as { success: boolean; error?: string; event?: { id: string } };

      if (data.success && data.event) {
        setSuccess("Event created successfully!");
        setNewEventName("");
        setNewEventDescription("");
        setCreateDialogOpen(false);
        // Redirect to the new event's detail page
        router.push(`/events/${data.event.id}`);
      } else {
        setError(data.error || "Failed to create event.");
      }
    } catch {
      setError("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${eventName}"? This will permanently remove all associated guests and tables.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })) as { success: boolean; error?: string };

      if (data.success) {
        setSuccess("Event deleted successfully!");
        await fetchEvents();
      } else {
        setError(data.error || "Failed to delete event.");
      }
    } catch {
      setError("Failed to delete event.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetEvent = async (eventId: string, eventName: string) => {
    if (
      !confirm(
        `Are you sure you want to reset "${eventName}"? This will remove all tables and table assignments, but keep the guests.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch(
        `/api/events/${eventId}/reset`,
        {
          method: "POST",
        }
      )) as { success: boolean; error?: string };

      if (data.success) {
        setSuccess("Event reset successfully!");
        await fetchEvents();
      } else {
        setError(data.error || "Failed to reset event.");
      }
    } catch {
      setError("Failed to reset event.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (
    dateValue: string | { seconds: number; nanoseconds: number }
  ) => {
    try {
      let date: Date;

      // Handle Firestore Timestamp objects
      if (
        typeof dateValue === "object" &&
        dateValue !== null &&
        "seconds" in dateValue
      ) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === "string") {
        date = new Date(dateValue);
      } else {
        return "Invalid date";
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

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
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Event Management
              </h1>
              <Sparkles className="w-8 h-8 text-yellow-500 ml-4 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Create, manage, and orchestrate unforgettable events with our
              <span className="font-semibold text-blue-600">
                {" "}
                AI-powered platform
              </span>
            </p>
          </div>

          {/* Create Event Button */}
          <div className="mb-12 text-center">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg px-8 py-4">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Event ✨
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader>
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      Create New Event
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-gray-600 text-lg">
                    Start planning your next unforgettable event with our
                    intelligent platform
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Event Name *
                    </label>
                    <Input
                      placeholder="Wedding Reception, Corporate Gala, Birthday Party..."
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateEvent();
                        }
                      }}
                      className="text-lg py-3 border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Share details about your event, theme, or special requirements..."
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 text-lg"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="border-2 border-gray-300 hover:border-gray-400 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Event
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl max-w-md mx-auto flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                <p className="text-emerald-700 font-medium">{success}</p>
              </div>
            )}
          </div>

          {/* Events Grid */}
          {fetchingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Skeleton Loaders */}
              {[...Array(6)].map((_, index) => (
                <Card
                  key={index}
                  className="animate-pulse shadow-xl border-0 overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-xl"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
                        <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                        <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <CardTitle className="flex items-center justify-between group">
                      <span className="truncate text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                        {event.name}
                      </span>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl flex-shrink-0">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </CardTitle>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex gap-3">
                        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300 shadow-sm">
                          <Users className="w-3 h-3 mr-1" />
                          {event._count.guests} guests
                        </Badge>
                        <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300 shadow-sm">
                          <Star className="w-3 h-3 mr-1" />
                          {event._count.tables} tables
                        </Badge>
                      </div>

                      {/* Dates */}
                      <div className="text-sm text-gray-500 space-y-2 bg-gray-50/80 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">Created:</span>
                          <span>{formatDate(event.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Edit className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">Updated:</span>
                          <span>{formatDate(event.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/events/${event.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 group/btn"
                          >
                            <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                            View Event
                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetEvent(event.id, event.name)}
                          disabled={loading}
                          className="border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group/reset"
                          title="Reset tables and assignments"
                        >
                          <RotateCcw className="w-4 h-4 group-hover/reset:rotate-180 transition-transform duration-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteEvent(event.id, event.name)
                          }
                          disabled={loading}
                          className="border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-300 group/delete"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform duration-300" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-16 text-center shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Create Your First Event? ✨
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                  Transform your vision into reality with our intelligent event
                  planning platform. From intimate gatherings to grand
                  celebrations, we&apos;ve got you covered.
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg px-8 py-4"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Event
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
