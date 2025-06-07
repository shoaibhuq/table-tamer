import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, FileText, Mail } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Welcome to Table Tamer! By using our event management and table
                assignment service, you agree to these terms of service. Table
                Tamer helps you organize events, manage guest lists, and assign
                table seating arrangements efficiently.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Our Service
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">Table Tamer provides:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Event creation and management tools</li>
                <li>Guest list import and management</li>
                <li>Automated and manual table assignment features</li>
                <li>Guest lookup and table finder functionality</li>
                <li>Table naming and customization options</li>
                <li>SMS notifications (where available)</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Your Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">When using Table Tamer, you agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate information for your events and guests</li>
                <li>
                  Use the service only for legitimate event management purposes
                </li>
                <li>
                  Respect the privacy of your guests and their information
                </li>
                <li>
                  Not upload or share inappropriate, harmful, or illegal content
                </li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data Handling</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  <strong>Data Collection:</strong> We collect only the
                  information necessary to provide our service, including event
                  details, guest names, and contact information you choose to
                  provide.
                </p>
                <p>
                  <strong>Data Usage:</strong> Your data is used solely to
                  deliver the Table Tamer service to you. We do not sell or
                  share your personal information with third parties for
                  marketing purposes.
                </p>
                <p>
                  <strong>Data Security:</strong> We use industry-standard
                  security measures to protect your information, including
                  encrypted storage and secure transmission protocols.
                </p>
                <p>
                  <strong>Data Retention:</strong> We retain your data only as
                  long as necessary to provide our service or as required by
                  law.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                While we strive to maintain high service availability, Table
                Tamer is provided &quot;as is&quot; without guarantees of
                uninterrupted access. We may occasionally perform maintenance or
                updates that temporarily affect service availability.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Table Tamer and its creators are not liable for any indirect,
                incidental, or consequential damages arising from your use of
                the service. Our liability is limited to the maximum extent
                permitted by law.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to These Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may update these terms from time to time. When we do, we will
                update the &quot;Last updated&quot; date at the top of this
                page. Continued use of Table Tamer after changes constitutes
                acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  If you have questions about these terms or our service, please
                  contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">
                    <strong>Email:</strong> support@tabletamer.com
                  </p>
                  <p className="mb-2">
                    <strong>Subject Line:</strong> Terms of Service Inquiry
                  </p>
                  <p className="text-sm text-gray-600">
                    We aim to respond to all inquiries within 48 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Thank you for choosing Table Tamer for your event management needs!
          </p>
          <div className="mt-4">
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
