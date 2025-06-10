"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Search,
  Users,
  MapPin,
  Phone,
  CheckCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface GuestResult {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string | null;
  email?: string | null;
  table: {
    id: string;
    number: number;
  } | null;
}

interface SuggestionsResponse {
  success: boolean;
  suggestions?: string[];
  error?: string;
}

export default function GuestViewPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestResult, setGuestResult] = useState<GuestResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Animate welcome message
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Note: This would need an eventId in a real implementation
      // For now, we'll use a mock API call that would need to be implemented
      const response = await fetch(
        `/api/public/find-guest?eventId=default&name=${encodeURIComponent(
          query
        )}&autocomplete=true`
      );
      const data: SuggestionsResponse = await response.json();

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(data.suggestions.length > 0);
        setSelectedSuggestionIndex(-1);
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
  }, []);

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setError("Please enter your name to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setGuestResult(null);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `/api/find-guest?name=${encodeURIComponent(searchName.trim())}`
      );
      const data = await response.json();

      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (data.success) {
        setGuestResult(data.guest);
        setSearched(true);
      } else {
        setError(data.error || "Guest not found.");
        setSearched(true);
      }
    } catch {
      setError("An error occurred while searching.");
      setSearched(true);
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
      handleSearch();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (
        showSuggestions &&
        selectedSuggestionIndex >= 0 &&
        suggestions[selectedSuggestionIndex]
      ) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
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
  };

  const handleNewSearch = () => {
    setSearched(false);
    setGuestResult(null);
    setError(null);
    setSearchName("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-2xl mx-auto px-4 relative z-10">
          {/* Animated Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Find Your Table
              </h1>
              <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 animate-fade-in-delay">
              ✨ Enter your name to discover your table assignment
            </p>

            {/* Welcome Message */}
            {showWelcome && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200 animate-bounce-in">
                <p className="text-purple-700 font-medium">
                  ✨ Welcome! Start typing to see suggestions ✨
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Search Card */}
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 animate-scale-in">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-center justify-center">
                <Search className="w-5 h-5 animate-pulse" />
                Search for Your Table
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative z-[100]">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Start typing your full name..."
                        value={searchName}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyPress}
                        className="w-full border-2 border-gray-200 focus:border-purple-400 transition-all duration-300 rounded-lg text-lg py-3"
                        disabled={loading}
                      />

                      {/* Enhanced Autocomplete suggestions - High z-index for top positioning */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div
                          className="absolute z-[9999] w-full mt-2 bg-white/98 backdrop-blur-xl border border-purple-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
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
                                      ? "bg-gradient-to-r from-purple-100 to-blue-100 border-purple-300"
                                      : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-blue-50 border-transparent hover:border-purple-200"
                                  }`}
                                  onClick={() =>
                                    handleSuggestionClick(suggestion)
                                  }
                                  onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                                  onMouseEnter={() =>
                                    setSelectedSuggestionIndex(index)
                                  }
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
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
                      onClick={handleSearch}
                      disabled={loading || !searchName.trim()}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 px-6 py-3 text-lg font-semibold rounded-lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Searching...
                        </div>
                      ) : (
                        "Find Table"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 animate-pulse">
                          Searching our guest list...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg animate-shake">
                    <div className="flex items-center gap-2 justify-center">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-600 font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Results */}
          {searched && guestResult && !loading && (
            <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 animate-bounce-in-success">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-center justify-center">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                  Table Assignment Found!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Guest Info */}
                  <div className="bg-white p-6 rounded-xl border-2 border-green-100 shadow-lg animate-slide-in-left">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">
                      Guest Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 animate-fade-in-delay">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-lg">
                          {guestResult.firstName && guestResult.lastName
                            ? `${guestResult.firstName} ${guestResult.lastName}`
                            : guestResult.name}
                        </span>
                      </div>
                      {guestResult.phoneNumber && (
                        <div className="flex items-center gap-3 animate-fade-in-delay-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-gray-600 text-lg">
                            {guestResult.phoneNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table Assignment */}
                  {guestResult.table ? (
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 rounded-xl text-center shadow-xl transform hover:scale-105 transition-all duration-300 animate-slide-in-right">
                      <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                      <h2 className="text-4xl font-bold mb-3 animate-pulse">
                        Table {guestResult.table.number}
                      </h2>
                      <p className="text-blue-100 text-lg">
                        🎉 You are assigned to this table! 🎉
                      </p>
                      <div className="mt-4 inline-block px-6 py-2 bg-white/20 rounded-full">
                        <span className="text-sm font-medium">
                          Your seat awaits!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-xl text-center shadow-lg animate-slide-in-right">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                      <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                        No Table Assigned Yet
                      </h2>
                      <p className="text-gray-500 text-lg mb-4">
                        You have not been assigned to a table yet. Please check
                        back later or contact the organizer.
                      </p>
                      <div className="inline-block px-6 py-2 bg-blue-100 text-blue-700 rounded-full">
                        <span className="text-sm font-medium">
                          Check back soon!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* New Search Button */}
                  <div className="text-center pt-4">
                    <Button
                      onClick={handleNewSearch}
                      variant="outline"
                      className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
                    >
                      Search for Another Guest
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Found State */}
          {searched && !guestResult && !error && !loading && (
            <Card className="shadow-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 animate-shake">
              <CardContent className="p-8 text-center">
                <div className="animate-bounce-in">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">
                    Guest Not Found
                  </h3>
                  <p className="text-gray-500 mb-6 text-lg">
                    We could not find a guest with that name. Please check the
                    spelling or try a different variation of your name.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400 bg-white p-3 rounded-lg">
                      💡 Tip: Try using your full name or check for typos
                    </p>
                    <Button
                      onClick={handleNewSearch}
                      className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-semibold transform hover:scale-105 transition-all duration-300"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Instructions */}
          {!searched && !loading && (
            <Card className="shadow-xl bg-gradient-to-br from-gray-50 to-blue-50 border-0 animate-fade-in-up-delay">
              <CardContent className="p-8">
                <h3 className="font-bold text-gray-900 mb-6 text-xl text-center">
                  ✨ How it works
                </h3>
                <div className="grid gap-4">
                  {[
                    {
                      step: "1",
                      text: "Start typing your name to see suggestions",
                      icon: "✍️",
                    },
                    {
                      step: "2",
                      text: "Select your name or press Enter to search",
                      icon: "🔍",
                    },
                    {
                      step: "3",
                      text: "Find your table assignment instantly!",
                      icon: "🎯",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border-l-4 border-purple-400 animate-slide-in-left`}
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-gray-700 font-medium">
                          {item.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.95);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes bounce-in-success {
            0% {
              opacity: 0;
              transform: translateY(-50px) scale(0.8);
            }
            60% {
              opacity: 1;
              transform: translateY(10px) scale(1.05);
            }
            80% {
              transform: translateY(-5px) scale(0.98);
            }
            100% {
              transform: translateY(0) scale(1);
            }
          }

          @keyframes slide-in-left {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slide-in-right {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes shake {
            0%,
            100% {
              transform: translateX(0);
            }
            10%,
            30%,
            50%,
            70%,
            90% {
              transform: translateX(-5px);
            }
            20%,
            40%,
            60%,
            80% {
              transform: translateX(5px);
            }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
          }
          .animate-fade-in-delay {
            animation: fade-in-up 0.8s ease-out 0.2s both;
          }
          .animate-fade-in-delay-2 {
            animation: fade-in-up 0.8s ease-out 0.4s both;
          }
          .animate-fade-in-up-delay {
            animation: fade-in-up 0.8s ease-out 0.3s both;
          }
          .animate-fade-in-up-delay-3 {
            animation: fade-in-up 0.8s ease-out 0.6s both;
          }
          .animate-scale-in {
            animation: scale-in 0.6s ease-out;
          }
          .animate-bounce-in {
            animation: bounce-in 0.8s ease-out;
          }
          .animate-bounce-in-success {
            animation: bounce-in-success 1s ease-out;
          }
          .animate-slide-in-left {
            animation: slide-in-left 0.6s ease-out;
          }
          .animate-slide-in-right {
            animation: slide-in-right 0.6s ease-out;
          }
          .animate-shake {
            animation: shake 0.6s ease-in-out;
          }
          .animate-fade-in {
            animation: fade-in-up 0.4s ease-out;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
