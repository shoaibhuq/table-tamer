"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, authError } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect once to prevent loops
    if (!loading && !user && !authError && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.push("/auth/login");
    }

    // Reset redirect flag when user becomes available
    if (user) {
      hasRedirectedRef.current = false;
    }
  }, [user, loading, authError, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Firebase/Auth configuration error
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{authError}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Common fixes:</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
                <li>
                  Check if your .env file contains all Firebase configuration
                  variables
                </li>
                <li>
                  Verify Firebase project settings match your environment
                  variables
                </li>
                <li>
                  Ensure Firebase project is properly configured in the console
                </li>
                <li>Restart your development server after making changes</li>
              </ul>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/auth/login")}
                className="flex-1"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no user and haven't redirected yet, show loading while redirect happens
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
