"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Upload,
  Users,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      icon: Calendar,
      title: "Event Management",
      description:
        "Create and manage multiple events with ease. Keep track of different occasions and their specific requirements.",
      href: "/events",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Upload,
      title: "Guest Import",
      description:
        "Easily import guest lists from CSV files. Bulk upload and manage all your attendees efficiently.",
      href: "/events",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: Users,
      title: "Table Assignment",
      description:
        "Intelligently assign guests to tables. Create optimal seating arrangements for your events.",
      href: "/assign",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Streamlined workflow gets you from guest list to seating chart in minutes.",
    },
    {
      icon: Shield,
      title: "Reliable",
      description:
        "Built with modern technology to ensure your data is safe and accessible.",
    },
    {
      icon: CheckCircle,
      title: "Easy to Use",
      description:
        "Intuitive interface designed for event planners of all skill levels.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Table Tamer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Table Tamer</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The ultimate solution for event seating management. Create events,
            import guests, and generate perfect table assignments with our
            streamlined platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/signup">
                Get Started <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md"
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 mx-auto rounded-full ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full group-hover:bg-gray-50"
                >
                  <Link href="/auth/signup">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Table Tamer?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Quick Start Guide
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create an Event</h3>
              <p className="text-blue-100">
                Set up your event details and get started
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Import Guests</h3>
              <p className="text-blue-100">
                Upload your guest list from a CSV file
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Assign Tables</h3>
              <p className="text-blue-100">
                Generate optimal seating arrangements
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
            >
              <Link href="/auth/signup">Start Your First Event</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
