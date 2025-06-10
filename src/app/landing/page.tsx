"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Upload,
  Users,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Sparkles,
  MessageSquare,
  BarChart3,
  Globe,
  Heart,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Table Tamer...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render landing content (redirect will happen)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Calendar,
      title: "Smart Event Management",
      description:
        "Create stunning events with our intuitive dashboard. Track RSVPs, manage timelines, and coordinate every detail seamlessly.",
      href: "/events",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      stats: "500+ Events Created",
    },
    {
      icon: Upload,
      title: "Instant Guest Import",
      description:
        "Drag, drop, done! Import thousands of guests instantly from CSV, Excel, or any format. Smart duplicate detection included.",
      href: "/events",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      stats: "10K+ Guests Imported",
    },
    {
      icon: Users,
      title: "AI-Powered Seating",
      description:
        "Our intelligent algorithm considers relationships, preferences, and dietary needs to create perfect table arrangements.",
      href: "/assign",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      stats: "99% Satisfaction Rate",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "From guest list to final seating chart in under 5 minutes",
      metric: "5x faster",
      color: "text-yellow-600",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Bank-grade encryption keeps your guest data completely secure",
      metric: "100% secure",
      color: "text-green-600",
    },
    {
      icon: CheckCircle,
      title: "Effortlessly Simple",
      description: "Intuitive design that works perfectly for first-time users",
      metric: "No training needed",
      color: "text-blue-600",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description:
        "Detailed insights help you optimize every aspect of your event",
      metric: "Real-time data",
      color: "text-purple-600",
    },
    {
      icon: MessageSquare,
      title: "Instant Notifications",
      description: "Keep guests informed with automated SMS and email updates",
      metric: "Auto-pilot mode",
      color: "text-pink-600",
    },
    {
      icon: Globe,
      title: "Works Everywhere",
      description: "Cloud-based platform accessible from any device, anywhere",
      metric: "24/7 access",
      color: "text-indigo-600",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Events Planned", icon: Calendar },
    { number: "500,000+", label: "Guests Seated", icon: Users },
    { number: "99.9%", label: "Uptime", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Table Tamer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" className="hover:bg-blue-50">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6 border border-blue-200/50">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              Introducing AI-Powered Seating
            </span>
            <Badge className="ml-2 bg-blue-600 text-white text-xs">NEW</Badge>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Create Perfect
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Table Magic ✨
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Transform event planning with AI-powered seating arrangements.
            <br />
            <span className="font-semibold text-blue-600">
              Import guests, customize tables, and create unforgettable
              experiences
            </span>{" "}
            — all in minutes, not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button
              asChild
              size="lg"
              className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Link href="/auth/signup">
                🚀 Start Planning Free <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Perfect Events
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make event planning effortless and
              enjoyable
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden relative ${feature.bgColor}/50 backdrop-blur-sm hover:scale-105`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>
                <CardHeader className="text-center pb-4 relative z-10">
                  <div
                    className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl`}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="mb-4 bg-white/80 text-gray-600"
                  >
                    {feature.stats}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl shadow-2xl p-12 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Event Planners
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  Love Us
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join thousands of successful event planners who&apos;ve
                transformed their workflow
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group text-center hover:scale-105 transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                  >
                    <benefit.icon className={`w-8 h-8 ${benefit.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 mb-3 leading-relaxed">
                    {benefit.description}
                  </p>
                  <Badge
                    variant="outline"
                    className={`${benefit.color} border-current`}
                  >
                    {benefit.metric}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl text-white p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center bg-white/20 rounded-full px-6 py-2 mb-6 backdrop-blur-sm">
              <Heart className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Join 10,000+ Happy Event Planners
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ready to Create
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Event Magic? ✨
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Easy planning means easy seating.
              <br />
              <span className="font-semibold">
                Transform your events in just 5 minutes.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-4 bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Link href="/auth/signup">
                  🎉 Start Now for Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Table Tamer</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The most beautiful and intelligent event seating platform on the
                planet.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/auth/signup"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="hover:text-white transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:support@tabletamer.com"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/auth/signup">Try Free Now</Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Table Tamer. Made with ❤️ for
              event planners worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
