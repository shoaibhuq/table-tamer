"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import { Guest, Table } from "@/generated/prisma";
import { authenticatedJsonFetch } from "@/lib/api";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  Plus,
  Settings,
  Send,
  ArrowLeft,
  X,
  UserX,
  Trash2,
  RotateCcw,
} from "lucide-react";

type TableWithGuests = Table & { guests: Guest[] };

interface DraggableGuestProps {
  guest: Guest;
  isDragging?: boolean;
  isSelected?: boolean;
  onUnassign?: (guestId: string) => void;
  onSelect?: (guestId: string, isSelected: boolean) => void;
}

function DraggableGuest({
  guest,
  isDragging = false,
  isSelected = false,
  onUnassign,
  onSelect,
}: DraggableGuestProps) {
  const { setNodeRef, transform, transition } = useSortable({
    id: guest.id,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        p-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-sm 
        hover:shadow-md transition-all relative
        ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(guest.id, e.target.checked)}
              className="rounded border-gray-300"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-gray-900">{guest.name}</p>
            {guest.phoneNumber && (
              <p className="text-sm text-gray-500">{guest.phoneNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DragHandle guestId={guest.id} />
          {onUnassign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnassign(guest.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Unassign guest"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DragHandleProps {
  guestId: string;
}

function DragHandle({ guestId }: DragHandleProps) {
  const { attributes, listeners } = useSortable({
    id: guestId,
    disabled: false,
  });

  return (
    <div
      {...attributes}
      {...listeners}
      className="p-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors touch-none select-none"
      title="Drag to assign to table"
      style={{ touchAction: "none" }}
    >
      <Users className="w-4 h-4 text-gray-400" />
    </div>
  );
}

interface DroppableTableProps {
  table: TableWithGuests;
  guests: Guest[];
  selectedGuestsCount: number;
  onUnassign?: (guestId: string) => void;
  onRemove?: (tableId: string) => void;
  onAssignSelected?: (tableId: string) => void;
}

function DroppableTable({
  table,
  guests,
  selectedGuestsCount,
  onUnassign,
  onRemove,
  onAssignSelected,
}: DroppableTableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${table.id}` });

  return (
    <Card
      ref={setNodeRef}
      className={`
        min-h-[400px] transition-all duration-200
        ${isOver ? "ring-2 ring-blue-400 bg-blue-50" : "bg-white"}
        hover:shadow-lg
      `}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Table {table.number}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {guests.length} guests
            </Badge>
            {selectedGuestsCount > 0 && onAssignSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignSelected(table.id);
                }}
                className="text-xs"
                title={`Assign ${selectedGuestsCount} selected guests to this table`}
              >
                +{selectedGuestsCount}
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(table.id);
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 h-auto"
                title="Remove table"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <SortableContext
            items={guests.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {guests.map((guest) => (
              <DraggableGuest
                key={guest.id}
                guest={guest}
                onUnassign={onUnassign}
              />
            ))}
          </SortableContext>
          {guests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-sm">Drop guests here</p>
              {selectedGuestsCount > 0 && onAssignSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAssignSelected(table.id)}
                  className="mt-2 text-blue-600"
                >
                  Assign {selectedGuestsCount} selected
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UnassignedGuestsAreaProps {
  unassignedGuests: Guest[];
  selectedGuests: Set<string>;
  onSelectGuest: (guestId: string, isSelected: boolean) => void;
}

function UnassignedGuestsArea({
  unassignedGuests,
  selectedGuests,
  onSelectGuest,
}: UnassignedGuestsAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] space-y-2 ${
        isOver ? "bg-blue-50 rounded-lg" : ""
      }`}
    >
      <SortableContext
        items={unassignedGuests.map((g) => g.id)}
        strategy={verticalListSortingStrategy}
      >
        {unassignedGuests.map((guest) => (
          <DraggableGuest
            key={guest.id}
            guest={guest}
            isSelected={selectedGuests.has(guest.id)}
            onSelect={onSelectGuest}
          />
        ))}
      </SortableContext>
      {unassignedGuests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Users className="w-8 h-8 mb-2" />
          <p className="text-sm">All guests assigned!</p>
        </div>
      )}
    </div>
  );
}

export default function AssignPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [numTables, setNumTables] = useState(8);
  const [tables, setTables] = useState<TableWithGuests[]>([]);
  const [unassignedGuests, setUnassignedGuests] = useState<Guest[]>([]);
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const currentEventId = eventIdParam;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const fetchTablesAndGuests = async () => {
    try {
      const url = currentEventId
        ? `/api/tables?eventId=${currentEventId}`
        : "/api/tables";
      const data = (await authenticatedJsonFetch(url)) as {
        success: boolean;
        tables?: TableWithGuests[];
        unassignedGuests?: Guest[];
        error?: string;
      };
      if (data.success) {
        setTables(data.tables || []);
        setUnassignedGuests(data.unassignedGuests || []);
      } else {
        setError(data.error || "Failed to fetch data.");
      }
    } catch {
      setError("Failed to fetch data.");
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchTablesAndGuests();
    }
  }, [currentEventId, user, authLoading]);

  const handleCreateTables = async () => {
    if (numTables < 1 || numTables > 50) {
      setError("Please enter a number between 1 and 50.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: { numTables: number; eventId?: string } = { numTables };
      if (currentEventId) {
        body.eventId = currentEventId;
      }

      const data = (await authenticatedJsonFetch("/api/tables", {
        method: "POST",
        body: JSON.stringify(body),
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSuccess(`Created ${numTables} tables successfully!`);
        await fetchTablesAndGuests();
      } else {
        setError(data.error || "Failed to create tables.");
      }
    } catch {
      setError("Failed to create tables.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (tables.length === 0) {
      setError("Please create tables first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: { eventId?: string } = {};
      if (currentEventId) {
        body.eventId = currentEventId;
      }

      const data = (await authenticatedJsonFetch("/api/assign-tables", {
        method: "POST",
        body: JSON.stringify(body),
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSuccess("Tables assigned successfully!");
        await fetchTablesAndGuests();
      } else {
        setError(data.error || "Failed to assign tables.");
      }
    } catch {
      setError("Failed to assign tables.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch("/api/send-sms", {
        method: "POST",
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSuccess("SMS notifications sent successfully!");
      } else {
        setError(data.error || "Failed to send SMS notifications.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignGuest = async (guestId: string) => {
    try {
      const data = (await authenticatedJsonFetch("/api/tables", {
        method: "PATCH",
        body: JSON.stringify({ guestId, tableId: null }),
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        await fetchTablesAndGuests();
      } else {
        setError("Failed to unassign guest.");
      }
    } catch {
      setError("Failed to unassign guest.");
    }
  };

  const handleClearAllAssignments = async () => {
    if (
      !confirm(
        "Are you sure you want to unassign all guests from their tables?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all assigned guests
      const allAssignedGuests = tables.flatMap((t) => t.guests);

      // Unassign each guest
      await Promise.all(
        allAssignedGuests.map((guest) =>
          authenticatedJsonFetch("/api/tables", {
            method: "PATCH",
            body: JSON.stringify({ guestId: guest.id, tableId: null }),
          })
        )
      );

      setSuccess("All guests have been unassigned!");
      await fetchTablesAndGuests();
    } catch {
      setError("Failed to clear all assignments.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTable = async (tableId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this table? All guests will be unassigned."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First unassign all guests from this table
      const tableToRemove = tables.find((t) => t.id === tableId);
      if (tableToRemove && tableToRemove.guests.length > 0) {
        await Promise.all(
          tableToRemove.guests.map((guest) =>
            authenticatedJsonFetch("/api/tables", {
              method: "PATCH",
              body: JSON.stringify({ guestId: guest.id, tableId: null }),
            })
          )
        );
      }

      // Then delete the table via API
      const data = (await authenticatedJsonFetch(`/api/tables/${tableId}`, {
        method: "DELETE",
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSuccess("Table removed successfully!");
        await fetchTablesAndGuests();
      } else {
        setError("Failed to remove table.");
      }
    } catch {
      setError("Failed to remove table.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAllTables = async () => {
    if (
      !confirm(
        "Are you sure you want to remove ALL tables? All guests will be unassigned."
      )
    ) {
      return;
    }

    if (!currentEventId) {
      setError("No event selected. Please select an event first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Remove all tables for this event
      const data = (await authenticatedJsonFetch("/api/tables", {
        method: "POST",
        body: JSON.stringify({ numTables: 0, eventId: currentEventId }),
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSuccess("All tables removed successfully!");
        await fetchTablesAndGuests();
      } else {
        setError(data.error || "Failed to remove all tables.");
      }
    } catch {
      setError("Failed to remove all tables.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Are you sure you want to reset everything? This will remove all tables and unassign all guests."
      )
    ) {
      return;
    }

    if (!currentEventId) {
      setError("No event selected. Please select an event first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Remove all tables and unassign all guests for this event
      const data = (await authenticatedJsonFetch("/api/tables", {
        method: "POST",
        body: JSON.stringify({ numTables: 0, eventId: currentEventId }),
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSuccess("Everything has been reset!");
        await fetchTablesAndGuests();
      } else {
        setError(data.error || "Failed to reset.");
      }
    } catch {
      setError("Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Find the guest being dragged
    const draggedGuest = [
      ...unassignedGuests,
      ...tables.flatMap((t) => t.guests),
    ].find((g) => g.id === active.id);

    setActiveGuest(draggedGuest || null);
  };

  const handleSelectGuest = (guestId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedGuests);
    if (isSelected) {
      newSelection.add(guestId);
    } else {
      newSelection.delete(guestId);
    }
    setSelectedGuests(newSelection);
  };

  const handleSelectAllUnassigned = () => {
    if (selectedGuests.size === unassignedGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(unassignedGuests.map((g) => g.id)));
    }
  };

  const handleAssignSelectedToTable = async (tableId: string) => {
    if (selectedGuests.size === 0) return;

    try {
      // Assign all selected guests to the table
      await Promise.all(
        Array.from(selectedGuests).map((guestId) =>
          authenticatedJsonFetch("/api/tables", {
            method: "PATCH",
            body: JSON.stringify({ guestId, tableId }),
          })
        )
      );

      setSuccess(`Assigned ${selectedGuests.size} guests to table!`);
      setSelectedGuests(new Set());
      await fetchTablesAndGuests();
    } catch {
      setError("Failed to assign guests to table.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGuest(null);

    if (!over) return;

    const guestId = active.id as string;
    const overId = over.id as string;

    // Determine target table
    let targetTableId: string | null = null;

    if (overId.startsWith("table-")) {
      targetTableId = overId.replace("table-", "");
    } else if (overId === "unassigned") {
      targetTableId = null;
    } else {
      // Dropped on another guest, find their table
      const targetGuest = tables
        .flatMap((t) => t.guests)
        .find((g) => g.id === overId);
      if (targetGuest) {
        const targetTable = tables.find((t) =>
          t.guests.some((g) => g.id === overId)
        );
        targetTableId = targetTable?.id || null;
      }
    }

    // Update database
    try {
      const data = (await authenticatedJsonFetch("/api/tables", {
        method: "PATCH",
        body: JSON.stringify({ guestId, tableId: targetTableId }),
      })) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        await fetchTablesAndGuests();
      } else {
        setError("Failed to update table assignment.");
      }
    } catch {
      setError("Failed to update table assignment.");
    }
  };

  // Show loading while authenticating
  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please sign in to continue.</p>
            <Link href="/events">
              <Button>Go to Events</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Table Assignment
            </h1>
            <p className="text-xl text-gray-600">
              Create tables and assign guests to them
            </p>
          </div>

          {/* Event Selection Required */}
          {!currentEventId && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Settings className="w-5 h-5" />
                  Event Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-orange-700 mb-4">
                    <p className="text-lg font-semibold mb-2">
                      Please select an event first
                    </p>
                    <p className="text-sm">
                      Table assignments must be created within a specific event
                      context.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Link href="/events">
                      <Button className="mr-3">Go to Events</Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline">Import Guests First</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Assignment Section - Only show if event is selected */}
          {currentEventId && (
            <>
              {/* Controls */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Table Management
                    <Badge variant="outline" className="ml-auto">
                      Event Context Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={numTables}
                        onChange={(e) => setNumTables(Number(e.target.value))}
                        min="1"
                        max="50"
                        className="w-20"
                      />
                      <Button onClick={handleCreateTables} disabled={loading}>
                        <Plus className="w-4 h-4 mr-1" />
                        Create Tables
                      </Button>
                    </div>

                    <Button
                      onClick={handleAutoAssign}
                      disabled={loading || tables.length === 0}
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      AI Auto-Assign
                    </Button>

                    <Button
                      onClick={handleSendSms}
                      disabled={loading}
                      variant="outline"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send SMS
                    </Button>

                    <Button
                      onClick={handleClearAllAssignments}
                      disabled={loading}
                      variant="outline"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Clear All Assignments
                    </Button>

                    <Button
                      onClick={handleRemoveAllTables}
                      disabled={loading || tables.length === 0}
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove All Tables
                    </Button>

                    <Button
                      onClick={handleReset}
                      disabled={loading}
                      variant="outline"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset Everything
                    </Button>
                  </div>

                  {error && (
                    <p className="mt-3 text-sm text-red-600">{error}</p>
                  )}
                  {success && (
                    <p className="mt-3 text-sm text-green-600">{success}</p>
                  )}
                </CardContent>
              </Card>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Unassigned Guests */}
                  <div className="lg:col-span-1">
                    <Card className="sticky top-4">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Unassigned Guests</span>
                          <Badge variant="outline">
                            {unassignedGuests.length}
                          </Badge>
                        </CardTitle>
                        {unassignedGuests.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAllUnassigned}
                            >
                              {selectedGuests.size === unassignedGuests.length
                                ? "Deselect All"
                                : "Select All"}
                            </Button>
                            {selectedGuests.size > 0 && (
                              <Badge variant="secondary">
                                {selectedGuests.size} selected
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <UnassignedGuestsArea
                          unassignedGuests={unassignedGuests}
                          selectedGuests={selectedGuests}
                          onSelectGuest={handleSelectGuest}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tables */}
                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {tables.map((table) => (
                        <DroppableTable
                          key={table.id}
                          table={table}
                          guests={table.guests}
                          selectedGuestsCount={selectedGuests.size}
                          onUnassign={(guestId) => {
                            handleUnassignGuest(guestId);
                          }}
                          onRemove={(tableId) => {
                            handleRemoveTable(tableId);
                          }}
                          onAssignSelected={handleAssignSelectedToTable}
                        />
                      ))}
                    </div>

                    {tables.length === 0 && (
                      <Card className="p-12 text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Tables Created
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Create tables to start assigning guests
                        </p>
                        <Button onClick={handleCreateTables}>
                          <Plus className="w-4 h-4 mr-1" />
                          Create {numTables} Tables
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>

                <DragOverlay>
                  {activeGuest ? (
                    <DraggableGuest guest={activeGuest} isDragging />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Navigation */}
              <div className="mt-8 text-center">
                <Link
                  href={currentEventId ? `/events/${currentEventId}` : "/"}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {currentEventId ? "Back to Event Details" : "Back to Import"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
