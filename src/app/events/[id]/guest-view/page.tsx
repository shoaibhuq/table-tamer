"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface GuestResult {
  id: string;
  name: string;
  phoneNumber: string | null;
  table: {
    id: string;
    number: number;
  } | null;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
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

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      } else {
        setError(data.error || "Event not found.");
      }
    } catch {
      setError("Failed to load event.");
    } finally {
      setEventLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setError("Please enter your name to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setGuestResult(null);

    try {
      const response = await fetch(
        `/api/find-guest?name=${encodeURIComponent(
          searchName.trim()
        )}&eventId=${eventId}`
      );
      const data = await response.json();

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (eventLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Event Not Found
              </h3>
              <p className="text-gray-500 mb-4">
                The event you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href="/events">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {event.name}
            </h1>
            <p className="text-xl text-gray-600 mb-2">Table Finder</p>
            {event.description && (
              <p className="text-gray-500 max-w-lg mx-auto">
                {event.description}
              </p>
            )}
          </div>

          {/* Search Card */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center justify-center">
                <Search className="w-5 h-5" />
                Find Your Table Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter your full name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? "Searching..." : "Find Table"}
                  </Button>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-center">{error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {searched && guestResult && (
            <Card className="shadow-lg border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-6 h-6" />
                  Table Assignment Found!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Guest Info */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Guest Information
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{guestResult.name}</span>
                      </div>
                      {guestResult.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            {guestResult.phoneNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table Assignment */}
                  {guestResult.table ? (
                    <div className="bg-blue-600 text-white p-6 rounded-lg text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-3" />
                      <h2 className="text-3xl font-bold mb-2">
                        Table {guestResult.table.number}
                      </h2>
                      <p className="text-blue-100">
                        You are assigned to this table
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-6 rounded-lg text-center">
                      <Users className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                      <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        No Table Assigned
                      </h2>
                      <p className="text-gray-500">
                        You have not been assigned to a table yet. Please check
                        back later or contact the organizer.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {searched && !guestResult && !error && (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Guest Not Found
                </h3>
                <p className="text-gray-500 mb-4">
                  We could not find a guest with that name in this event. Please
                  check the spelling or try a different variation of your name.
                </p>
                <p className="text-sm text-gray-400">
                  If you believe this is an error, please contact the event
                  organizer.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!searched && (
            <Card className="shadow-lg bg-gray-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  How to use:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    Enter your full name exactly as it appears on the guest list
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    Click Find Table or press Enter to search
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    Your table assignment will be displayed if found
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
