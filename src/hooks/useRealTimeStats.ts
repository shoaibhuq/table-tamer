import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalEvents: number;
  totalGuests: number;
  totalTables: number;
  weeklyChange: {
    events: number;
    guests: number;
    tables: number;
  };
}

interface Activity {
  id: string;
  type:
    | "event_created"
    | "event_deleted"
    | "event_updated"
    | "guests_imported"
    | "tables_assigned"
    | "event_completed"
    | "table_created"
    | "tables_created"
    | "guest_added"
    | "guest_deleted"
    | "table_deleted"
    | "tables_deleted"
    | "profile_updated"
    | "theme_changed"
    | "appearance_customized"
    | "appearance_reset";
  title: string;
  description: string;
  eventId?: string;
  eventName?: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

export function useRealTimeStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalGuests: 0,
    totalTables: 0,
    weeklyChange: { events: 0, guests: 0, tables: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to events in real-time
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeEvents = onSnapshot(
        eventsQuery,
        (eventsSnapshot) => {
          const totalEvents = eventsSnapshot.docs.length;

          // Calculate weekly changes
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const recentEvents = eventsSnapshot.docs.filter((doc) => {
            const data = doc.data();
            return data.createdAt && data.createdAt.toDate() > weekAgo;
          });

          setStats((prev) => ({
            ...prev,
            totalEvents,
            weeklyChange: {
              ...prev.weeklyChange,
              events: recentEvents.length,
            },
          }));
        },
        (err) => {
          console.error("Events listener error:", err);
          setError("Failed to load events");
        }
      );

      // Listen to guests in real-time
      const guestsQuery = query(
        collection(db, "guests"),
        where("userId", "==", user.uid)
      );

      const unsubscribeGuests = onSnapshot(
        guestsQuery,
        (guestsSnapshot) => {
          const totalGuests = guestsSnapshot.docs.length;

          // Calculate weekly changes
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const recentGuests = guestsSnapshot.docs.filter((doc) => {
            const data = doc.data();
            return data.createdAt && data.createdAt.toDate() > weekAgo;
          });

          setStats((prev) => ({
            ...prev,
            totalGuests,
            weeklyChange: {
              ...prev.weeklyChange,
              guests: recentGuests.length,
            },
          }));
        },
        (err) => {
          console.error("Guests listener error:", err);
          setError("Failed to load guests");
        }
      );

      // Listen to tables in real-time
      const tablesQuery = query(
        collection(db, "tables"),
        where("userId", "==", user.uid)
      );

      const unsubscribeTables = onSnapshot(
        tablesQuery,
        (tablesSnapshot) => {
          const totalTables = tablesSnapshot.docs.length;

          // Calculate weekly changes
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const recentTables = tablesSnapshot.docs.filter((doc) => {
            const data = doc.data();
            return data.createdAt && data.createdAt.toDate() > weekAgo;
          });

          setStats((prev) => ({
            ...prev,
            totalTables,
            weeklyChange: {
              ...prev.weeklyChange,
              tables: recentTables.length,
            },
          }));

          setLoading(false);
        },
        (err) => {
          console.error("Tables listener error:", err);
          setError("Failed to load tables");
          setLoading(false);
        }
      );

      // Listen to activity log
      const activityQuery = query(
        collection(db, "activity"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const unsubscribeActivity = onSnapshot(
        activityQuery,
        (activitySnapshot) => {
          const activities = activitySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Activity[];

          setRecentActivity(activities);
        },
        (err) => {
          console.error("Activity listener error:", err);
          // Don't set error for activity as it's secondary
        }
      );

      unsubscribers.push(
        unsubscribeEvents,
        unsubscribeGuests,
        unsubscribeTables,
        unsubscribeActivity
      );
    } catch (err) {
      console.error("Setup error:", err);
      setError("Failed to initialize real-time updates");
      setLoading(false);
    }

    // Cleanup function
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user?.uid]);

  return { stats, recentActivity, loading, error };
}
