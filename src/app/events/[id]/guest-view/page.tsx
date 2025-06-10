"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Users,
  MapPin,
  Phone,
  CheckCircle,
  PartyPopper,
} from "lucide-react";
import { getThemeById, getThemeClasses } from "@/lib/themes";
import { ThemedBackground } from "@/components/ui/themed-background";

interface GuestResult {
  id: string;
  name: string;
  phoneNumber: string | null;
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

interface SuggestionsResponse {
  success: boolean;
  suggestions?: string[];
  error?: string;
}

export default function EventGuestViewPage() {
  const params = useParams();
  const eventId = params.id as string;
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [event, setEvent] = useState<Event | null>(null);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestResult, setGuestResult] = useState<GuestResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

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

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/public/find-guest?eventId=${eventId}&name=${encodeURIComponent(
          query
        )}&autocomplete=true`
      );
      const data: SuggestionsResponse = await response.json();

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(data.suggestions.length > 0);
        setSelectedSuggestionIndex(-1); // Reset selection
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const searchGuest = async () => {
    if (!searchName.trim()) {
      setError("Please enter a name to search");
      return;
    }

    setLoading(true);
    setError(null);
    setGuestResult(null);
    setSearched(true);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `/api/public/find-guest?eventId=${eventId}&name=${encodeURIComponent(
          searchName.trim()
        )}`
      );
      const data: GuestResponse = await response.json();

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

  const handleInputChange = (value: string) => {
    setSearchName(value);

    // Clear existing timeout
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    // Debounce the suggestions fetch
    suggestionsTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchName(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    // Auto-search when suggestion is clicked
    setTimeout(() => {
      searchGuest();
    }, 100);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && searchName.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  useEffect(() => {
    fetchEvent();
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, [eventId, fetchEvent]);

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              {/* Header skeleton */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/50 rounded-full mx-auto"></div>
                <div className="h-12 bg-white/50 rounded-lg w-3/4 mx-auto"></div>
                <div className="h-1 w-24 bg-white/30 rounded-full mx-auto"></div>
                <div className="h-4 bg-white/30 rounded w-1/2 mx-auto"></div>
              </div>

              {/* Search card skeleton */}
              <div className="bg-white/40 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-white/50 rounded-xl mx-auto"></div>
                  <div className="h-8 bg-white/50 rounded w-1/2 mx-auto"></div>
                  <div className="h-5 bg-white/30 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-16 bg-white/50 rounded-2xl"></div>
                  <div className="h-16 bg-white/50 rounded-2xl"></div>
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

      <div className="relative container mx-auto p-6 max-w-2xl">
        <div className={`mb-12 ${themeClasses.entrance}`}>
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 ${themeClasses.accentGradient} rounded-full animate-spin-slow blur-md opacity-75`}
              ></div>
              <div
                className={`relative inline-flex items-center justify-center w-20 h-20 ${themeClasses.primaryGradient} rounded-full shadow-2xl`}
              >
                <PartyPopper className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <h1
                className={`text-5xl md:text-6xl font-black ${themeClasses.secondaryGradient} bg-clip-text text-transparent drop-shadow-lg animate-shimmer`}
              >
                {event?.name || "Event Guest Finder"}
              </h1>

              <div
                className={`h-1 w-24 ${themeClasses.accentGradient} mx-auto rounded-full`}
              ></div>

              {event?.description && (
                <p
                  className={`${themeClasses.textSecondaryColor} text-xl max-w-lg mx-auto leading-relaxed mt-4 font-light`}
                >
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search Card */}
        <Card
          className={`mb-8 shadow-2xl border-0 ${themeClasses.cardBackground} relative overflow-hidden`}
        >
          <div
            className={`absolute inset-0 ${themeClasses.secondaryGradient} opacity-20`}
          ></div>
          <div
            className={`absolute top-0 left-0 w-full h-1 ${themeClasses.primaryGradient}`}
          ></div>

          <CardHeader className="text-center pb-2 relative z-10">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 ${themeClasses.secondaryGradient} rounded-xl mb-3`}
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
              className={`text-3xl font-bold ${themeClasses.primaryGradient} bg-clip-text text-transparent`}
            >
              Find Your Table
            </CardTitle>
            <p className="text-gray-600 mt-2 text-lg font-medium">
              ✨ Enter your name to discover your table assignment
            </p>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="space-y-6">
              <div className="relative z-[100]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Start typing your full name..."
                    value={searchName}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (
                          showSuggestions &&
                          selectedSuggestionIndex >= 0 &&
                          suggestions[selectedSuggestionIndex]
                        ) {
                          handleSuggestionClick(
                            suggestions[selectedSuggestionIndex]
                          );
                        } else {
                          searchGuest();
                        }
                      }
                      if (e.key === "Escape") {
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        if (showSuggestions) {
                          setSelectedSuggestionIndex((prev) =>
                            prev < suggestions.length - 1 ? prev + 1 : 0
                          );
                        }
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        if (showSuggestions) {
                          setSelectedSuggestionIndex((prev) =>
                            prev > 0 ? prev - 1 : suggestions.length - 1
                          );
                        }
                      }
                    }}
                    className="w-full h-16 text-lg border-2 border-gray-200 focus:border-gradient-to-r focus:from-purple-400 focus:to-pink-400 rounded-2xl pl-12 pr-4 transition-all duration-300 bg-white/95 shadow-inner focus:shadow-lg font-medium placeholder:text-gray-400"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {/* Enhanced Autocomplete suggestions - Reliable positioning */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    className="absolute z-[9999] w-full mt-3 bg-white/98 backdrop-blur-xl border border-purple-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
                    style={{
                      zIndex: 9999,
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "50vh",
                    }}
                  >
                    <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
                      <div className="p-1">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className={`w-full px-4 py-4 text-left focus:outline-none transition-all duration-200 rounded-xl border group ${
                              selectedSuggestionIndex === index
                                ? "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300"
                                : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-pink-50 border-transparent hover:border-purple-200"
                            }`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                            onMouseEnter={() =>
                              setSelectedSuggestionIndex(index)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                <Users className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors duration-200">
                                {suggestion}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Scroll indicator */}
                    {suggestions.length > 5 && (
                      <div className="px-4 py-2 text-xs text-purple-600 bg-purple-50/80 border-t border-purple-100 text-center">
                        ↕ Scroll to see more results ({suggestions.length}{" "}
                        total)
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={searchGuest}
                disabled={loading || !searchName.trim()}
                className={`w-full h-16 text-xl font-bold ${themeClasses.primaryGradient} hover:opacity-90 text-white rounded-2xl shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform ${themeClasses.hover} active:scale-95 relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {loading ? (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white"></div>
                    <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                      Searching for you...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <Search className="h-6 w-6 animate-pulse" />
                    <span className="font-black tracking-wide">
                      Find My Table
                    </span>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-700">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Search className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Oops!</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Success State */}
        {guestResult && (
          <Card className="border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-teal-400/10"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>

            <CardHeader className="text-center pb-6 relative z-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse blur-lg opacity-50"></div>
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full mx-auto mb-6 shadow-2xl">
                  <CheckCircle className="h-10 w-10 text-white animate-bounce" />
                </div>
              </div>

              <div className="space-y-3">
                <CardTitle className="text-4xl font-black bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                  Welcome, {guestResult.name}!
                </CardTitle>
                <div className="text-6xl">🎉</div>
                <p className="text-green-700 text-xl font-semibold bg-white/60 rounded-full px-6 py-2 inline-block">
                  ✨ We found your table assignment ✨
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Guest Name
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {guestResult.name}
                    </p>
                  </div>
                </div>

                {guestResult.phoneNumber && (
                  <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Phone Number
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {guestResult.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-white/80 to-blue-50/80 rounded-xl border-2 border-blue-100">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Table Assignment
                    </span>
                    {guestResult.table ? (
                      <div className="flex items-center gap-3 mt-1">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{
                            backgroundColor: guestResult.table.color,
                          }}
                        ></div>
                        <span className="text-2xl font-bold text-gray-900">
                          {guestResult.table.name}
                        </span>
                      </div>
                    ) : (
                      <p className="text-lg text-gray-500 italic mt-1">
                        Table assignment coming soon...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {guestResult.table && (
                <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
                  <p className="text-lg font-semibold">
                    🎉 You&apos;re all set!
                  </p>
                  <p className="text-blue-100 mt-1">
                    Look for your table when you arrive
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Not Found State */}
        {searched && !guestResult && !error && !loading && (
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                Guest Not Found
              </h3>
              <p className="text-yellow-700 mb-4">
                We couldn&apos;t find a guest with that name. Please check the
                spelling and try again.
              </p>
              <p className="text-sm text-yellow-600">
                💡 Try using your full name as it appears on the invitation
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {!searched && (
          <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ✨ How it works
              </h3>
              <div className="grid gap-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <p className="text-gray-600">
                    Start typing your name to see suggestions
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p className="text-gray-600">
                    Select your name or press Enter to search
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p className="text-gray-600">
                    Find your table assignment instantly!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
