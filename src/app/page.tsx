"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  //log if we get to this page
  console.log("HomePage");

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Authenticated users go to dashboard
        router.push("/dashboard");
      } else {
        // Unauthenticated users go to landing page
        router.push("/landing");
      }
    }
  }, [user, loading, router]);

  // Show loading while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
