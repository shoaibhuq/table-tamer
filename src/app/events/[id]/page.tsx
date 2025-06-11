"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UserPlus,
  AlertCircle,
  CheckCircle,
  UserMinus,
  UserX,
  Search,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { authenticatedJsonFetch } from "@/lib/api";
// Removed unused import
import { TableEditDialog } from "@/components/ui/table-edit-dialog";
import { GuestEditDialog } from "@/components/ui/guest-edit-dialog";
import { Guest as FirestoreGuest } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import {
  logGuestAdded,
  logGuestDeleted,
  logEventUpdated,
} from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to get full name from local Guest interface
const getDisplayName = (guest: Guest): string => {
  if (guest.firstName || guest.lastName) {
    return `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  }
  return guest.name || "";
};

// Helper function to match guest search for local Guest interface
const matchesLocalGuestSearch = (guest: Guest, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase();
  const fullName = getDisplayName(guest).toLowerCase();
  const firstName = (guest.firstName || "").toLowerCase();
  const lastName = (guest.lastName || "").toLowerCase();
  const email = (guest.email || "").toLowerCase();
  const phone = (guest.phoneNumber || "").toLowerCase();

  return (
    fullName.includes(term) ||
    firstName.includes(term) ||
    lastName.includes(term) ||
    email.includes(term) ||
    phone.includes(term) ||
    (guest.name || "").toLowerCase().includes(term)
  );
};
import { ThemeSelector } from "@/components/ui/theme-selector";
import { EventLinksManager } from "@/components/event-links-manager";
import { EventLink } from "@/lib/firestore";
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
  name: string; // Keep for backward compatibility
  firstName?: string;
  lastName?: string;
  phoneNumber: string | null;
  email?: string | null;
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
  const { user } = useAuth();
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

  // Guest addition state
  const [addGuestDialogOpen, setAddGuestDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestSuccess, setGuestSuccess] = useState<string | null>(null);

  // Guest deletion state
  const [deletingGuest, setDeletingGuest] = useState<string | null>(null);
  const [showRemoveAllDialog, setShowRemoveAllDialog] = useState(false);
  const [removingAllGuests, setRemovingAllGuests] = useState(false);

  // Guest search state
  const [guestSearchQuery, setGuestSearchQuery] = useState("");

  // Guest edit state
  const [editingGuest, setEditingGuest] = useState<FirestoreGuest | null>(null);

  // Table deletion state
  const [deletingTable, setDeletingTable] = useState<string | null>(null);
  const [showRemoveAllTablesDialog, setShowRemoveAllTablesDialog] =
    useState(false);
  const [removingAllTables, setRemovingAllTables] = useState(false);

  // Links management state
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  const [eventLinks, setEventLinks] = useState<EventLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  const fetchEvent = useCallback(async () => {
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
  }, [eventId]);

  const fetchEventLinks = useCallback(async () => {
    if (!eventId) return;

    setLinksLoading(true);
    try {
      const data = (await authenticatedJsonFetch(
        `/api/events/${eventId}/links`
      )) as {
        success: boolean;
        links?: EventLink[];
        error?: string;
      };

      if (data.success && data.links) {
        setEventLinks(data.links);
      }
    } catch (error) {
      console.error("Error fetching event links:", error);
    } finally {
      setLinksLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId, fetchEvent]);

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

        // Log analytics event
        if (user?.uid && event) {
          const changes: string[] = [];
          if (editName.trim() !== event.name) changes.push("name");
          if (editDescription.trim() !== (event.description || ""))
            changes.push("description");
          if (changes.length > 0) {
            await logEventUpdated(user.uid, eventId, editName.trim(), changes);
          }
        }

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

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${tableName}"? All guests assigned to this table will be unassigned.`
      )
    ) {
      return;
    }

    setDeletingTable(tableId);
    setError(null);

    try {
      const response = (await authenticatedJsonFetch(`/api/tables/${tableId}`, {
        method: "DELETE",
      })) as { success: boolean; error?: string };

      if (response.success) {
        setSuccess(`Table "${tableName}" has been deleted successfully.`);
        await fetchEvent(); // Refresh the event data
      } else {
        setError(response.error || "Failed to delete table");
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      setError("An unexpected error occurred while deleting the table");
    } finally {
      setDeletingTable(null);
    }
  };

  const handleRemoveAllTables = async () => {
    if (!event || event.tables.length === 0) return;

    setRemovingAllTables(true);
    setError(null);

    try {
      const tableIds = event.tables.map((table) => table.id);
      const response = (await authenticatedJsonFetch("/api/tables", {
        method: "DELETE",
        body: JSON.stringify({ tableIds, eventId }),
      })) as { success: boolean; error?: string };

      if (response.success) {
        setSuccess(
          `All ${event.tables.length} tables have been deleted successfully.`
        );
        setShowRemoveAllTablesDialog(false);
        await fetchEvent(); // Refresh the event data
      } else {
        setError(response.error || "Failed to delete all tables");
      }
    } catch (error) {
      console.error("Error deleting all tables:", error);
      setError("An unexpected error occurred while deleting all tables");
    } finally {
      setRemovingAllTables(false);
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

  const handleAddGuest = async () => {
    if (!guestName.trim()) {
      setGuestError("Please enter a guest name");
      return;
    }

    setAddingGuest(true);
    setGuestError(null);
    setGuestSuccess(null);

    try {
      const guestData: {
        name: string;
        eventId: string;
        email?: string;
        phoneNumber?: string;
      } = {
        name: guestName.trim(),
        eventId: eventId,
      };

      // Only add fields if they have values
      if (guestEmail.trim()) {
        guestData.email = guestEmail.trim();
      }
      if (guestPhone.trim()) {
        guestData.phoneNumber = guestPhone.trim();
      }

      const response = (await authenticatedJsonFetch("/api/guests", {
        method: "POST",
        body: JSON.stringify(guestData),
      })) as { success: boolean; error?: string };

      if (response.success) {
        setGuestSuccess("Guest added successfully!");

        // Log analytics event
        if (user?.uid && event) {
          await logGuestAdded(user.uid, eventId, event.name, guestName.trim());
        }

        // Reset form
        setGuestName("");
        setGuestEmail("");
        setGuestPhone("");
        // Refresh event data to show new guest
        await fetchEvent();
        // Close dialog after a short delay
        setTimeout(() => {
          setAddGuestDialogOpen(false);
          setGuestSuccess(null);
        }, 1500);
      } else {
        setGuestError(response.error || "Failed to add guest");
      }
    } catch (error) {
      console.error("Error adding guest:", error);
      setGuestError("An unexpected error occurred");
    } finally {
      setAddingGuest(false);
    }
  };

  const handleDeleteGuest = async (guestId: string, guestName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${guestName}" from this event?`
      )
    ) {
      return;
    }

    setDeletingGuest(guestId);
    setError(null);

    try {
      const response = (await authenticatedJsonFetch(`/api/guests/${guestId}`, {
        method: "DELETE",
      })) as { success: boolean; error?: string };

      if (response.success) {
        setSuccess(`"${guestName}" has been removed from the event.`);

        // Log analytics event
        if (user?.uid && event) {
          await logGuestDeleted(user.uid, eventId, event.name, guestName);
        }

        await fetchEvent(); // Refresh the event data
      } else {
        setError(response.error || "Failed to remove guest");
      }
    } catch (error) {
      console.error("Error deleting guest:", error);
      setError("An unexpected error occurred while removing the guest");
    } finally {
      setDeletingGuest(null);
    }
  };

  const handleRemoveAllGuests = async () => {
    if (!event || event.guests.length === 0) return;

    setRemovingAllGuests(true);
    setError(null);

    try {
      const response = (await authenticatedJsonFetch(
        `/api/events/${eventId}/guests`,
        {
          method: "DELETE",
        }
      )) as { success: boolean; error?: string };

      if (response.success) {
        setSuccess(
          `All ${event.guests.length} guests have been removed from the event.`
        );
        setShowRemoveAllDialog(false);
        await fetchEvent(); // Refresh the event data
      } else {
        setError(response.error || "Failed to remove all guests");
      }
    } catch (error) {
      console.error("Error removing all guests:", error);
      setError("An unexpected error occurred while removing guests");
    } finally {
      setRemovingAllGuests(false);
    }
  };

  const handleEditGuest = (guest: Guest) => {
    // Convert local Guest interface to firestore Guest interface
    const firestoreGuest = {
      ...guest,
      phoneNumber: guest.phoneNumber || "",
      email: guest.email || "",
      eventId: eventId,
      userId: "", // Will be filled by the API
      tableId: guest.table?.id,
      notes: "",
      createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp, // Placeholder, won't be used in edit
      updatedAt: { seconds: 0, nanoseconds: 0 } as Timestamp, // Placeholder, won't be used in edit
    };
    setEditingGuest(firestoreGuest);
  };

  const handleSaveGuest = async (
    guestId: string,
    updates: Partial<FirestoreGuest>
  ) => {
    try {
      const response = (await authenticatedJsonFetch(`/api/guests/${guestId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })) as { success: boolean; error?: string };

      if (!response.success) {
        throw new Error(response.error || "Failed to update guest");
      }

      setSuccess("Guest updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchEvent(); // Refresh the event data
    } catch (error) {
      console.error("Failed to update guest:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update guest"
      );
      setTimeout(() => setError(null), 5000);
      throw error; // Re-throw to let dialog handle it
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

  // Filter guests based on search query
  const filteredGuests =
    event?.guests.filter((guest) => {
      if (!guestSearchQuery.trim()) return true;
      return (
        matchesLocalGuestSearch(guest, guestSearchQuery) ||
        (guest.table &&
          guest.table.name
            .toLowerCase()
            .includes(guestSearchQuery.toLowerCase()))
      );
    }) || [];

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
                        className="text-2xl font-bold p-3 border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                        placeholder="Event name"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <textarea
                          value={editDescription}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 200) {
                              setEditDescription(value);
                            }
                          }}
                          className="w-full p-3 border-2 border-gray-200 focus:border-blue-400 rounded-xl resize-none text-base leading-relaxed"
                          rows={4}
                          placeholder="Event description (optional, up to 200 characters)"
                          maxLength={200}
                        />
                        <div className="absolute bottom-2 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {editDescription.length}/200
                        </div>
                      </div>
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
                      <p className="text-lg text-gray-600 mb-2 whitespace-pre-wrap break-words leading-relaxed max-w-4xl">
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLinksDialog(true);
                    fetchEventLinks();
                  }}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Manage Guest View Links
                </Button>
                <ThemeSelector
                  currentTheme={event.theme || "cosmic-purple"}
                  onThemeChange={handleThemeChange}
                  loading={themeLoading}
                />
                {event.tables.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowRenameDialog(true)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Rename All Tables
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRemoveAllTablesDialog(true)}
                      className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove All Tables
                    </Button>
                  </>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteTable(table.id, table.name)
                            }
                            disabled={deletingTable === table.id}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete table"
                          >
                            {deletingTable === table.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
                  <span>
                    Guests (
                    {guestSearchQuery
                      ? filteredGuests.length
                      : event.guests.length}
                    {guestSearchQuery && ` of ${event.guests.length}`})
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setAddGuestDialogOpen(true)}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Guest
                    </Button>
                    {event.guests.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRemoveAllDialog(true)}
                        className="border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-300"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Remove All
                      </Button>
                    )}
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                </CardTitle>

                {/* Search Input */}
                {event.guests.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search guests by name, phone, or table..."
                      value={guestSearchQuery}
                      onChange={(e) => setGuestSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {event.guests.length > 0 ? (
                  <>
                    {guestSearchQuery && filteredGuests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>
                          No guests found matching &ldquo;{guestSearchQuery}
                          &rdquo;
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGuestSearchQuery("")}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredGuests.map((guest) => (
                          <div
                            key={guest.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                          >
                            <div>
                              <div className="font-medium">
                                {getDisplayName(guest)}
                              </div>
                              <div className="text-sm text-gray-500 space-y-1">
                                {guest.phoneNumber && (
                                  <div>{guest.phoneNumber}</div>
                                )}
                                {guest.email && <div>{guest.email}</div>}
                              </div>
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditGuest(guest)}
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                title={`Edit ${getDisplayName(guest)}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeleteGuest(
                                    guest.id,
                                    getDisplayName(guest)
                                  )
                                }
                                disabled={deletingGuest === guest.id}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                title={`Remove ${getDisplayName(guest)}`}
                              >
                                {deletingGuest === guest.id ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <UserMinus className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
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

        {/* Guest Edit Dialog */}
        <GuestEditDialog
          guest={editingGuest}
          open={!!editingGuest}
          onOpenChange={(open) => !open && setEditingGuest(null)}
          onSave={handleSaveGuest}
        />

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

        {/* Add Guest Dialog */}
        <Dialog open={addGuestDialogOpen} onOpenChange={setAddGuestDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Add Guest to {event?.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-gray-600 text-lg">
                Add a single guest to this event&apos;s guest list
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {/* Guest Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="guest-name"
                  className="text-sm font-semibold text-gray-700"
                >
                  Guest Name *
                </Label>
                <Input
                  id="guest-name"
                  placeholder="Enter full name..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="text-lg py-3 border-2 border-gray-200 focus:border-rose-400 rounded-xl"
                />
              </div>

              {/* Guest Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="guest-email"
                  className="text-sm font-semibold text-gray-700"
                >
                  Email (Optional)
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="text-lg py-3 border-2 border-gray-200 focus:border-rose-400 rounded-xl"
                />
              </div>

              {/* Guest Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="guest-phone"
                  className="text-sm font-semibold text-gray-700"
                >
                  Phone Number (Optional)
                </Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="text-lg py-3 border-2 border-gray-200 focus:border-rose-400 rounded-xl"
                />
              </div>

              {/* Error Message */}
              {guestError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-700 font-medium">{guestError}</p>
                </div>
              )}

              {/* Success Message */}
              {guestSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                  <p className="text-emerald-700 font-medium">{guestSuccess}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setAddGuestDialogOpen(false)}
                className="border-2 border-gray-300 hover:border-gray-400 px-6"
                disabled={addingGuest}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddGuest}
                disabled={addingGuest || !guestName.trim()}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6"
              >
                {addingGuest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding Guest...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Guest
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove All Guests Dialog */}
        <Dialog
          open={showRemoveAllDialog}
          onOpenChange={setShowRemoveAllDialog}
        >
          <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-3">
                  <UserX className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Remove All Guests
                </DialogTitle>
              </div>
              <DialogDescription className="text-gray-600 text-lg">
                This action will remove all {event?.guests.length} guests from
                &ldquo;
                {event?.name}&rdquo;. This cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium mb-1">Warning</p>
                  <p className="text-amber-700 text-sm">
                    This will permanently remove all guests from this event. You
                    will need to re-import or manually add guests again if
                    needed.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRemoveAllDialog(false)}
                className="border-2 border-gray-300 hover:border-gray-400 px-6"
                disabled={removingAllGuests}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveAllGuests}
                disabled={removingAllGuests}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6"
              >
                {removingAllGuests ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Removing All Guests...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Remove All {event?.guests.length} Guests
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove All Tables Dialog */}
        <Dialog
          open={showRemoveAllTablesDialog}
          onOpenChange={setShowRemoveAllTablesDialog}
        >
          <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-3">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Remove All Tables
                </DialogTitle>
              </div>
              <DialogDescription className="text-gray-600 text-lg">
                This action will remove all {event?.tables.length} tables from
                &ldquo;
                {event?.name}&rdquo;. All guests will be unassigned.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium mb-1">Warning</p>
                  <p className="text-amber-700 text-sm">
                    This will permanently remove all tables and unassign all
                    guests. You will need to recreate tables and reassign guests
                    if needed.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRemoveAllTablesDialog(false)}
                className="border-2 border-gray-300 hover:border-gray-400 px-6"
                disabled={removingAllTables}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveAllTables}
                disabled={removingAllTables}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6"
              >
                {removingAllTables ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Removing All Tables...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove All {event?.tables.length} Tables
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Links Management Dialog */}
        <Dialog open={showLinksDialog} onOpenChange={setShowLinksDialog}>
          <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Manage Guest View Links
                </DialogTitle>
              </div>
              <DialogDescription className="text-gray-600 text-lg">
                Add custom links that will appear on the guest view page for
                &ldquo;{event?.name}&rdquo;
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              {linksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Loading links...</span>
                </div>
              ) : (
                <EventLinksManager
                  eventId={eventId}
                  links={eventLinks}
                  onLinksChange={(links) => setEventLinks(links)}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLinksDialog(false)}
                className="border-2 border-gray-300 hover:border-gray-400 px-6"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
