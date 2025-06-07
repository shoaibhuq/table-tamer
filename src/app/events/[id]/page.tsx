"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import {
  ArrowLeft,
  Users,
  Calendar,
  Upload,
  Settings,
  Trash2,
  RotateCcw,
  Clock,
  Edit,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { authenticatedJsonFetch } from "@/lib/api";
import { TableEditDialog } from "@/components/ui/table-edit-dialog";
import { ThemeSelector } from "@/components/ui/theme-selector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Guest {
  id: string;
  name: string;
  phoneNumber: string | null;
  table: {
    id: string;
    name: string;
    color: string;
    capacity: number;
  } | null;
}

interface Table {
  id: string;
  name: string;
  color: string;
  capacity: number;
  guests: Guest[];
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  theme?: string;
  createdAt: string | { seconds: number; nanoseconds: number };
  updatedAt: string | { seconds: number; nanoseconds: number };
  guests: Guest[];
  tables: Table[];
  _count: {
    guests: number;
    tables: number;
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renamingTables, setRenamingTables] = useState(false);
  const [renameType, setRenameType] = useState<
    "numbers" | "letters" | "roman" | "custom-prefix"
  >("numbers");
  const [renamePrefix, setRenamePrefix] = useState("Table");

  const fetchEvent = async () => {
    try {
      const data = (await authenticatedJsonFetch(`/api/events/${eventId}`)) as {
        success: boolean;
        event?: Event;
        error?: string;
      };
      if (data.success && data.event) {
        setEvent(data.event);
        setEditName(data.event.name);
        setEditDescription(data.event.description || "");
      } else {
        setError(data.error || "Failed to fetch event.");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to fetch event.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleDeleteEvent = async () => {
    if (!event) return;

    if (
      !confirm(
        `Are you sure you want to delete "${event.name}"? This will permanently remove all associated guests and tables.`
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
        router.push("/events");
      } else {
        setError(data.error || "Failed to delete event.");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetEvent = async () => {
    if (!event) return;

    if (
      !confirm(
        `Are you sure you want to reset "${event.name}"? This will remove all tables and table assignments, but keep the guests.`
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
        await fetchEvent();
      } else {
        setError(data.error || "Failed to reset event.");
      }
    } catch (error) {
      console.error("Error resetting event:", error);
      setError("Failed to reset event.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = async () => {
    if (!editName.trim()) {
      setError("Event name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch(`/api/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      })) as { success: boolean; error?: string };

      if (data.success) {
        setSuccess("Event updated successfully!");
        setIsEditing(false);
        await fetchEvent();
      } else {
        setError(data.error || "Failed to update event.");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTable = async (
    tableId: string,
    updates: { name?: string; color?: string; capacity?: number }
  ) => {
    try {
      // Update locally first
      setEvent((prevEvent) => {
        if (!prevEvent) return prevEvent;
        return {
          ...prevEvent,
          tables: prevEvent.tables.map((table) =>
            table.id === tableId ? { ...table, ...updates } : table
          ),
        };
      });

      // Update in database
      await authenticatedJsonFetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      const updateTypes = Object.keys(updates);
      const message =
        updateTypes.length === 1
          ? `Table ${updateTypes[0]} updated successfully!`
          : "Table updated successfully!";

      setSuccess(message);
    } catch (error) {
      console.error("Error updating table:", error);
      setError("Failed to update table");

      // Revert local change on error
      await fetchEvent();
    }
  };

  const handleThemeChange = async (themeId: string) => {
    if (!event) return;

    setThemeLoading(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch(`/api/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify({
          theme: themeId,
        }),
      })) as { success: boolean; error?: string };

      if (data.success) {
        setSuccess("Theme updated successfully!");
        await fetchEvent();
      } else {
        setError(data.error || "Failed to update theme.");
      }
    } catch (error) {
      console.error("Error updating theme:", error);
      setError("Failed to update theme.");
    } finally {
      setThemeLoading(false);
    }
  };

  const handleRenameAllTables = async () => {
    if (!event?.tables.length) return;

    setRenamingTables(true);
    setError(null);

    try {
      // Use the batch rename API endpoint for better performance
      const data = (await authenticatedJsonFetch("/api/tables/batch-rename", {
        method: "PATCH",
        body: JSON.stringify({
          eventId: eventId,
          nameType: renameType,
          customPrefix:
            renameType === "custom-prefix" ? renamePrefix : undefined,
        }),
      })) as { success: boolean; message?: string; error?: string };

      if (data.success) {
        setSuccess(
          data.message ||
            `All tables renamed successfully using ${renameType} convention!`
        );
        setShowRenameDialog(false);
        await fetchEvent();
      } else {
        setError(data.error || "Failed to rename tables.");
      }
    } catch (error) {
      console.error("Error renaming tables:", error);
      setError("Failed to rename tables. Please try again.");
    } finally {
      setRenamingTables(false);
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

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
          <div className="max-w-6xl mx-auto px-4">
            {/* Header Skeleton */}
            <div className="mb-8 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-16 bg-gray-200 rounded"></div>
                  <div className="h-9 w-16 bg-gray-200 rounded"></div>
                  <div className="h-9 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <Card className="mb-8">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="h-9 w-32 bg-gray-200 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tables and Guests Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tables Skeleton */}
              <Card>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-16 bg-gray-200 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Guests Skeleton */}
              <Card>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
                      >
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-6 w-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !event) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Event Not Found
              </h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Link href="/events">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!event) return null;

  const assignedGuests = event.guests.filter((guest) => guest.table);
  const unassignedGuests = event.guests.filter((guest) => !guest.table);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/events"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Events
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-2xl font-bold"
                        placeholder="Event name"
                      />
                    </div>
                    <div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full p-2 border rounded-md resize-none"
                        rows={3}
                        placeholder="Event description (optional)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleEditEvent} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(event?.name || "");
                          setEditDescription(event?.description || "");
                          setError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {event.name}
                    </h1>
                    {event.description && (
                      <p className="text-lg text-gray-600 mb-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Created: {formatDate(event.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        Updated: {formatDate(event.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleResetEvent}
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteEvent}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Event
                </Button>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {success && (
              <p className="mt-3 text-sm text-green-600">{success}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {event._count.guests}
                </div>
                <div className="text-sm text-gray-500">Total Guests</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {event._count.tables}
                </div>
                <div className="text-sm text-gray-500">Tables</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {assignedGuests.length}
                </div>
                <div className="text-sm text-gray-500">Assigned</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {unassignedGuests.length}
                </div>
                <div className="text-sm text-gray-500">Unassigned</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href={`/events/${event.id}/import`}>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Guests
                  </Button>
                </Link>
                {event.guests.length === 0 ? (
                  <Button
                    variant="outline"
                    disabled={true}
                    title="Import guests first to enable table assignment"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Tables
                  </Button>
                ) : (
                  <Link href={`/assign?eventId=${event.id}`}>
                    <Button variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Assign Tables
                    </Button>
                  </Link>
                )}
                <Link
                  href={`/events/${event.id}/guest-view`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Guest View
                  </Button>
                </Link>
                <ThemeSelector
                  currentTheme={event.theme || "cosmic-purple"}
                  onThemeChange={handleThemeChange}
                  loading={themeLoading}
                />
                {event.tables.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRenameDialog(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Rename All Tables
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          {event.guests.length === 0 && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Get Started with Your Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-blue-700">
                    Welcome to your new event! Here&apos;s how to get started:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800">
                          Import Guests
                        </h4>
                        <p className="text-sm text-blue-600">
                          Upload a CSV file with your guest list
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-800">
                          Create Tables
                        </h4>
                        <p className="text-sm text-purple-600">
                          Set up tables and assign guests
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800">Share</h4>
                        <p className="text-sm text-green-600">
                          Share the guest view with attendees
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Link href={`/events/${event.id}/import`}>
                      <Button className="w-full md:w-auto">
                        <Upload className="w-4 h-4 mr-2" />
                        Start by Importing Guests
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share Guest View */}
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Share with Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm mb-3">
                Share this link so guests can find their table assignments for
                this event:
              </p>
              <div className="flex items-center gap-2 bg-white p-2 rounded border">
                <code className="flex-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/events/${event.id}/guest-view`
                    : `/events/${event.id}/guest-view`}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/events/${event.id}/guest-view`
                      );
                      setSuccess("Guest view link copied to clipboard!");
                    }
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tables and Guests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tables ({event.tables.length})</span>
                  <Settings className="w-5 h-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.tables.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {event.tables.map((table) => (
                      <div
                        key={table.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4"
                        style={{ borderLeftColor: table.color }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: table.color }}
                          />
                          <div>
                            <span className="font-medium">{table.name}</span>
                            <div className="text-sm text-gray-500">
                              Capacity: {table.capacity}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {table.guests.length} guests
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTable(table)}
                            className="h-8 w-8 p-0"
                            title="Edit table"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No tables created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Guests ({event.guests.length})</span>
                  <Users className="w-5 h-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.guests.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {event.guests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{guest.name}</div>
                          {guest.phoneNumber && (
                            <div className="text-sm text-gray-500">
                              {guest.phoneNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {guest.table ? (
                            <Badge
                              className="border-l-2"
                              style={{ borderLeftColor: guest.table.color }}
                            >
                              {guest.table.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No guests imported yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table Edit Dialog */}
        {editingTable && (
          <TableEditDialog
            table={editingTable}
            isOpen={!!editingTable}
            onSave={handleUpdateTable}
            onClose={() => setEditingTable(null)}
          />
        )}

        {/* Table Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename All Tables</DialogTitle>
              <DialogDescription>
                Choose a naming convention to rename all existing tables at
                once.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="numbers"
                    checked={renameType === "numbers"}
                    onChange={(e) =>
                      setRenameType(e.target.value as typeof renameType)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Numbers</div>
                    <div className="text-sm text-gray-500">1, 2, 3, 4...</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="letters"
                    checked={renameType === "letters"}
                    onChange={(e) =>
                      setRenameType(e.target.value as typeof renameType)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Letters</div>
                    <div className="text-sm text-gray-500">A, B, C, D...</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="roman"
                    checked={renameType === "roman"}
                    onChange={(e) =>
                      setRenameType(e.target.value as typeof renameType)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Roman Numerals</div>
                    <div className="text-sm text-gray-500">
                      I, II, III, IV...
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="custom-prefix"
                    checked={renameType === "custom-prefix"}
                    onChange={(e) =>
                      setRenameType(e.target.value as typeof renameType)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Custom Prefix + Numbers</div>
                    <div className="text-sm text-gray-500">
                      {renamePrefix} 1, {renamePrefix} 2...
                    </div>
                  </div>
                </label>
              </div>

              {renameType === "custom-prefix" && (
                <div className="space-y-2 border-t pt-4">
                  <label className="text-sm font-medium">Custom Prefix</label>
                  <Input
                    value={renamePrefix}
                    onChange={(e) => setRenamePrefix(e.target.value)}
                    placeholder="Enter prefix (e.g., Table, Desk, Section)"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
                disabled={renamingTables}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleRenameAllTables} disabled={renamingTables}>
                {renamingTables ? "Renaming..." : "Rename All Tables"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
