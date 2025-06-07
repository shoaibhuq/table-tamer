"use client";

import { useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import { authenticatedJsonFetch } from "@/lib/api";
import {
  Upload,
  FileSpreadsheet,
  Wand2,
  CheckCircle,
  AlertCircle,
  Users,
  ArrowRight,
  X,
  Check,
  UserPlus,
  FileText,
  Sparkles,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface ProcessedGuest {
  name: string;
  phoneNumber?: string;
  email?: string;
  groupInfo?: string;
  selected?: boolean;
}

interface GuestGroup {
  id: string;
  name: string;
  members: string[];
  suggestedTableSize?: number;
  selected?: boolean;
}

interface ImportResponse {
  success: boolean;
  processedGuests?: ProcessedGuest[];
  detectedGroups?: GuestGroup[];
  hasGroups?: boolean;
  groupIndicators?: {
    hasGroups: boolean;
    groupType: string | null;
    description: string;
  };
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
  message?: string;
  error?: string;
}

export default function ImportGuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadResult, setUploadResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processedGuests, setProcessedGuests] = useState<ProcessedGuest[]>([]);
  const [detectedGroups, setDetectedGroups] = useState<GuestGroup[]>([]);
  const [saving, setSaving] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = [".csv", ".xlsx", ".xls"];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = allowedTypes.some((type) => fileName.endsWith(type));

    if (!isValidType) {
      setError("Please select a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
    setProcessedGuests([]);
    setDetectedGroups([]);
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadStage("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", resolvedParams.id);

      // Simulate processing stages
      setTimeout(() => {
        setUploadStage("Analyzing file structure with AI...");
      }, 1000);

      const response = (await authenticatedJsonFetch("/api/import", {
        method: "POST",
        body: formData,
      })) as ImportResponse;

      setUploadStage("Processing complete!");

      if (response.success) {
        setUploadResult(response);
        // Initialize selection state
        const guestsWithSelection = (response.processedGuests || []).map(
          (guest) => ({
            ...guest,
            selected: true, // Default all guests to selected
          })
        );
        const groupsWithSelection = (response.detectedGroups || []).map(
          (group) => ({
            ...group,
            selected: true, // Default all groups to selected
          })
        );

        setProcessedGuests(guestsWithSelection);
        setDetectedGroups(groupsWithSelection);
      } else {
        setError(response.error || "Failed to process file");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setUploading(false);
      setUploadStage("");
    }
  };

  const handleSaveGuests = async () => {
    const selectedGuests = processedGuests.filter((guest) => guest.selected);
    const selectedGroups = detectedGroups.filter((group) => group.selected);

    if (selectedGuests.length === 0) {
      setError("Please select at least one guest to import");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = (await authenticatedJsonFetch("/api/import/save", {
        method: "POST",
        body: JSON.stringify({
          eventId: resolvedParams.id,
          guests: selectedGuests,
          groups: selectedGroups,
        }),
      })) as { success: boolean; error?: string; savedCount?: number };

      if (response.success) {
        // Redirect to assign tables page or event details
        router.push(`/events/${resolvedParams.id}`);
      } else {
        setError(response.error || "Failed to save guests");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save guests");
    } finally {
      setSaving(false);
    }
  };

  const toggleGuestSelection = (index: number) => {
    setProcessedGuests((prev) =>
      prev.map((guest, i) =>
        i === index ? { ...guest, selected: !guest.selected } : guest
      )
    );
  };

  const toggleGroupSelection = (index: number) => {
    setDetectedGroups((prev) =>
      prev.map((group, i) =>
        i === index ? { ...group, selected: !group.selected } : group
      )
    );
  };

  const selectAllGuests = (selected: boolean) => {
    setProcessedGuests((prev) => prev.map((guest) => ({ ...guest, selected })));
  };

  const selectAllGroups = (selected: boolean) => {
    setDetectedGroups((prev) => prev.map((group) => ({ ...group, selected })));
  };

  const selectedGuestCount = processedGuests.filter((g) => g.selected).length;
  const selectedGroupCount = detectedGroups.filter((g) => g.selected).length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-green-900 to-blue-900 bg-clip-text text-transparent">
                Import Guest List
              </h1>
              <Sparkles className="w-8 h-8 text-yellow-500 ml-4 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Upload your guest list and let our{" "}
              <span className="font-semibold text-blue-600">
                AI-powered system
              </span>{" "}
              intelligently organize and group your guests
            </p>
          </div>

          {/* Upload Section */}
          {!uploadResult && (
            <div className="mb-12">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                    Upload Your Guest List ✨
                  </CardTitle>
                  <p className="text-gray-600 text-lg">
                    Supports CSV and Excel files (.csv, .xlsx, .xls) • Max 10MB
                  </p>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive
                        ? "border-blue-400 bg-blue-50/50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="max-w-md mx-auto">
                      {file ? (
                        <div className="space-y-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                            <FileSpreadsheet className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {file.name}
                            </h3>
                            <p className="text-gray-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex gap-3 justify-center">
                            <Button
                              onClick={handleFileUpload}
                              disabled={uploading}
                              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3"
                            >
                              {uploading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-5 h-5 mr-2" />
                                  Process with AI
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setFile(null)}
                              className="border-2 border-gray-300 hover:border-gray-400"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                            <FileSpreadsheet className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                              Drag & Drop Your File Here
                            </h3>
                            <p className="text-gray-600 text-lg mb-6">
                              Or click to browse and select your guest list
                            </p>
                            <Button
                              onClick={() =>
                                document.getElementById("file-input")?.click()
                              }
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-3"
                            >
                              <Upload className="w-5 h-5 mr-2" />
                              Choose File
                            </Button>
                            <input
                              id="file-input"
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile)
                                  handleFileSelect(selectedFile);
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Status */}
              {uploading && (
                <Card className="mt-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin animate-reverse"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-gray-900 mb-2">
                          {uploadStage}
                        </p>
                        <p className="text-gray-600">
                          Our AI is analyzing your guest list...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Results Section */}
          {uploadResult && (
            <div className="space-y-8">
              {/* Summary */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="py-8">
                  <div className="flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      File Processed Successfully! 🎉
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mb-1">
                        {processedGuests.length}
                      </p>
                      <p className="text-blue-700 font-medium">Guests Found</p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900 mb-1">
                        {detectedGroups.length}
                      </p>
                      <p className="text-purple-700 font-medium">
                        Groups Detected
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-green-900 mb-1">
                        {uploadResult.fileInfo?.name
                          .split(".")
                          .pop()
                          ?.toUpperCase()}
                      </p>
                      <p className="text-green-700 font-medium">File Format</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Selection */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                      <User className="w-6 h-6 mr-3 text-blue-600" />
                      Select Guests to Import
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        {selectedGuestCount} of {processedGuests.length}{" "}
                        selected
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllGuests(true)}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllGuests(false)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          None
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {processedGuests.map((guest, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                          guest.selected
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                        onClick={() => toggleGuestSelection(index)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Checkbox
                            checked={guest.selected}
                            onChange={() => toggleGuestSelection(index)}
                            className="mr-3"
                          />
                          <h3 className="font-semibold text-gray-900 flex-1">
                            {guest.name}
                          </h3>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          {guest.phoneNumber && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-2 text-gray-400" />
                              {guest.phoneNumber}
                            </div>
                          )}
                          {guest.email && (
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-2 text-gray-400" />
                              {guest.email}
                            </div>
                          )}
                          {guest.groupInfo && (
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-2 text-gray-400" />
                              {guest.groupInfo}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Groups Selection */}
              {detectedGroups.length > 0 && (
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                        <Users className="w-6 h-6 mr-3 text-purple-600" />
                        Detected Guest Groups
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg px-4 py-2">
                          {selectedGroupCount} of {detectedGroups.length}{" "}
                          selected
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllGroups(true)}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllGroups(false)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            None
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {detectedGroups.map((group, index) => (
                        <div
                          key={index}
                          className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                            group.selected
                              ? "border-purple-400 bg-purple-50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                          onClick={() => toggleGroupSelection(index)}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Checkbox
                              checked={group.selected}
                              onChange={() => toggleGroupSelection(index)}
                              className="mr-3"
                            />
                            <h3 className="font-bold text-lg text-gray-900 flex-1">
                              {group.name}
                            </h3>
                            {group.suggestedTableSize && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                Table for {group.suggestedTableSize}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 font-medium">
                              Members ({group.members.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {group.members.map((member, memberIndex) => (
                                <Badge
                                  key={memberIndex}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {member}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadResult(null);
                    setProcessedGuests([]);
                    setDetectedGroups([]);
                    setFile(null);
                  }}
                  className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Different File
                </Button>

                <Button
                  onClick={handleSaveGuests}
                  disabled={saving || selectedGuestCount === 0}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-3"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Import {selectedGuestCount} Guest
                      {selectedGuestCount !== 1 ? "s" : ""}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-0 shadow-xl bg-red-50/80 backdrop-blur-sm border-red-200">
              <CardContent className="py-6">
                <div className="flex items-center justify-center text-red-700">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <p className="font-semibold text-lg">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
