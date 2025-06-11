"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Guest,
  Table,
  getGuestFullName,
  matchesGuestSearch,
} from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
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
  Edit3,
} from "lucide-react";
import { TableEditDialog } from "@/components/ui/table-edit-dialog";
import { GuestEditDialog } from "@/components/ui/guest-edit-dialog";

type TableWithGuests = Table & { guests: Guest[] };

interface ProtectedLinkProps {
  href: string;
  hasUnsavedChanges: boolean;
  children: React.ReactNode;
  className?: string;
}

function ProtectedLink({
  href,
  hasUnsavedChanges,
  children,
  className,
}: ProtectedLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?\n\nClick 'OK' to leave without saving, or 'Cancel' to stay and save your changes."
      );
      if (confirmed) {
        window.location.href = href;
      }
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

interface DraggableGuestProps {
  guest: Guest;
  isDragging?: boolean;
  isSelected?: boolean;
  onUnassign?: (guestId: string) => void;
  onSelect?: (guestId: string, isSelected: boolean) => void;
  onClick?: (guestId: string) => void;
  onEdit?: (guest: Guest) => void;
}

function DraggableGuest({
  guest,
  isDragging = false,
  isSelected = false,
  onUnassign,
  onSelect,
  onClick,
  onEdit,
}: DraggableGuestProps) {
  const { setNodeRef, transform, transition, listeners, attributes } =
    useSortable({
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
        p-2 mb-2 bg-white border-1 rounded-lg shadow-sm 
        guest-card-hover drag-smooth relative group transition-all duration-200
        ${
          isSelected
            ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 ring-2 ring-blue-300 shadow-md cursor-grab"
            : "border-gray-200 hover:border-blue-300 hover:shadow-lg cursor-grab active:cursor-grabbing"
        }
        ${
          isDragging
            ? "opacity-20 transform scale-110 rotate-3 shadow-2xl z-50"
            : "hover:-translate-y-0.5"
        }
      `}
      onClick={() => onClick && onClick(guest.id)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {onSelect && (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect(guest.id, e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 border border-gray-300 rounded focus:ring-blue-500 focus:ring-1 cursor-pointer transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </label>
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium transition-colors ${
                isSelected ? "text-blue-900" : "text-gray-900"
              }`}
            >
              {getGuestFullName(guest)}
            </p>
            {guest.phoneNumber && (
              <p
                className={`text-sm transition-colors ${
                  isSelected ? "text-blue-700" : "text-gray-500"
                }`}
              >
                {guest.phoneNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSelected && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Selected
            </div>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(guest);
              }}
              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Edit guest"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
          {onUnassign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnassign(guest.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Unassign guest"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <div className="text-gray-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>
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
  onEditTable?: (table: TableWithGuests) => void;
  onEditGuest?: (guest: Guest) => void;
}

function DroppableTable({
  table,
  guests,
  selectedGuestsCount,
  onUnassign,
  onRemove,
  onAssignSelected,
  onEditTable,
  onEditGuest,
}: DroppableTableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${table.id}` });

  return (
    <Card
      ref={setNodeRef}
      className={`
        min-h-[400px] transition-all duration-300 relative
        ${
          isOver
            ? "ring-4 ring-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-102 border-blue-300"
            : "bg-white hover:shadow-lg"
        }
        border-t-4
      `}
      style={{ borderTopColor: table.color }}
    >
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg m-2 bg-blue-100/30 flex items-center justify-center">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <Users className="w-5 h-5 inline mr-2" />
            Drop guests here
          </div>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: table.color }}
            />
            <div>
              <span className="text-lg font-semibold">{table.name}</span>
              <div className="text-xs text-gray-500 mt-0.5">
                {guests.length} guest{guests.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {selectedGuestsCount > 0 && onAssignSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignSelected(table.id);
                }}
                className="text-xs h-8"
                title={`Assign ${selectedGuestsCount} selected guests to this table`}
              >
                +{selectedGuestsCount}
              </Button>
            )}
            {onEditTable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTable(table);
                }}
                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 h-8 w-8 p-0"
                title="Edit table"
              >
                <Edit3 className="w-4 h-4" />
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
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                title="Remove table"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <SortableContext
            items={guests.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {guests.map((guest) => (
              <DraggableGuest
                key={guest.id}
                guest={guest}
                onUnassign={onUnassign}
                onEdit={onEditGuest}
              />
            ))}
          </SortableContext>
          {guests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-sm">Drop guests here</p>
              {selectedGuestsCount > 0 && onAssignSelected && (
                <div className="mt-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignSelected(table.id)}
                    className="text-blue-600 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                  >
                    Assign {selectedGuestsCount} selected guest
                    {selectedGuestsCount !== 1 ? "s" : ""}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Or drag and drop them here
                  </p>
                </div>
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
  onClickGuest?: (guestId: string) => void;
  onEditGuest?: (guest: Guest) => void;
}

function UnassignedGuestsArea({
  unassignedGuests,
  selectedGuests,
  onSelectGuest,
  onClickGuest,
  onEditGuest,
}: UnassignedGuestsAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] space-y-2 relative transition-all duration-300 ${
        isOver
          ? "bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 -m-2"
          : ""
      }`}
    >
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg bg-green-100/30 flex items-center justify-center">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <UserX className="w-5 h-5 inline mr-2" />
            Unassign guests
          </div>
        </div>
      )}
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
            onClick={onClickGuest}
            onEdit={onEditGuest}
          />
        ))}
      </SortableContext>
      {unassignedGuests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Users className="w-8 h-8 mb-2" />
          <p className="text-sm">All guests assigned!</p>
        </div>
      )}
    </div>
  );
}

function AssignPageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventIdParam = searchParams.get("eventId");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<TableWithGuests | null>(
    null
  );
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [numTables, setNumTables] = useState(8);

  // Original state from database
  const [originalTables, setOriginalTables] = useState<TableWithGuests[]>([]);
  const [originalUnassignedGuests, setOriginalUnassignedGuests] = useState<
    Guest[]
  >([]);

  // Current working state (local)
  const [tables, setTables] = useState<TableWithGuests[]>([]);
  const [unassignedGuests, setUnassignedGuests] = useState<Guest[]>([]);

  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState("");
  const currentEventId = eventIdParam;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const fetchTablesAndGuests = useCallback(async () => {
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
        const fetchedTables = data.tables || [];
        const fetchedUnassigned = data.unassignedGuests || [];

        // Set both original (database) and current (working) state
        setOriginalTables([...fetchedTables]);
        setOriginalUnassignedGuests([...fetchedUnassigned]);
        setTables([...fetchedTables]);
        setUnassignedGuests([...fetchedUnassigned]);

        // Calculate smart default for number of tables if no tables exist yet
        // Assuming 4 people per table (middle of 3-5 range)
        if (fetchedTables.length === 0 && fetchedUnassigned.length > 0) {
          const totalGuests = fetchedUnassigned.length;
          const suggestedTables = Math.max(1, Math.ceil(totalGuests / 4));
          setNumTables(Math.min(suggestedTables, 50)); // Cap at 50 max
        }

        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
      } else {
        setError(data.error || "Failed to fetch data.");
      }
    } catch {
      setError("Failed to fetch data.");
    }
  }, [currentEventId]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchTablesAndGuests();
    }
  }, [currentEventId, user, authLoading, fetchTablesAndGuests]);

  // Navigation protection - prevent leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?\n\nClick 'OK' to leave without saving, or 'Cancel' to stay and save your changes."
        );
        if (!confirmed) {
          throw new Error("Route change aborted by user");
        }
      }
    };

    // Handle browser navigation (back, forward, close tab, refresh)
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Handle in-app navigation
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;

    router.push = (...args: Parameters<typeof router.push>) => {
      handleRouteChange();
      return originalPush.apply(router, args);
    };

    router.replace = (...args: Parameters<typeof router.replace>) => {
      handleRouteChange();
      return originalReplace.apply(router, args);
    };

    router.back = () => {
      handleRouteChange();
      return originalBack.apply(router);
    };

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
    };
  }, [hasUnsavedChanges, router]);

  const handleCreateTables = () => {
    if (numTables < 1 || numTables > 50) {
      setError("Please enter a number between 1 and 50.");
      return;
    }

    setError(null);

    // Get user's naming preferences (defaults to numbers if not set)
    const namingType = userProfile?.tableNamingPreferences?.type || "numbers";
    const customPrefix =
      userProfile?.tableNamingPreferences?.customPrefix || "Table";

    // Generate table name based on user's preferences
    const generateTableName = (
      index: number,
      type: string,
      prefix: string = "Table"
    ) => {
      switch (type) {
        case "numbers":
          return `Table ${index + 1}`;
        case "letters":
          return `Table ${String.fromCharCode(65 + index)}`; // Table A, Table B, Table C...
        case "roman":
          const romans = [
            "I",
            "II",
            "III",
            "IV",
            "V",
            "VI",
            "VII",
            "VIII",
            "IX",
            "X",
            "XI",
            "XII",
            "XIII",
            "XIV",
            "XV",
            "XVI",
            "XVII",
            "XVIII",
            "XIX",
            "XX",
          ];
          return `Table ${romans[index] || index + 1}`;
        case "custom-prefix":
          return `${prefix} ${index + 1}`;
        default:
          return `Table ${index + 1}`;
      }
    };

    // Generate new tables locally
    const newTables: TableWithGuests[] = [];
    const colors = [
      "#EF4444",
      "#F97316",
      "#EAB308",
      "#22C55E",
      "#06B6D4",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#F59E0B",
      "#10B981",
      "#6366F1",
      "#F43F5E",
    ];

    for (let i = 0; i < numTables; i++) {
      const tempId = `temp-table-${Date.now()}-${i}`;
      const tableName = generateTableName(
        tables.length + i,
        namingType,
        customPrefix
      );
      newTables.push({
        id: tempId,
        name: tableName,
        capacity: 8,
        color: colors[i % colors.length],
        eventId: currentEventId || "",
        userId: user?.uid || "",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        guests: [],
      });
    }

    // Add new tables to existing ones
    setTables((prevTables) => [...prevTables, ...newTables]);
    setHasUnsavedChanges(true);
    setSuccess(
      `Created ${numTables} tables locally. Click "Save Changes" to persist.`
    );
  };

  const handleAutoAssign = () => {
    if (tables.length === 0) {
      setError("Please create tables first.");
      return;
    }

    if (unassignedGuests.length === 0) {
      setError("No unassigned guests to assign.");
      return;
    }

    // Simple local auto-assignment algorithm
    const guestsPerTable = Math.ceil(unassignedGuests.length / tables.length);

    // Create a new tables array with assigned guests
    setTables((prevTables) => {
      const newTables = prevTables.map((table) => ({
        ...table,
        guests: [...table.guests],
      }));
      let currentTableIndex = 0;
      let guestsInCurrentTable = 0;

      // Assign each unassigned guest to a table
      unassignedGuests.forEach((guest) => {
        if (currentTableIndex < newTables.length) {
          newTables[currentTableIndex].guests.push(guest);
          guestsInCurrentTable++;

          // Move to next table when current is full
          if (
            guestsInCurrentTable >= guestsPerTable &&
            currentTableIndex < newTables.length - 1
          ) {
            currentTableIndex++;
            guestsInCurrentTable = 0;
          }
        }
      });

      return newTables;
    });

    // Clear unassigned guests since they're all assigned now
    setUnassignedGuests([]);
    // Clear selected guests since they've all been assigned
    setSelectedGuests(new Set());
    setHasUnsavedChanges(true);

    setSuccess(
      `Auto-assigned ${unassignedGuests.length} guests across ${tables.length} tables!`
    );
  };

  const handleSendSms = async () => {
    if (!currentEventId) {
      setError("No event selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch("/api/send-sms", {
        method: "POST",
        body: JSON.stringify({ eventId: currentEventId }),
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

  const handleUnassignGuest = (guestId: string) => {
    updateGuestAssignmentLocally(guestId, null);
  };

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) return;

    setSaving(true);
    setError(null);

    try {
      let totalChanges = 0;
      const RETRY_DELAY = 2000; // 2 seconds
      const MAX_RETRIES = 3;

      // 1. Handle table structure changes (if different from original)
      const originalTableCount = originalTables.length;
      const currentTableCount = tables.length;
      const hasTableStructureChanges =
        originalTableCount !== currentTableCount ||
        tables.some((table) => table.id.startsWith("temp-table-"));

      let newTables: TableWithGuests[] = tables;

      if (hasTableStructureChanges && currentEventId) {
        // Save current assignments before recreating tables
        const currentAssignments: { [guestId: string]: number } = {}; // guest ID -> table index

        tables.forEach((table, tableIndex) => {
          table.guests.forEach((guest) => {
            currentAssignments[guest.id] = tableIndex;
          });
        });

        // Recreate all tables using the existing batch API
        const response = (await authenticatedJsonFetch("/api/tables", {
          method: "POST",
          body: JSON.stringify({
            numTables: currentTableCount,
            eventId: currentEventId,
          }),
        })) as { success: boolean; tables?: TableWithGuests[]; error?: string };

        if (response.success && response.tables) {
          newTables = response.tables;
          totalChanges += Math.abs(currentTableCount - originalTableCount);

          // Prepare guest assignment changes for batch update
          const guestAssignmentChanges: Array<{
            guestId: string;
            tableId: string | null;
          }> = [];

          Object.entries(currentAssignments).forEach(
            ([guestId, tableIndex]) => {
              if (tableIndex < newTables.length) {
                guestAssignmentChanges.push({
                  guestId,
                  tableId: newTables[tableIndex].id,
                });
              }
            }
          );

          // Use batch update for guest assignments
          if (guestAssignmentChanges.length > 0) {
            let retryCount = 0;
            let batchSuccess = false;

            while (retryCount <= MAX_RETRIES && !batchSuccess) {
              try {
                const batchData = (await authenticatedJsonFetch(
                  "/api/assignments/batch",
                  {
                    method: "POST",
                    body: JSON.stringify({
                      guestChanges: guestAssignmentChanges,
                    }),
                  }
                )) as {
                  success: boolean;
                  totalProcessed?: number;
                  error?: string;
                };

                if (batchData.success) {
                  totalChanges +=
                    batchData.totalProcessed || guestAssignmentChanges.length;
                  batchSuccess = true;
                } else {
                  // Check if it's a rate limit error by the error message
                  if (
                    batchData.error &&
                    batchData.error.includes("Rate limit")
                  ) {
                    retryCount++;
                    if (retryCount <= MAX_RETRIES) {
                      setError(
                        `Rate limited. Retrying in ${
                          RETRY_DELAY / 1000
                        } seconds... (${retryCount}/${MAX_RETRIES})`
                      );
                      await new Promise((resolve) =>
                        setTimeout(resolve, RETRY_DELAY * retryCount)
                      );
                    } else {
                      throw new Error(batchData.error || "Rate limit exceeded");
                    }
                  } else {
                    throw new Error(batchData.error || "Batch update failed");
                  }
                }
              } catch (batchError) {
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                  throw batchError;
                }
                await new Promise((resolve) =>
                  setTimeout(resolve, RETRY_DELAY * retryCount)
                );
              }
            }

            if (!batchSuccess) {
              throw new Error(
                "Failed to save table structure changes after multiple retries"
              );
            }
          }

          // Refresh from database to get the latest state
          await fetchTablesAndGuests();
          setSuccess(`Saved ${totalChanges} changes successfully!`);
          return;
        }
      }

      // 2. Handle guest assignment changes using efficient batch updates
      const guestChanges: Array<{ guestId: string; tableId: string | null }> =
        [];

      // Get all current assignments
      const currentAssignments = new Map<string, string | null>();

      // Add unassigned guests
      unassignedGuests.forEach((guest) => {
        currentAssignments.set(guest.id, null);
      });

      // Add assigned guests
      tables.forEach((table) => {
        table.guests.forEach((guest) => {
          currentAssignments.set(guest.id, table.id);
        });
      });

      // Get original assignments
      const originalAssignments = new Map<string, string | null>();

      originalUnassignedGuests.forEach((guest) => {
        originalAssignments.set(guest.id, null);
      });

      originalTables.forEach((table) => {
        table.guests.forEach((guest) => {
          originalAssignments.set(guest.id, table.id);
        });
      });

      // Find differences in guest assignments
      currentAssignments.forEach((currentTableId, guestId) => {
        const originalTableId = originalAssignments.get(guestId);
        if (currentTableId !== originalTableId) {
          guestChanges.push({ guestId, tableId: currentTableId });
        }
      });

      // Use efficient batch update for guest assignment changes
      if (guestChanges.length > 0) {
        console.log(
          `Processing ${guestChanges.length} guest assignment changes...`
        );

        let retryCount = 0;
        let batchSuccess = false;

        while (retryCount <= MAX_RETRIES && !batchSuccess) {
          try {
            const batchData = (await authenticatedJsonFetch(
              "/api/assignments/batch",
              {
                method: "POST",
                body: JSON.stringify({
                  guestChanges,
                }),
              }
            )) as {
              success: boolean;
              totalProcessed?: number;
              error?: string;
              errors?: string[];
            };

            if (batchData.success) {
              totalChanges += batchData.totalProcessed || guestChanges.length;
              batchSuccess = true;
            } else {
              // Check error type and handle accordingly
              if (batchData.error && batchData.error.includes("Rate limit")) {
                // Rate limited - wait and retry
                retryCount++;
                if (retryCount <= MAX_RETRIES) {
                  setError(
                    `Rate limited. Retrying in ${
                      RETRY_DELAY / 1000
                    } seconds... (${retryCount}/${MAX_RETRIES})`
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, RETRY_DELAY * retryCount)
                  );
                } else {
                  throw new Error(batchData.error || "Rate limit exceeded");
                }
              } else if (
                batchData.error &&
                batchData.error.includes("Partially completed")
              ) {
                // Partial success
                totalChanges += batchData.totalProcessed || 0;
                setError(
                  `Partially saved: ${batchData.totalProcessed} changes succeeded, some failed. ${batchData.error}`
                );
                batchSuccess = true; // Consider partial success as success
              } else {
                throw new Error(batchData.error || "Batch update failed");
              }
            }
          } catch (batchError) {
            retryCount++;
            console.error(
              `Batch update attempt ${retryCount} failed:`,
              batchError
            );

            if (retryCount > MAX_RETRIES) {
              throw new Error(
                `Failed to save changes after ${MAX_RETRIES} retries: ${
                  batchError instanceof Error
                    ? batchError.message
                    : "Unknown error"
                }`
              );
            }

            setError(
              `Attempt ${retryCount} failed. Retrying in ${
                RETRY_DELAY / 1000
              } seconds...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY * retryCount)
            );
          }
        }

        if (!batchSuccess) {
          throw new Error(
            "Failed to save guest assignments after multiple retries"
          );
        }
      }

      // Refresh from database to get the latest state
      await fetchTablesAndGuests();
      setSuccess(`Saved ${totalChanges} changes successfully!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save changes";
      setError(errorMessage);
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!hasUnsavedChanges) return;

    if (confirm("Are you sure you want to discard all unsaved changes?")) {
      // Reset to original state
      setTables([...originalTables]);
      setUnassignedGuests([...originalUnassignedGuests]);
      setHasUnsavedChanges(false);
    }
  };

  const handleClearAllAssignments = () => {
    if (
      !confirm(
        "Are you sure you want to unassign all guests from their tables?"
      )
    ) {
      return;
    }

    setError(null);

    // Get all assigned guests
    const allAssignedGuests = tables.flatMap((t) => t.guests);

    if (allAssignedGuests.length > 0) {
      // Move all assigned guests to unassigned
      setUnassignedGuests((prev) => [...prev, ...allAssignedGuests]);

      // Clear guests from all tables
      setTables((prevTables) =>
        prevTables.map((table) => ({ ...table, guests: [] }))
      );

      setHasUnsavedChanges(true);
      setSuccess(
        'All guests unassigned locally. Click "Save Changes" to persist.'
      );
    } else {
      setSuccess("No guests to unassign.");
    }
  };

  const handleRemoveTable = (tableId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this table? All guests will be unassigned."
      )
    ) {
      return;
    }

    setError(null);

    // Find the table to remove
    const tableToRemove = tables.find((t) => t.id === tableId);
    if (!tableToRemove) return;

    // Move all guests from this table to unassigned
    if (tableToRemove.guests.length > 0) {
      setUnassignedGuests((prev) => [...prev, ...tableToRemove.guests]);
    }

    // Remove the table from local state
    setTables((prevTables) => prevTables.filter((t) => t.id !== tableId));
    setHasUnsavedChanges(true);
    setSuccess('Table removed locally. Click "Save Changes" to persist.');
  };

  const handleRemoveAllTables = () => {
    if (
      !confirm(
        "Are you sure you want to remove ALL tables? All guests will be unassigned."
      )
    ) {
      return;
    }

    setError(null);

    // Move all assigned guests to unassigned
    const allAssignedGuests = tables.flatMap((table) => table.guests);
    if (allAssignedGuests.length > 0) {
      setUnassignedGuests((prev) => [...prev, ...allAssignedGuests]);
    }

    // Remove all tables from local state
    setTables([]);
    setHasUnsavedChanges(true);
    setSuccess('All tables removed locally. Click "Save Changes" to persist.');
  };

  const handleReset = () => {
    if (
      !confirm(
        "Are you sure you want to reset everything? This will remove all tables and unassign all guests."
      )
    ) {
      return;
    }

    setError(null);

    // Move all assigned guests to unassigned
    const allAssignedGuests = tables.flatMap((table) => table.guests);
    if (allAssignedGuests.length > 0) {
      setUnassignedGuests((prev) => [...prev, ...allAssignedGuests]);
    }

    // Remove all tables from local state
    setTables([]);
    setHasUnsavedChanges(true);
    setSuccess('Everything reset locally. Click "Save Changes" to persist.');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const guestId = active.id as string;

    // Find the guest being dragged
    const draggedGuest = [
      ...unassignedGuests,
      ...tables.flatMap((t) => t.guests),
    ].find((g) => g.id === guestId);

    setActiveGuest(draggedGuest || null);

    // If the dragged guest is not in current selection, clear selection and select only this guest
    if (!selectedGuests.has(guestId)) {
      setSelectedGuests(new Set([guestId]));
    }
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

  const handleClickGuest = (guestId: string) => {
    // Simply toggle selection when clicking a guest
    const isCurrentlySelected = selectedGuests.has(guestId);
    handleSelectGuest(guestId, !isCurrentlySelected);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
  };

  const handleSaveGuest = async (guestId: string, updates: Partial<Guest>) => {
    try {
      setSaving(true);
      const response = (await authenticatedJsonFetch(`/api/guests/${guestId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })) as { success: boolean; error?: string };

      if (!response.success) {
        throw new Error(response.error || "Failed to update guest");
      }

      // Update local state
      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          guests: table.guests.map((guest) =>
            guest.id === guestId ? { ...guest, ...updates } : guest
          ),
        }))
      );

      setUnassignedGuests((prevGuests) =>
        prevGuests.map((guest) =>
          guest.id === guestId ? { ...guest, ...updates } : guest
        )
      );

      setSuccess("Guest updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to update guest:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update guest"
      );
      setTimeout(() => setError(null), 5000);
      throw error; // Re-throw to let dialog handle it
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllUnassigned = () => {
    const currentFilteredGuests = filteredUnassignedGuests;
    if (selectedGuests.size === currentFilteredGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(currentFilteredGuests.map((g: Guest) => g.id)));
    }
  };

  const handleAssignSelectedToTable = (tableId: string) => {
    if (selectedGuests.size === 0) return;

    // Get the target table index
    const targetTableIndex = tables.findIndex((t) => t.id === tableId);
    if (targetTableIndex < 0) return;

    // Collect all selected guests from unassigned list
    const selectedGuestIds = Array.from(selectedGuests);
    const guestsToAssign = unassignedGuests.filter((guest) =>
      selectedGuestIds.includes(guest.id)
    );

    if (guestsToAssign.length === 0) return;

    // Update state in a single operation
    setTables((prevTables) => {
      const newTables = [...prevTables];
      newTables[targetTableIndex] = {
        ...newTables[targetTableIndex],
        guests: [...newTables[targetTableIndex].guests, ...guestsToAssign],
      };
      return newTables;
    });

    setUnassignedGuests((prevUnassigned) =>
      prevUnassigned.filter((guest) => !selectedGuestIds.includes(guest.id))
    );

    // Clear selection and mark as having unsaved changes
    setSelectedGuests(new Set());
    setHasUnsavedChanges(true);
  };

  const handleBulkAssignment = (
    guestIds: string[],
    targetTableId: string | null
  ) => {
    // Find all guests to move
    const guestsToMove: Guest[] = [];
    const updatedTables = [...tables];
    let updatedUnassigned = [...unassignedGuests];

    // Collect guests and remove them from their current locations
    for (const guestId of guestIds) {
      // Check unassigned guests first
      const guest = unassignedGuests.find((g) => g.id === guestId);
      if (guest) {
        guestsToMove.push(guest);
        updatedUnassigned = updatedUnassigned.filter((g) => g.id !== guestId);
      } else {
        // Check assigned guests
        for (let i = 0; i < updatedTables.length; i++) {
          const tableGuest = updatedTables[i].guests.find(
            (g) => g.id === guestId
          );
          if (tableGuest) {
            guestsToMove.push(tableGuest);
            updatedTables[i] = {
              ...updatedTables[i],
              guests: updatedTables[i].guests.filter((g) => g.id !== guestId),
            };
            break;
          }
        }
      }
    }

    // Add guests to target location
    if (targetTableId) {
      const targetTableIndex = updatedTables.findIndex(
        (t) => t.id === targetTableId
      );
      if (targetTableIndex >= 0) {
        updatedTables[targetTableIndex] = {
          ...updatedTables[targetTableIndex],
          guests: [...updatedTables[targetTableIndex].guests, ...guestsToMove],
        };
      }
    } else {
      // Add to unassigned
      updatedUnassigned = [...updatedUnassigned, ...guestsToMove];
    }

    // Update state
    setTables(updatedTables);
    setUnassignedGuests(updatedUnassigned);
    setSelectedGuests(new Set()); // Clear selection after move
    setHasUnsavedChanges(true);
  };

  const handleUpdateTable = async (
    tableId: string,
    updates: { name?: string; color?: string; capacity?: number }
  ) => {
    try {
      // Update locally first
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === tableId ? { ...table, ...updates } : table
        )
      );

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
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === tableId
            ? {
                ...table,
                ...Object.fromEntries(
                  Object.keys(updates).map((key) => [
                    key,
                    originalTables.find((t) => t.id === tableId)?.[
                      key as keyof Table
                    ] || table[key as keyof Table],
                  ])
                ),
              }
            : table
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGuest(null);

    if (!over) return;

    const draggedGuestId = active.id as string;
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

    // If there are selected guests and the dragged guest is among them, move all selected guests
    if (selectedGuests.size > 1 && selectedGuests.has(draggedGuestId)) {
      handleBulkAssignment(Array.from(selectedGuests), targetTableId);
    } else {
      // Move only the dragged guest
      updateGuestAssignmentLocally(draggedGuestId, targetTableId);
    }
  };

  // Filter unassigned guests with their specific search
  const filterUnassignedGuests = (guests: Guest[]) => {
    if (!unassignedSearchQuery.trim()) return guests;
    return guests.filter((guest) =>
      matchesGuestSearch(guest, unassignedSearchQuery)
    );
  };

  // Filter all guests (including those in tables) with global search
  const filterAllGuests = (guests: Guest[]) => {
    if (!globalSearchQuery.trim()) return guests;
    return guests.filter((guest) =>
      matchesGuestSearch(guest, globalSearchQuery)
    );
  };

  // Apply filters
  const filteredUnassignedGuests = filterUnassignedGuests(unassignedGuests);

  // Filter all guests (including those in tables) with global search
  const filteredTables = globalSearchQuery.trim()
    ? tables
        .map((table) => ({
          ...table,
          guests: filterAllGuests(table.guests),
        }))
        .filter((table) => {
          // Show table if it has matching guests
          return table.guests.length > 0;
        })
    : tables; // Show all tables when no global search

  const updateGuestAssignmentLocally = (
    guestId: string,
    targetTableId: string | null
  ) => {
    // Find the guest in current state
    let guest: Guest | undefined;
    let sourceTableId: string | null = null;

    // Check unassigned guests first
    guest = unassignedGuests.find((g) => g.id === guestId);
    if (!guest) {
      // Check assigned guests
      for (const table of tables) {
        guest = table.guests.find((g) => g.id === guestId);
        if (guest) {
          sourceTableId = table.id;
          break;
        }
      }
    }

    if (!guest) return;

    // If no change in assignment, return
    if (sourceTableId === targetTableId) return;

    // Create updated tables and unassigned lists
    const newTables = [...tables];
    let newUnassigned = [...unassignedGuests];

    // Remove guest from source
    if (sourceTableId) {
      const sourceTableIndex = newTables.findIndex(
        (t) => t.id === sourceTableId
      );
      if (sourceTableIndex >= 0) {
        newTables[sourceTableIndex] = {
          ...newTables[sourceTableIndex],
          guests: newTables[sourceTableIndex].guests.filter(
            (g) => g.id !== guestId
          ),
        };
      }
    } else {
      newUnassigned = newUnassigned.filter((g) => g.id !== guestId);
    }

    // Add guest to target
    if (targetTableId) {
      const targetTableIndex = newTables.findIndex(
        (t) => t.id === targetTableId
      );
      if (targetTableIndex >= 0) {
        newTables[targetTableIndex] = {
          ...newTables[targetTableIndex],
          guests: [...newTables[targetTableIndex].guests, guest],
        };
      }
    } else {
      newUnassigned = [...newUnassigned, guest];
    }

    // Update state
    setTables(newTables);
    setUnassignedGuests(newUnassigned);
    setHasUnsavedChanges(true);
  };

  // Show loading while authenticating
  if (authLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header Skeleton */}
            <div className="text-center mb-8 animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-80 mx-auto"></div>
            </div>

            {/* Controls Skeleton */}
            <Card className="mb-8">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search skeleton */}
                  <div className="flex items-center gap-4">
                    <div className="h-10 bg-gray-200 rounded flex-1 max-w-md animate-pulse"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>

                  {/* Controls skeleton */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Unassigned Guests Skeleton */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <div className="flex items-center justify-between animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full mt-3 animate-pulse"></div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto p-4">
                      <div className="space-y-2">
                        {[...Array(6)].map((_, index) => (
                          <div
                            key={index}
                            className="p-2 bg-gray-50 border rounded-lg animate-pulse"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                                </div>
                              </div>
                              <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tables Skeleton */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <Card
                      key={index}
                      className="min-h-[400px] animate-pulse border-t-4 border-gray-200"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                            <div className="h-5 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[...Array(3)].map((_, guestIndex) => (
                            <div
                              key={guestIndex}
                              className="p-2 bg-gray-50 border rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                  </div>
                                </div>
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
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
            <ProtectedLink href="/events" hasUnsavedChanges={false}>
              <Button>Go to Events</Button>
            </ProtectedLink>
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
          <div className="mb-8">
            {/* Back Navigation */}
            {currentEventId && (
              <ProtectedLink
                href={`/events/${currentEventId}`}
                hasUnsavedChanges={hasUnsavedChanges}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 text-lg font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Event Details
              </ProtectedLink>
            )}

            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Table Assignment
              </h1>
              <p className="text-xl text-gray-600">
                Create tables and assign guests to them
              </p>
            </div>
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
                    <ProtectedLink
                      href="/events"
                      hasUnsavedChanges={hasUnsavedChanges}
                    >
                      <Button className="mr-3">Go to Events</Button>
                    </ProtectedLink>
                    <ProtectedLink
                      href="/"
                      hasUnsavedChanges={hasUnsavedChanges}
                    >
                      <Button variant="outline">Import Guests First</Button>
                    </ProtectedLink>
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
                    {hasUnsavedChanges && (
                      <Badge variant="destructive" className="ml-2">
                        Unsaved Changes
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Save/Discard Controls - Show when there are unsaved changes */}
                  {hasUnsavedChanges && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-blue-800 font-medium">
                            You have unsaved changes
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveChanges}
                            disabled={saving}
                            size="sm"
                            className="min-w-[120px]"
                          >
                            {saving ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </div>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                          <Button
                            onClick={handleDiscardChanges}
                            disabled={saving}
                            variant="outline"
                            size="sm"
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Global Search */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex-1 max-w-md">
                      <Input
                        type="text"
                        placeholder="🔍 Search all guests by name or phone..."
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    {globalSearchQuery && (
                      <Button
                        onClick={() => setGlobalSearchQuery("")}
                        variant="outline"
                        size="sm"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={numTables}
                            onChange={(e) =>
                              setNumTables(Number(e.target.value))
                            }
                            min="1"
                            max="50"
                            className="w-20"
                          />
                          <Button
                            onClick={handleCreateTables}
                            disabled={saving}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create Tables
                          </Button>
                        </div>
                        {tables.length === 0 && unassignedGuests.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Suggested: {Math.ceil(unassignedGuests.length / 4)}{" "}
                            tables for {unassignedGuests.length} guests (3-5 per
                            table)
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleAutoAssign}
                      disabled={
                        saving ||
                        tables.length === 0 ||
                        unassignedGuests.length === 0
                      }
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Auto-Assign
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
                      disabled={saving}
                      variant="outline"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Clear All Assignments
                    </Button>

                    <Button
                      onClick={handleRemoveAllTables}
                      disabled={saving || tables.length === 0}
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove All Tables
                    </Button>

                    <Button
                      onClick={handleReset}
                      disabled={saving}
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
                            {unassignedSearchQuery
                              ? filteredUnassignedGuests.length
                              : unassignedGuests.length}
                            {unassignedSearchQuery &&
                              ` of ${unassignedGuests.length}`}
                          </Badge>
                        </CardTitle>

                        {/* Search Input */}
                        <div className="mb-3">
                          <Input
                            type="text"
                            placeholder="Search unassigned guests..."
                            value={unassignedSearchQuery}
                            onChange={(e) =>
                              setUnassignedSearchQuery(e.target.value)
                            }
                            className="text-sm"
                          />
                        </div>

                        {filteredUnassignedGuests.length > 0 && (
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAllUnassigned}
                            >
                              {selectedGuests.size ===
                              filteredUnassignedGuests.length
                                ? "Deselect All"
                                : "Select All"}
                            </Button>
                            {selectedGuests.size > 0 && (
                              <>
                                <Badge className="bg-blue-500 text-white">
                                  {selectedGuests.size} selected
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Click guests to select, then click table
                                  &ldquo;Assign Selected&rdquo; button
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-0">
                        <div
                          className="max-h-96 overflow-y-auto p-4"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#CBD5E1 #F1F5F9",
                          }}
                        >
                          <UnassignedGuestsArea
                            unassignedGuests={filteredUnassignedGuests}
                            selectedGuests={selectedGuests}
                            onSelectGuest={handleSelectGuest}
                            onClickGuest={handleClickGuest}
                            onEditGuest={handleEditGuest}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tables */}
                  <div className="lg:col-span-3">
                    {globalSearchQuery && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Global search active:</strong> &ldquo;
                          {globalSearchQuery}
                          &rdquo; - Filtering all guests
                        </p>
                      </div>
                    )}
                    {unassignedSearchQuery && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Unassigned search active:</strong> &ldquo;
                          {unassignedSearchQuery}
                          &rdquo; - Filtering unassigned guests only
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredTables.map((table) => (
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
                          onEditTable={setEditingTable}
                          onEditGuest={handleEditGuest}
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
                    <div className="space-y-2 transform rotate-3 scale-105">
                      <div className="shadow-2xl">
                        <DraggableGuest guest={activeGuest} isDragging />
                      </div>
                      {selectedGuests.size > 1 &&
                        selectedGuests.has(activeGuest.id) && (
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm px-4 py-2 rounded-xl shadow-2xl animate-bounce">
                            <Users className="w-4 h-4 inline mr-1" />+
                            {selectedGuests.size - 1} more guest
                            {selectedGuests.size > 2 ? "s" : ""}
                          </div>
                        )}
                    </div>
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

          {/* Table Edit Dialog */}
          {editingTable && (
            <TableEditDialog
              table={editingTable}
              isOpen={!!editingTable}
              onClose={() => setEditingTable(null)}
              onSave={handleUpdateTable}
            />
          )}

          {/* Guest Edit Dialog */}
          <GuestEditDialog
            guest={editingGuest}
            open={!!editingGuest}
            onOpenChange={(open) => !open && setEditingGuest(null)}
            onSave={handleSaveGuest}
            tables={tables}
          />
        </div>
      </div>
    </AppLayout>
  );
}

export default function AssignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assign page...</p>
          </div>
        </div>
      }
    >
      <AssignPageContent />
    </Suspense>
  );
}
