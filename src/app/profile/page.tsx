"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { logProfileUpdated } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  LogOut,
  Settings2,
  ChevronDown,
} from "lucide-react";

export default function ProfilePage() {
  const {
    user,
    userProfile,
    logout,
    updateUserProfile,
    sendVerificationEmail,
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    phoneNumber: userProfile?.phoneNumber || "",
  });
  const [namingType, setNamingType] = useState<
    "numbers" | "letters" | "roman" | "custom-prefix" | "custom-names"
  >(userProfile?.tableNamingPreferences?.type || "numbers");
  const [customPrefix, setCustomPrefix] = useState(
    userProfile?.tableNamingPreferences?.customPrefix || ""
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Track original preferences to detect changes
  const [originalNamingType] = useState(
    userProfile?.tableNamingPreferences?.type || "numbers"
  );
  const [originalCustomPrefix] = useState(
    userProfile?.tableNamingPreferences?.customPrefix || ""
  );

  // Table naming scheme options
  const tableNamingOptions = [
    {
      value: "numbers",
      label: "Numbers",
      example: "Table 1, Table 2, Table 3...",
    },
    {
      value: "letters",
      label: "Letters",
      example: "Table A, Table B, Table C...",
    },
    {
      value: "roman",
      label: "Roman Numerals",
      example: "Table I, Table II, Table III...",
    },
    {
      value: "custom-prefix",
      label: "Custom Prefix + Numbers",
      example: "VIP 1, VIP 2, VIP 3...",
    },
    {
      value: "custom-names",
      label: "Custom Names",
      example: "Main Table, VIP Table...",
    },
  ];

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateUserProfile({
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      });

      // Log analytics
      if (user?.uid) {
        const changes: string[] = [];
        if (formData.displayName.trim() !== (user.displayName || ""))
          changes.push("display name");
        if (
          (formData.phoneNumber.trim() || "") !==
          (userProfile?.phoneNumber || "")
        )
          changes.push("phone number");
        if (changes.length > 0) {
          await logProfileUpdated(user.uid, changes);
        }
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || "",
      phoneNumber: userProfile?.phoneNumber || "",
    });
    setNamingType(userProfile?.tableNamingPreferences?.type || "numbers");
    setCustomPrefix(userProfile?.tableNamingPreferences?.customPrefix || "");
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  // Check if naming preferences have changed
  const hasNamingPreferencesChanged = () => {
    const typeChanged = namingType !== originalNamingType;
    const prefixChanged =
      namingType === "custom-prefix"
        ? customPrefix.trim() !== originalCustomPrefix
        : false;

    return typeChanged || prefixChanged;
  };

  const handleSaveNamingPreferences = async () => {
    if (!updateUserProfile) return;

    setSavingPreferences(true);
    setError("");
    setSuccess("");

    try {
      // Build preferences object, only including customPrefix when needed
      const preferences: {
        type: typeof namingType;
        customPrefix?: string;
      } = {
        type: namingType,
      };

      // Only add customPrefix if it's the custom-prefix type and has a value
      if (namingType === "custom-prefix" && customPrefix.trim()) {
        preferences.customPrefix = customPrefix.trim();
      }

      await updateUserProfile({
        tableNamingPreferences: preferences,
      });

      // Log analytics
      if (user?.uid) {
        await logProfileUpdated(user.uid, ["table naming preferences"]);
      }

      setSuccess("Naming preferences saved successfully!");
    } catch (error) {
      console.error("Error saving naming preferences:", error);
      setError("Failed to save naming preferences. Please try again.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendVerificationEmail();
      setSuccess("Verification email sent! Please check your inbox.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = (displayName?: string) => {
    if (!displayName) return "U";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-blue-600">
                    {getUserInitials(user?.displayName || "")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profile Picture</p>
                  <p className="text-xs text-gray-400">
                    Avatar is generated from your initials
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Display Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="Enter your display name"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900">
                    {user?.displayName || "Not set"}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900">
                    {userProfile?.phoneNumber || "Not set"}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-3">
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Address
                </label>
                <div className="flex items-center justify-between">
                  <p className="text-gray-900">{user?.email}</p>
                  <Badge
                    variant={user?.emailVerified ? "default" : "secondary"}
                    className={
                      user?.emailVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {user?.emailVerified ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Unverified
                      </>
                    )}
                  </Badge>
                </div>
                {!user?.emailVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendVerification}
                    disabled={loading}
                  >
                    Send Verification Email
                  </Button>
                )}
              </div>

              {/* Phone Verification */}
              {userProfile?.phoneNumber && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Phone Number
                  </label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{userProfile.phoneNumber}</p>
                    <Badge
                      variant={
                        userProfile.phoneVerified ? "default" : "secondary"
                      }
                      className={
                        userProfile.phoneVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {userProfile.phoneVerified ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Unverified
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Account Creation Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {userProfile?.createdAt &&
                  typeof userProfile.createdAt === "object" &&
                  "seconds" in userProfile.createdAt
                    ? new Date(
                        userProfile.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Naming Preferences */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings2 className="mr-2 h-5 w-5" />
              Table Naming Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Choose how NEW tables should be named when creating tables in
                  events
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  This setting will be used as your default when creating new
                  tables. It does not affect existing tables in your events.
                </p>

                <div className="space-y-3">
                  {tableNamingOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
                        ${
                          namingType === option.value
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="tableNaming"
                          value={option.value}
                          checked={namingType === option.value}
                          onChange={(e) =>
                            setNamingType(e.target.value as typeof namingType)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            Example: {option.example}
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          namingType === option.value ? "rotate-180" : ""
                        }`}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Prefix Input */}
              {namingType === "custom-prefix" && (
                <div className="space-y-2 border-t pt-4">
                  <label className="text-sm font-medium text-gray-700">
                    Custom Prefix
                  </label>
                  <Input
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder="Enter custom prefix (e.g., Table, Desk, Section)"
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500">
                    Preview: {customPrefix || "Table"} 1,{" "}
                    {customPrefix || "Table"} 2, etc.
                  </p>
                </div>
              )}

              {/* Save Preferences Button */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSaveNamingPreferences}
                  disabled={savingPreferences || !hasNamingPreferencesChanged()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingPreferences ? "Saving..." : "Save Naming Preferences"}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  These preferences will be applied when creating new tables in
                  events
                </p>
                {!hasNamingPreferencesChanged() && !savingPreferences && (
                  <p className="text-xs text-blue-600 mt-1">
                    No changes to save
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Sign out of your account
                </h3>
                <p className="text-sm text-gray-500">
                  You will be signed out of all devices and redirected to the
                  login page.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="shrink-0"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
