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
  Link,
  Instagram,
  Facebook,
  Twitter,
  Calendar,
  Camera,
  Music,
  Gift,
  Star,
  Heart,
  Home,
  Globe,
  Utensils,
  Car,
  Plane,
  Coffee,
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

interface EventLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  description?: string;
  order: number;
  isActive: boolean;
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

// Helper function to get the appropriate icon component
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    link: Link,
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    "map-pin": MapPin,
    phone: Phone,
    mail: Mail,
    calendar: Calendar,
    camera: Camera,
    music: Music,
    gift: Gift,
    star: Star,
    heart: Heart,
    home: Home,
    globe: Globe,
    utensils: Utensils,
    car: Car,
    plane: Plane,
    coffee: Coffee,
    users: Users,
  };
  return iconMap[iconName] || Link;
};

// Helper function to ensure URL has proper protocol
const ensureHttps = (url: string): string => {
  if (!url) return "";

  // If URL already has a protocol, return as is
  if (url.match(/^https?:\/\//i)) {
    return url;
  }

  // If URL starts with //, add https:
  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  // Otherwise, add https:// prefix
  return `https://${url}`;
};

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
  const [eventLinks, setEventLinks] = useState<EventLink[]>([]);

  const fetchEvent = useCallback(async () => {
    try {
      setEventLoading(true);
      const [eventResponse, linksResponse] = await Promise.all([
        fetch(`/api/public/events/${eventId}`),
        fetch(`/api/public/events/${eventId}/links`),
      ]);

      const eventData: EventResponse = await eventResponse.json();
      const linksData = await linksResponse.json();

      if (eventData.success && eventData.event) {
        setEvent(eventData.event);
      } else {
        setError(eventData.error || "Failed to load event information");
      }

      if (linksData.success && linksData.links) {
        setEventLinks(linksData.links);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event information");
    } finally {
      setEventLoading(false);
    }
  }, [eventId]);

  // Helper function to extract guest name from formatted display name
  const extractGuestNameFromInput = useCallback((input: string): string => {
    // Remove phone number part if it exists (e.g., "Hannah Montana (•••• 1234)" -> "Hannah Montana")
    const phonePattern = /\s*\([•\s\d]+\)\s*$/;
    return input.replace(phonePattern, "").trim();
  }, []);

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
      // Clean the search name to remove any formatted phone numbers
      const cleanSearchName = extractGuestNameFromInput(searchName.trim());
      console.log(
        "🔍 Searching for guest:",
        cleanSearchName,
        "from input:",
        searchName
      );

      const response = await fetch(
        `/api/public/find-guest?eventId=${eventId}&name=${encodeURIComponent(
          cleanSearchName
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

  const handleGuestSelect = useCallback(
    async (guestName: string) => {
      console.log("🎯 Guest selected, auto-searching for:", guestName);
      setSearchName(guestName);

      // Automatically trigger search when a guest is selected from suggestions
      setTimeout(async () => {
        if (!guestName.trim()) return;

        setLoading(true);
        setError(null);
        setGuestResult(null);
        setSearched(true);

        try {
          // Clean the search name to remove any formatted phone numbers
          const cleanSearchName = extractGuestNameFromInput(guestName.trim());
          console.log("🔍 Auto-searching for guest:", cleanSearchName);

          const response = await fetch(
            `/api/public/find-guest?eventId=${eventId}&name=${encodeURIComponent(
              cleanSearchName
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
      }, 200);
    },
    [eventId, extractGuestNameFromInput]
  );

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

      <div className="relative container mx-auto px-3 sm:px-4 py-4 max-w-lg">
        {/* Enhanced Header */}
        <div className={`mb-6 sm:mb-8 ${themeClasses.entrance}`}>
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 ${themeClasses.accentGradient} rounded-full animate-spin-slow blur-lg opacity-60`}
              ></div>
              <div
                className={`relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 ${themeClasses.primaryGradient} rounded-full shadow-2xl border-4 border-white/20`}
              >
                <PartyPopper className="h-7 w-7 sm:h-9 sm:w-9 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 animate-pulse" />
                <h1
                  className={`text-2xl sm:text-4xl md:text-5xl font-black ${themeClasses.secondaryGradient} bg-clip-text text-transparent drop-shadow-lg animate-shimmer leading-tight px-2`}
                >
                  {event?.name || "Event Guest Finder"}
                </h1>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400 animate-pulse" />
              </div>

              <div
                className={`h-1 w-20 sm:w-24 ${themeClasses.accentGradient} mx-auto rounded-full shadow-lg`}
              ></div>

              {event?.description && (
                <p
                  className={`${themeClasses.textSecondaryColor} text-sm sm:text-base max-w-xs sm:max-w-sm mx-auto leading-relaxed font-medium bg-white/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2`}
                >
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search Card */}
        <div className="animate-fade-in">
          <Card
            className={`mb-6 sm:mb-8 relative bg-gradient-to-r from-white/30 via-white/25 to-white/30 backdrop-blur-md border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group overflow-hidden`}
          >
            {/* Animated Background Elements */}
            <div
              className={`absolute inset-0 ${themeClasses.secondaryGradient} opacity-10`}
            ></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-float-delayed"></div>
            <div
              className={`absolute top-0 left-0 w-full h-2 ${themeClasses.primaryGradient} shadow-lg`}
            ></div>

            <CardHeader className="text-center pb-3 sm:pb-4 relative z-10 px-4 sm:px-6 py-4 sm:py-6">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ${themeClasses.secondaryGradient} rounded-xl mb-2 sm:mb-3 shadow-lg animate-bounce-gentle`}
              >
                <Search
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
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
                className={`text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-purple-50 to-white bg-clip-text text-transparent mb-2 drop-shadow-xl animate-shimmer leading-tight`}
              >
                🔍 Find Your Table 🔍
              </CardTitle>
              <p className="text-white/90 text-sm sm:text-base font-semibold bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 inline-block border border-white/30 drop-shadow-lg">
                ✨ Start typing your name below ✨
              </p>

              {/* Floating Particles */}
              <div className="absolute top-2 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-float-particle"></div>
              <div className="absolute bottom-3 right-1/3 w-1.5 h-1.5 bg-purple-300/60 rounded-full animate-float-particle animate-delay-700"></div>
              <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-300/60 rounded-full animate-float-particle animate-delay-1000"></div>
            </CardHeader>

            <CardContent className="pt-0 relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="relative">
                  <GuestSearchCombobox
                    value={searchName}
                    onValueChange={setSearchName}
                    onSelect={handleGuestSelect}
                    disabled={loading}
                    placeholder="Enter your full name..."
                    className="h-12 sm:h-14 text-base sm:text-lg font-medium shadow-lg"
                    eventId={eventId}
                  />
                </div>

                <Button
                  onClick={searchGuest}
                  disabled={loading || !searchName.trim()}
                  className={`w-full h-12 sm:h-14 text-base sm:text-lg font-bold ${themeClasses.primaryGradient} hover:opacity-90 text-white rounded-xl shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform ${themeClasses.hover} active:scale-95 relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {loading ? (
                    <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-3 border-white/30 border-t-white"></div>
                      <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent font-black text-sm sm:text-base">
                        Searching Guest List...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                      <Search className="h-5 w-5 sm:h-6 sm:w-6" />
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
        </div>

        {/* Enhanced Results Section */}
        {searched && !loading && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {guestResult ? (
              <Card className="border border-white/30 relative bg-gradient-to-r from-white/30 via-white/25 to-white/30 backdrop-blur-md shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/15 via-emerald-400/15 to-teal-400/15 animate-pulse"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-float-delayed"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-lg"></div>

                <CardHeader className="text-center pb-4 sm:pb-6 relative z-10 px-4 sm:px-6 py-6 sm:py-8">
                  <div className="relative inline-block mb-3 sm:mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse blur-lg opacity-40"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full shadow-2xl border-4 border-white/30 animate-bounce-gentle">
                      <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-sparkle" />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <CardTitle className="text-xl sm:text-3xl font-black bg-gradient-to-r from-white via-green-50 to-white bg-clip-text text-transparent leading-tight px-2 drop-shadow-xl animate-shimmer">
                      🎉 Welcome,{" "}
                      {guestResult.firstName && guestResult.lastName
                        ? `${guestResult.firstName} ${guestResult.lastName}`
                        : guestResult.name}
                      ! 🎉
                    </CardTitle>
                    <div className="text-3xl sm:text-4xl mb-2 animate-bounce-gentle">
                      ✨🎊✨
                    </div>
                    <p className="text-white/90 font-bold bg-white/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 inline-block shadow-lg text-sm sm:text-base border border-white/30 drop-shadow-lg">
                      🌟 Found your table! 🌟
                    </p>
                  </div>

                  {/* Floating Particles */}
                  <div className="absolute top-2 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-float-particle"></div>
                  <div className="absolute bottom-3 right-1/3 w-1.5 h-1.5 bg-green-300/60 rounded-full animate-float-particle animate-delay-700"></div>
                  <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-emerald-300/60 rounded-full animate-float-particle animate-delay-1000"></div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-6 sm:pb-8">
                  <div className="grid gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/70 rounded-xl shadow-lg">
                      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Guest Name
                        </span>
                        <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                          {guestResult.firstName && guestResult.lastName
                            ? `${guestResult.firstName} ${guestResult.lastName}`
                            : guestResult.name}
                        </p>
                      </div>
                    </div>

                    {guestResult.email && (
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/70 rounded-xl shadow-lg">
                        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Email Address
                          </span>
                          <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                            {guestResult.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {guestResult.phoneNumber && (
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/70 rounded-xl shadow-lg">
                        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </span>
                          <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                            {guestResult.phoneNumber}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-white/80 to-blue-50/80 rounded-xl border-3 border-blue-200 shadow-xl">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Table Assignment
                        </span>
                        {guestResult.table ? (
                          <div className="flex items-center gap-2 sm:gap-3 mt-2">
                            <div
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-lg flex-shrink-0"
                              style={{
                                backgroundColor: guestResult.table.color,
                              }}
                            ></div>
                            <span className="text-xl sm:text-2xl font-black text-gray-900 truncate">
                              {guestResult.table.name}
                            </span>
                          </div>
                        ) : (
                          <p className="text-base sm:text-lg text-gray-500 italic mt-2 font-medium">
                            Table assignment coming soon...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {guestResult.table && (
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white shadow-xl">
                      <p className="text-base sm:text-lg font-black mb-1">
                        🎉 You&apos;re all set!
                      </p>
                      <p className="text-blue-100 font-semibold text-sm sm:text-base">
                        Look for your table when you arrive
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-white/30 relative bg-gradient-to-r from-white/30 via-white/25 to-white/30 backdrop-blur-md shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-yellow-400/15 to-orange-400/15 animate-pulse"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-float-delayed"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 shadow-lg"></div>

                <CardContent className="p-4 sm:p-6 text-center relative z-10">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg animate-bounce-gentle border-2 border-white/30">
                    <Search className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600 animate-sparkle" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black bg-gradient-to-r from-white via-amber-50 to-white bg-clip-text text-transparent mb-2 sm:mb-3 drop-shadow-xl animate-shimmer">
                    🔍 Guest Not Found 🔍
                  </h3>
                  <p className="text-white/90 mb-3 sm:mb-4 font-semibold text-sm sm:text-base drop-shadow-lg leading-relaxed">
                    We couldn&apos;t find a guest with that name. Please check
                    the spelling and try again.
                  </p>
                  <p className="text-white/80 font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 inline-block border border-white/30 text-xs sm:text-sm">
                    💡 Try using your full name as it appears on the invitation
                  </p>

                  {/* Floating Particles */}
                  <div className="absolute top-2 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-float-particle"></div>
                  <div className="absolute bottom-3 right-1/3 w-1.5 h-1.5 bg-amber-300/60 rounded-full animate-float-particle animate-delay-700"></div>
                  <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-yellow-300/60 rounded-full animate-float-particle animate-delay-1000"></div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                onClick={resetSearch}
                variant="outline"
                className="relative bg-gradient-to-r from-white/30 via-white/25 to-white/30 backdrop-blur-md border border-white/40 hover:border-white/60 text-white hover:text-white font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-sm sm:text-base group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-bounce-gentle" />
                  <span className="drop-shadow-lg">🔄 Search Again</span>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Welcome Message */}
        {!searched && !loading && (
          <div className="text-center px-3 sm:px-6 animate-fade-in">
            <div
              className={`relative bg-gradient-to-r from-white/30 via-white/25 to-white/30 backdrop-blur-md rounded-3xl px-5 sm:px-8 py-5 sm:py-7 shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 hover:scale-105 group overflow-hidden`}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-pulse"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-float-delayed"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300 animate-spin-slow drop-shadow-lg" />
                  <h2
                    className={`font-black text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-white via-purple-50 to-white bg-clip-text text-transparent drop-shadow-xl animate-shimmer leading-tight`}
                  >
                    ✨ Welcome to the Event! ✨
                  </h2>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-pink-300 animate-spin-slow animate-reverse drop-shadow-lg" />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <p className="text-white/90 font-semibold text-sm sm:text-base md:text-lg drop-shadow-lg leading-relaxed">
                    Use your full name as shown on the invitation for best
                    results
                  </p>

                  {/* Animated Hint */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 border border-white/30 animate-bounce-gentle">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-xs sm:text-sm text-white/80 font-medium">
                      Find event resources below
                    </span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animate-delay-300 shadow-lg shadow-blue-400/50"></div>
                  </div>
                </div>
              </div>

              {/* Floating Particles */}
              <div className="absolute top-2 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-float-particle"></div>
              <div className="absolute bottom-3 right-1/3 w-1.5 h-1.5 bg-purple-300/60 rounded-full animate-float-particle animate-delay-700"></div>
              <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-300/60 rounded-full animate-float-particle animate-delay-1000"></div>
            </div>
          </div>
        )}

        {/* Event Links Section */}
        {eventLinks.length > 0 && (
          <div className="mt-6 sm:mt-8 px-2 sm:px-3 md:px-6 animate-fade-in">
            <Card
              className={`relative bg-gradient-to-r from-white/30 via-white/25 to-white/30 backdrop-blur-md border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group overflow-hidden mx-auto max-w-lg`}
            >
              {/* Animated Background Elements */}
              <div
                className={`absolute inset-0 ${themeClasses.secondaryGradient} opacity-10`}
              ></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-float-delayed"></div>
              <div
                className={`absolute top-0 left-0 w-full h-2 ${themeClasses.primaryGradient} shadow-lg`}
              ></div>

              <CardHeader className="text-center pb-3 sm:pb-4 relative z-10 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 ${themeClasses.secondaryGradient} rounded-xl mb-2 sm:mb-3 shadow-lg animate-bounce-gentle`}
                >
                  <Sparkles
                    className={`h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6 ${
                      currentTheme.id === "enchanted-garden"
                        ? "text-green-700"
                        : currentTheme.id === "golden-elegance"
                        ? "text-amber-700"
                        : currentTheme.id === "ocean-breeze"
                        ? "text-blue-700"
                        : "text-purple-700"
                    } animate-sparkle`}
                  />
                </div>
                <CardTitle
                  className={`text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-white via-purple-50 to-white bg-clip-text text-transparent mb-2 leading-tight px-1 drop-shadow-xl animate-shimmer`}
                >
                  📚 Event Resources 📚
                </CardTitle>
                <p className="text-white/90 text-xs sm:text-sm font-semibold bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 inline-block border border-white/30 drop-shadow-lg">
                  ✨ Helpful links for the event ✨
                </p>

                {/* Floating Particles */}
                <div className="absolute top-2 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-float-particle"></div>
                <div className="absolute bottom-3 right-1/3 w-1.5 h-1.5 bg-purple-300/60 rounded-full animate-float-particle animate-delay-700"></div>
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-300/60 rounded-full animate-float-particle animate-delay-1000"></div>
              </CardHeader>

              <CardContent className="pt-0 relative z-10 px-2 sm:px-3 md:px-6 pb-4 sm:pb-5 md:pb-6">
                <div className="space-y-2.5 sm:space-y-3">
                  {eventLinks
                    .sort((a, b) => a.order - b.order)
                    .map((link) => {
                      const IconComponent = getIconComponent(link.icon);
                      return (
                        <a
                          key={link.id}
                          href={ensureHttps(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group block p-3.5 sm:p-4 md:p-5 bg-white/75 hover:bg-white/85 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent touch-manipulation`}
                          style={{
                            minHeight: "60px", // Ensure minimum touch target size
                            WebkitTapHighlightColor: "transparent", // Remove mobile tap highlight
                          }}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-purple-100 via-purple-50 to-pink-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <h4 className="font-bold text-gray-900 group-hover:text-gray-800 text-base sm:text-lg md:text-xl leading-tight mb-0.5 truncate">
                                {link.title}
                              </h4>
                              {link.description && (
                                <p
                                  className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed break-words line-clamp-2 overflow-hidden"
                                  style={{
                                    fontSize:
                                      link.description.length > 60
                                        ? "clamp(0.7rem, 2vw, 0.875rem)"
                                        : "clamp(0.75rem, 2.5vw, 1rem)",
                                    lineHeight: "1.4",
                                  }}
                                >
                                  {link.description.length > 100
                                    ? `${link.description.substring(0, 100)}...`
                                    : link.description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 text-white rotate-180 group-hover:translate-x-0.5 transition-transform duration-300" />
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
