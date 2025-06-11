"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestSearchCombobox } from "@/components/ui/guest-search-combobox";
import {
  Search,
  Users,
  MapPin,
  Phone,
  CheckCircle,
  PartyPopper,
  Mail,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { getThemeById, getThemeClasses } from "@/lib/themes";
import { ThemedBackground } from "@/components/ui/themed-background";

interface GuestResult {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string | null;
  email?: string | null;
  table: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  theme?: string;
}

interface EventResponse {
  success: boolean;
  event?: Event;
  error?: string;
}

interface GuestResponse {
  success: boolean;
  guest?: GuestResult;
  error?: string;
}

export default function EventGuestViewPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestResult, setGuestResult] = useState<GuestResult | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      setEventLoading(true);
      const response = await fetch(`/api/public/events/${eventId}`);
      const data: EventResponse = await response.json();

      if (data.success && data.event) {
        setEvent(data.event);
      } else {
        setError(data.error || "Failed to load event information");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event information");
    } finally {
      setEventLoading(false);
    }
  }, [eventId]);

  const searchGuest = async () => {
    if (!searchName.trim()) {
      setError("Please enter a name to search");
      return;
    }

    setLoading(true);
    setError(null);
    setGuestResult(null);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/public/find-guest?eventId=${eventId}&name=${encodeURIComponent(
          searchName.trim()
        )}`
      );
      const data: GuestResponse = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 800));

      if (data.success && data.guest) {
        setGuestResult(data.guest);
      } else {
        setError(data.error || "Guest not found");
      }
    } catch (error) {
      console.error("Error searching guest:", error);
      setError("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSelect = useCallback((guestName: string) => {
    setSearchName(guestName);
  }, []);

  const resetSearch = () => {
    setSearched(false);
    setGuestResult(null);
    setError(null);
    setSearchName("");
  };

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header skeleton */}
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-white/50 rounded-full mx-auto"></div>
                <div className="space-y-3">
                  <div className="h-10 bg-white/50 rounded-lg w-3/4 mx-auto"></div>
                  <div className="h-1 w-20 bg-white/30 rounded-full mx-auto"></div>
                  <div className="h-4 bg-white/30 rounded w-1/2 mx-auto"></div>
                </div>
              </div>

              {/* Search card skeleton */}
              <div className="bg-white/40 rounded-3xl p-8 space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-white/50 rounded-xl mx-auto"></div>
                  <div className="h-8 bg-white/50 rounded w-1/2 mx-auto"></div>
                  <div className="h-5 bg-white/30 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-14 bg-white/50 rounded-xl"></div>
                  <div className="h-14 bg-white/50 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the theme for this event
  const currentTheme = getThemeById(event?.theme || "cosmic-purple");
  const themeClasses = getThemeClasses(currentTheme);

  return (
    <div
      className={`min-h-screen ${themeClasses.backgroundGradient} relative overflow-hidden`}
    >
      {/* Themed decorative elements */}
      <ThemedBackground theme={currentTheme} />

      <div className="relative container mx-auto p-4 max-w-lg">
        {/* Enhanced Header */}
        <div className={`mb-8 ${themeClasses.entrance}`}>
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 ${themeClasses.accentGradient} rounded-full animate-spin-slow blur-lg opacity-60`}
              ></div>
              <div
                className={`relative inline-flex items-center justify-center w-20 h-20 ${themeClasses.primaryGradient} rounded-full shadow-2xl border-4 border-white/20`}
              >
                <PartyPopper className="h-9 w-9 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
                <h1
                  className={`text-4xl md:text-5xl font-black ${themeClasses.secondaryGradient} bg-clip-text text-transparent drop-shadow-lg animate-shimmer leading-tight`}
                >
                  {event?.name || "Event Guest Finder"}
                </h1>
                <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
              </div>

              <div
                className={`h-1 w-24 ${themeClasses.accentGradient} mx-auto rounded-full shadow-lg`}
              ></div>

              {event?.description && (
                <p
                  className={`${themeClasses.textSecondaryColor} text-base max-w-sm mx-auto leading-relaxed font-medium bg-white/20 backdrop-blur-sm rounded-full px-6 py-2`}
                >
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search Card */}
        <Card
          className={`mb-8 shadow-2xl border-0 ${themeClasses.cardBackground} relative overflow-hidden backdrop-blur-xl`}
        >
          <div
            className={`absolute inset-0 ${themeClasses.secondaryGradient} opacity-10`}
          ></div>
          <div
            className={`absolute top-0 left-0 w-full h-2 ${themeClasses.primaryGradient} shadow-lg`}
          ></div>

          <CardHeader className="text-center pb-4 relative z-10 px-6 py-6">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 ${themeClasses.secondaryGradient} rounded-xl mb-3 shadow-lg`}
            >
              <Search
                className={`h-6 w-6 ${
                  currentTheme.id === "enchanted-garden"
                    ? "text-green-700"
                    : currentTheme.id === "golden-elegance"
                    ? "text-amber-700"
                    : currentTheme.id === "ocean-breeze"
                    ? "text-blue-700"
                    : "text-purple-700"
                }`}
              />
            </div>
            <CardTitle
              className={`text-2xl font-black ${themeClasses.primaryGradient} bg-clip-text text-transparent mb-2`}
            >
              Find Your Table
            </CardTitle>
            <p className="text-gray-600 text-base font-semibold bg-white/60 rounded-full px-4 py-2 inline-block">
              ✨ Start typing your name below ✨
            </p>
          </CardHeader>

          <CardContent className="pt-0 relative z-10 px-6 pb-6">
            <div className="space-y-6">
              <div className="relative">
                <GuestSearchCombobox
                  value={searchName}
                  onValueChange={setSearchName}
                  onSelect={handleGuestSelect}
                  disabled={loading}
                  placeholder="Enter your full name..."
                  className="h-14 text-lg font-medium shadow-lg"
                  eventId={eventId}
                />
              </div>

              <Button
                onClick={searchGuest}
                disabled={loading || !searchName.trim()}
                className={`w-full h-14 text-lg font-bold ${themeClasses.primaryGradient} hover:opacity-90 text-white rounded-xl shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform ${themeClasses.hover} active:scale-95 relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {loading ? (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white"></div>
                    <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent font-black">
                      Searching Guest List...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <Search className="h-6 w-6" />
                    <span className="font-black tracking-wide">
                      Find My Table
                    </span>
                  </div>
                )}
              </Button>

              {/* Enhanced Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-pink-200 border-r-pink-500 rounded-full animate-spin animate-reverse"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-700 font-semibold">
                      Searching our guest list...
                    </p>
                    <p className="text-gray-500 text-sm">
                      This may take a moment
                    </p>
                  </div>
                </div>
              )}

              {/* Enhanced Error State */}
              {error && !loading && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Search className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-800 mb-1">
                        Oops! Something went wrong
                      </h3>
                      <p className="text-red-600 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Results Section */}
        {searched && !loading && (
          <div className="space-y-6">
            {guestResult ? (
              <Card className="border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-2xl relative overflow-hidden animate-fade-in backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-teal-400/10"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-lg"></div>

                <CardHeader className="text-center pb-6 relative z-10 px-6 py-8">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse blur-lg opacity-40"></div>
                    <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full shadow-2xl border-4 border-white/30">
                      <CheckCircle className="h-10 w-10 text-white animate-bounce" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <CardTitle className="text-3xl font-black bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Welcome,{" "}
                      {guestResult.firstName && guestResult.lastName
                        ? `${guestResult.firstName} ${guestResult.lastName}`
                        : guestResult.name}
                      !
                    </CardTitle>
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-green-700 font-bold bg-white/70 rounded-full px-6 py-3 inline-block shadow-lg">
                      ✨ Found your table! ✨
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-8">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/70 rounded-xl shadow-lg">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Guest Name
                        </span>
                        <p className="text-lg font-bold text-gray-900">
                          {guestResult.firstName && guestResult.lastName
                            ? `${guestResult.firstName} ${guestResult.lastName}`
                            : guestResult.name}
                        </p>
                      </div>
                    </div>

                    {guestResult.email && (
                      <div className="flex items-center gap-4 p-4 bg-white/70 rounded-xl shadow-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Email Address
                          </span>
                          <p className="text-lg font-bold text-gray-900">
                            {guestResult.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {guestResult.phoneNumber && (
                      <div className="flex items-center gap-4 p-4 bg-white/70 rounded-xl shadow-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Phone className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </span>
                          <p className="text-lg font-bold text-gray-900">
                            {guestResult.phoneNumber}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-white/80 to-blue-50/80 rounded-xl border-3 border-blue-200 shadow-xl">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Table Assignment
                        </span>
                        {guestResult.table ? (
                          <div className="flex items-center gap-3 mt-2">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                              style={{
                                backgroundColor: guestResult.table.color,
                              }}
                            ></div>
                            <span className="text-2xl font-black text-gray-900">
                              {guestResult.table.name}
                            </span>
                          </div>
                        ) : (
                          <p className="text-lg text-gray-500 italic mt-2 font-medium">
                            Table assignment coming soon...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {guestResult.table && (
                    <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white shadow-xl">
                      <p className="text-lg font-black mb-1">
                        🎉 You&apos;re all set!
                      </p>
                      <p className="text-blue-100 font-semibold">
                        Look for your table when you arrive
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-3 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Search className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-black text-yellow-800 mb-3">
                    Guest Not Found
                  </h3>
                  <p className="text-yellow-700 mb-4 font-semibold">
                    We couldn&apos;t find a guest with that name. Please check
                    the spelling and try again.
                  </p>
                  <p className="text-sm text-yellow-600 font-medium bg-white/50 rounded-lg px-4 py-2 inline-block">
                    💡 Try using your full name as it appears on the invitation
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                onClick={resetSearch}
                variant="outline"
                className="bg-white/90 hover:bg-white border-3 border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-800 font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Search Again
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Welcome Message */}
        {!searched && !loading && (
          <div className="text-center px-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <p className="text-gray-700 font-bold text-lg">
                  Welcome to the Event!
                </p>
                <Sparkles className="h-5 w-5 text-pink-400" />
              </div>
              <p className="text-gray-600 font-medium">
                Use your full name as shown on the invitation for best results
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
