import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Table Tamer - Event Seating Management",
  description:
    "Streamlined event seating management platform. Create events, import guests, and generate perfect table assignments.",
  keywords: [
    "event management",
    "seating arrangement",
    "table assignment",
    "wedding planning",
    "event planning",
  ],
  authors: [{ name: "Table Tamer Team" }],
  openGraph: {
    title: "Table Tamer - Event Seating Management",
    description: "Streamlined event seating management platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
