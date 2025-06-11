"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import { authenticatedJsonFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { logEventCreated } from "@/lib/analytics";
import {
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const router = useRouter();

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

        // Log analytics event
        if (user?.uid) {
          await logEventCreated(user.uid, data.event.id, newEventName.trim());
        }

        // Redirect to the new event's detail page after a brief success message
        setTimeout(() => {
          router.push(`/events/${data.event!.id}`);
        }, 1500);
      } else {
        setError(data.error || "Failed to create event.");
      }
    } catch {
      setError("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-8"></div>
              <div className="h-12 bg-gray-200 rounded w-96 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-80 mb-8"></div>
              <Card>
                <CardHeader>
                  <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-64"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                      <div className="h-12 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="h-24 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-12 bg-gray-200 rounded w-24"></div>
                      <div className="h-12 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-3xl mx-auto px-4 py-8">
          {/* Back Navigation */}
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Calendar className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Create New Event
              </h1>
              <Sparkles className="w-8 h-8 text-yellow-500 ml-4 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Start planning your next unforgettable event with our{" "}
              <span className="font-semibold text-blue-600">
                AI-powered platform
              </span>
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl max-w-md mx-auto">
              <div className="flex items-center justify-center text-emerald-700">
                <CheckCircle className="w-6 h-6 mr-3" />
                <p className="font-semibold text-lg">{success}</p>
              </div>
              <p className="text-emerald-600 text-center mt-2">
                Redirecting to your new event...
              </p>
            </div>
          )}

          {/* Create Event Form */}
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Event Details
                </CardTitle>
              </div>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Tell us about your event and we&apos;ll help you create
                something amazing
              </p>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-4 block">
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
                  className="text-lg py-4 border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  disabled={loading || !!success}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-4 block">
                  Description (Optional)
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Share details about your event, theme, or special requirements... (up to 200 characters)"
                    value={newEventDescription}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 200) {
                        setNewEventDescription(value);
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 text-lg shadow-sm hover:shadow-md leading-relaxed"
                    rows={5}
                    disabled={loading || !!success}
                    maxLength={200}
                  />
                  <div className="absolute bottom-3 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
                    {newEventDescription.length}/200
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-red-700 font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-3 text-lg transition-all duration-300"
                  disabled={loading || !!success}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={loading || !!success}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Event...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Event Created!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Event
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-6 mt-8">
                <div className="text-center">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    What happens next?
                  </h3>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>✨ Your event will be created instantly</p>
                    <p>📋 You can then import guests or add them manually</p>
                    <p>
                      🪑 Set up tables and assign guests with our smart tools
                    </p>
                    <p>📱 Send SMS invitations with table assignments</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
