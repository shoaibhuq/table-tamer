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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Event Management
            </h1>
            <p className="text-xl text-gray-600">
              Manage your saved events and table assignments
            </p>
          </div>

          {/* Create Event Button */}
          <div className="mb-8">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mb-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Enter a name and description for your new event to get
                    started.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Event Name
                    </label>
                    <Input
                      placeholder="Event name..."
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateEvent();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Event description..."
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent} disabled={loading}>
                    {loading ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 mb-4">{success}</p>
            )}
          </div>

          {/* Events Grid */}
          {fetchingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Skeleton Loaders */}
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats Skeleton */}
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                      </div>

                      {/* Dates Skeleton */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                        </div>
                      </div>

                      {/* Actions Skeleton */}
                      <div className="flex gap-2 pt-2">
                        <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{event.name}</span>
                      <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {event._count.guests} guests
                        </Badge>
                        <Badge variant="outline">
                          {event._count.tables} tables
                        </Badge>
                      </div>

                      {/* Dates */}
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created: {formatDate(event.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          Updated: {formatDate(event.updatedAt)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/events/${event.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetEvent(event.id, event.name)}
                          disabled={loading}
                          title="Reset tables and assignments"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteEvent(event.id, event.name)
                          }
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Events Found
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first event to get started with table assignments
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create Your First Event
              </Button>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
