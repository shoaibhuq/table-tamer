"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </AuthWrapper>
  );
}
