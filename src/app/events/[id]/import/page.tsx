"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Guest } from "@/lib/firestore";
import { authenticatedJsonFetch, authenticatedFetch } from "@/lib/api";
import {
  Upload,
  ArrowRight,
  CheckCircle,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditGuestData {
  name: string;
  phoneNumber: string;
}

export default function GuestImportPage() {
  const { user, loading, authError } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [fetchingGuests, setFetchingGuests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<EditGuestData>({
    name: "",
    phoneNumber: "",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [envError, setEnvError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Firebase is already initialized and working through the AuthContext
  // No need for additional environment variable checks

  // Check for auth errors from Firebase initialization
  useEffect(() => {
    if (authError) {
      setEnvError(authError);
    }
  }, [authError]);

  // Enhanced error handling function
  const handleApiError = (error: unknown, response?: Response): string => {
    console.error("API Error:", error);

    // Check for environment-related errors
    if (response?.status === 500) {
      return "Server configuration error. Please check your environment variables and database connection.";
    }

    if (response?.status === 503) {
      return "Service temporarily unavailable. This might be due to database connection issues.";
    }

    if (error instanceof Error) {
      // Check for Firebase-specific errors
      if (
        error.message.includes("Firebase") ||
        error.message.includes("firebase")
      ) {
        return "Firebase configuration error. Please check your Firebase environment variables.";
      }

      // Check for database connection errors
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("getaddrinfo ENOTFOUND")
      ) {
        return "Database connection failed. Please check your DATABASE_URL environment variable.";
      }

      // Check for authentication errors
      if (
        error.message.includes("JWT") ||
        error.message.includes("authentication")
      ) {
        return "Authentication configuration error. Please check your JWT_SECRET environment variable.";
      }

      // Check for missing API keys
      if (
        error.message.includes("API key") ||
        error.message.includes("unauthorized")
      ) {
        return "API key configuration error. Please check your environment variables.";
      }

      return error.message;
    }

    return "Unknown error occurred";
  };

  // Redirect to events if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/events");
    }
  }, [user, loading, router]);

  // Cleanup function to abort ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch with timeout utility

  const fetchGuests = useCallback(
    async (retryAttempt: number = 0) => {
      // Prevent multiple simultaneous requests
      if (isFetchingRef.current) return;

      // Don't fetch if there's an auth error
      if (envError) {
        setError(envError);
        return;
      }

      // Use a ref to track if we're already fetching to prevent race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      isFetchingRef.current = true;
      setFetchingGuests(true);
      setError(null);

      try {
        const data = (await authenticatedJsonFetch(
          `/api/guests?eventId=${eventId}`
        )) as {
          success: boolean;
          guests?: Guest[];
          error?: string;
        };

        // Check for API-level environment errors
        if (!data.success && data.error) {
          if (
            data.error.includes("DATABASE_URL") ||
            data.error.includes("connection") ||
            data.error.includes("environment") ||
            data.error.includes("configuration")
          ) {
            throw new Error(`Configuration Error: ${data.error}`);
          }
        }

        if (data.success && Array.isArray(data.guests)) {
          setGuests(data.guests);
          setRetryCount(0); // Reset retry count on success
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (error) {
        console.error("Error fetching guests:", error);

        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted, don't show error
          return;
        }

        const errorMessage = handleApiError(error);

        // Don't retry configuration errors
        if (
          errorMessage.includes("Configuration Error") ||
          errorMessage.includes("environment") ||
          errorMessage.includes("DATABASE_URL") ||
          errorMessage.includes("JWT_SECRET")
        ) {
          setError(`Failed to load guests: ${errorMessage}`);
          setGuests([]);
          return;
        }

        // Retry logic for network errors (max 3 attempts)
        if (
          retryAttempt < 2 &&
          (errorMessage.includes("fetch") ||
            errorMessage.includes("network") ||
            errorMessage.includes("timeout"))
        ) {
          console.log(`Retrying fetch attempt ${retryAttempt + 1}`);
          setRetryCount(retryAttempt + 1);
          setTimeout(() => {
            fetchGuests(retryAttempt + 1);
          }, 1000 * (retryAttempt + 1)); // Exponential backoff
          return;
        }

        setError(`Failed to load guests: ${errorMessage}`);
        setGuests([]);
      } finally {
        isFetchingRef.current = false;
        setFetchingGuests(false);
      }
    },
    [eventId, envError]
  );

  useEffect(() => {
    if (user && eventId) {
      fetchGuests();
    }
  }, [user, eventId, fetchGuests]);

  // Show loading while authenticating
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth error screen if there's a Firebase auth error
  if (envError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{envError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        setError("Please select a CSV file.");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size must be less than 10MB.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const droppedFile = files[0];
      if (
        droppedFile.type !== "text/csv" &&
        !droppedFile.name.endsWith(".csv")
      ) {
        setError("Please select a CSV file.");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size must be less than 10MB.");
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import.");
      return;
    }

    setLoadingRequest(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", eventId);

    try {
      // Use authenticatedFetch for file upload (FormData)
      const response = await authenticatedFetch("/api/import", {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it for FormData
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(
          new Error(`HTTP ${response.status}`),
          response
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Check for environment-related errors in the response
      if (!data.success && data.error) {
        if (
          data.error.includes("DATABASE_URL") ||
          data.error.includes("connection") ||
          data.error.includes("environment") ||
          data.error.includes("configuration")
        ) {
          throw new Error(`Configuration Error: ${data.error}`);
        }
      }

      if (data.success) {
        setSuccess(
          `Successfully imported ${data.imported || 0} guests${
            data.skipped ? ` (${data.skipped} duplicates skipped)` : ""
          }!`
        );
        await fetchGuests();
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(data.error || "Failed to import guests.");
      }
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = handleApiError(error);
      setError(`Import failed: ${errorMessage}`);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleSelectGuest = (guestId: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setSelectedGuests(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGuests.size === guests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(guests.map((g) => g.id)));
    }
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setEditData({
      name: guest.name,
      phoneNumber: guest.phoneNumber || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGuest) return;

    if (!editData.name.trim()) {
      setError("Guest name is required.");
      return;
    }

    setLoadingRequest(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch(
        `/api/guests/${editingGuest.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editData.name.trim(),
            phoneNumber: editData.phoneNumber.trim() || null,
          }),
        }
      )) as {
        success: boolean;
        guest?: Guest;
        error?: string;
      };

      // Check for environment-related errors
      if (!data.success && data.error) {
        if (
          data.error.includes("DATABASE_URL") ||
          data.error.includes("connection") ||
          data.error.includes("environment") ||
          data.error.includes("configuration")
        ) {
          throw new Error(`Configuration Error: ${data.error}`);
        }
      }

      if (data.success) {
        setSuccess("Guest updated successfully!");
        await fetchGuests();
        setEditDialogOpen(false);
        setEditingGuest(null);
      } else {
        setError(data.error || "Failed to update guest.");
      }
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage = handleApiError(error);
      setError(`Update failed: ${errorMessage}`);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGuests.size === 0) {
      setError("Please select guests to delete.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedGuests.size} selected guest(s)?`
      )
    ) {
      return;
    }

    setLoadingRequest(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch("/api/guests/bulk-delete", {
        method: "DELETE",
        body: JSON.stringify({
          guestIds: Array.from(selectedGuests),
        }),
      })) as {
        success: boolean;
        error?: string;
      };

      // Check for environment-related errors
      if (!data.success && data.error) {
        if (
          data.error.includes("DATABASE_URL") ||
          data.error.includes("connection") ||
          data.error.includes("environment") ||
          data.error.includes("configuration")
        ) {
          throw new Error(`Configuration Error: ${data.error}`);
        }
      }

      if (data.success) {
        setSuccess(`Successfully deleted ${selectedGuests.size} guest(s).`);
        setSelectedGuests(new Set());
        await fetchGuests();
      } else {
        setError(data.error || "Failed to delete guests.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = handleApiError(error);
      setError(`Delete failed: ${errorMessage}`);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) {
      return;
    }

    setLoadingRequest(true);
    setError(null);

    try {
      const data = (await authenticatedJsonFetch(`/api/guests/${guestId}`, {
        method: "DELETE",
      })) as {
        success: boolean;
        error?: string;
      };

      // Check for environment-related errors
      if (!data.success && data.error) {
        if (
          data.error.includes("DATABASE_URL") ||
          data.error.includes("connection") ||
          data.error.includes("environment") ||
          data.error.includes("configuration")
        ) {
          throw new Error(`Configuration Error: ${data.error}`);
        }
      }

      if (data.success) {
        setSuccess("Guest deleted successfully!");
        await fetchGuests();
      } else {
        setError(data.error || "Failed to delete guest.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = handleApiError(error);
      setError(`Delete failed: ${errorMessage}`);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    fetchGuests();
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header with back navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/events/${eventId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Import Guests</h1>
          <p className="text-gray-600 mt-2">
            Upload a CSV file to import your guest list for this event
          </p>

          {/* CSV Format info */}
          <div className="text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-md">
            <p>
              <strong>CSV Format:</strong> name, phoneNumber (optional)
            </p>
            <p>Example: John Doe, +1234567890</p>
            <p className="text-xs mt-1">Maximum file size: 10MB</p>
          </div>
        </div>

        {/* Enhanced Upload Section with Drag & Drop */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload Guest List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50 scale-105 shadow-lg"
                    : file
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragOver && (
                <div className="absolute inset-0 bg-blue-100 rounded-lg flex items-center justify-center animate-pulse">
                  <div className="text-blue-600 font-medium flex items-center">
                    <Upload className="w-6 h-6 mr-2 animate-bounce" />
                    Drop your CSV file here!
                  </div>
                </div>
              )}

              <div className={`space-y-4 ${isDragOver ? "opacity-50" : ""}`}>
                <div
                  className={`mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center transition-all duration-300 ${
                    file ? "bg-green-100 text-green-600" : "text-gray-400"
                  }`}
                >
                  {file ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                {file ? (
                  <div className="space-y-2">
                    <p className="text-green-700 font-medium">
                      ✅ File Selected
                    </p>
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">
                      Drop your CSV file here
                    </p>
                    <p className="text-gray-500">or click to browse files</p>
                  </div>
                )}

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loadingRequest || fetchingGuests}
                />

                {!file && (
                  <Button
                    variant="outline"
                    className="mt-4 pointer-events-none"
                  >
                    Choose CSV File
                  </Button>
                )}
              </div>
            </div>

            {/* Import Button */}
            {file && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleImport}
                  disabled={loadingRequest || fetchingGuests}
                  className="px-8 py-3 text-lg"
                  size="lg"
                >
                  {loadingRequest ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Importing...
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Import CSV ({file.name})
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-red-600">{error}</p>
                  {error.includes("Failed to load guests") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={fetchingGuests}
                    >
                      {fetchingGuests ? "Retrying..." : "Retry"}
                    </Button>
                  )}
                </div>
                {retryCount > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Retry attempt {retryCount}/3
                  </p>
                )}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            {fetchingGuests && !error && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <p className="text-blue-600">Loading guests...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guests List with scrollable content and skeleton loading */}
        {fetchingGuests ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading Guests...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Skeleton Loaders */}
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : guests.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Imported Guests ({guests.length})</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={loadingRequest || fetchingGuests}
                  >
                    {selectedGuests.size === guests.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  {selectedGuests.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={loadingRequest || fetchingGuests}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedGuests.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Scrollable guest list */}
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => handleSelectGuest(guest.id)}
                        className="rounded border-gray-300"
                        disabled={loadingRequest || fetchingGuests}
                      />
                      <div>
                        <p className="font-medium">{guest.name}</p>
                        {guest.phoneNumber && (
                          <p className="text-sm text-gray-500">
                            {guest.phoneNumber}
                          </p>
                        )}
                      </div>
                      {guest.tableId && (
                        <Badge variant="secondary">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Assigned
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGuest(guest)}
                        disabled={loadingRequest || fetchingGuests}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGuest(guest.id)}
                        disabled={loadingRequest || fetchingGuests}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {guests.filter((g) => g.tableId).length} of {guests.length}{" "}
                  guests assigned to tables
                </p>
                <Link
                  href={`/assign?eventId=${eventId}`}
                  className="inline-flex items-center"
                >
                  <Button disabled={fetchingGuests}>
                    Assign Tables
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                No guests found for this event.
              </p>
              <Button variant="outline" onClick={handleRetry}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Guest Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
              <DialogDescription>
                Update the guest information below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  placeholder="Guest name"
                  disabled={loadingRequest}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={editData.phoneNumber}
                  onChange={(e) =>
                    setEditData({ ...editData, phoneNumber: e.target.value })
                  }
                  placeholder="Phone number (optional)"
                  disabled={loadingRequest}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loadingRequest}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={loadingRequest}>
                {loadingRequest ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
