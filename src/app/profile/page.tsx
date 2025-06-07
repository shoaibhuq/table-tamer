"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
    setIsEditing(false);
    setError("");
    setSuccess("");
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
