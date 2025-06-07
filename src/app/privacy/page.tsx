import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  Database,
  Eye,
  Lock,
  Mail,
  Cookie,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy
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
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Our Commitment to Your Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                At Table Tamer, we are committed to protecting your privacy and
                ensuring the security of your personal information. This Privacy
                Policy explains how we collect, use, store, and protect your
                information when you use our event management and table
                assignment service.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Account Information
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Name and email address (required for account creation)
                    </li>
                    <li>Phone number (optional, for SMS notifications)</li>
                    <li>Authentication credentials</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Event & Guest Data
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Event names and descriptions you create</li>
                    <li>Guest names and contact information you upload</li>
                    <li>Table assignments and seating arrangements</li>
                    <li>Dietary restrictions and special requirements</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Usage Information
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>How you interact with our service</li>
                    <li>Features you use most frequently</li>
                    <li>Error logs and performance data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide and maintain the Table Tamer service</li>
                <li>Create and manage your events and guest lists</li>
                <li>Generate table assignments and seating charts</li>
                <li>Send SMS notifications (when requested and authorized)</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Improve our service and develop new features</li>
                <li>Ensure the security and integrity of our service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  <strong>We do not sell your personal information.</strong> We
                  may share your information in the following limited
                  circumstances:
                </p>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Service Providers
                  </h4>
                  <p>
                    We may share information with trusted third-party service
                    providers who help us operate our service, such as:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>
                      Cloud hosting and storage providers (Firebase/Google
                      Cloud)
                    </li>
                    <li>SMS service providers (for notifications)</li>
                    <li>Analytics and monitoring services</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Legal Requirements
                  </h4>
                  <p>
                    We may disclose your information if required by law,
                    regulation, legal process, or governmental request.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Business Transfers
                  </h4>
                  <p>
                    In the event of a merger, acquisition, or sale of assets,
                    your information may be transferred as part of that
                    transaction.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-red-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  We implement appropriate technical and organizational security
                  measures to protect your information, including:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security assessments and updates</li>
                  <li>
                    Limited access to personal information on a need-to-know
                    basis
                  </li>
                  <li>Incident response procedures for security breaches</li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  While we strive to protect your information, no method of
                  transmission over the internet or electronic storage is 100%
                  secure. We cannot guarantee absolute security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>We retain your information for as long as:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Your account remains active</li>
                  <li>Needed to provide you with our services</li>
                  <li>Required by law or for legitimate business purposes</li>
                  <li>
                    Necessary to resolve disputes or enforce our agreements
                  </li>
                </ul>
                <p>
                  When you delete your account, we will delete or anonymize your
                  personal information within a reasonable timeframe, unless we
                  are required to retain it for legal reasons.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Access:</strong> Request information about the
                    personal data we hold about you
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate or incomplete data
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    data
                  </li>
                  <li>
                    <strong>Portability:</strong> Request a copy of your data in
                    a portable format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to certain processing of
                    your data
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request restriction of
                    processing in certain circumstances
                  </li>
                </ul>
                <p>
                  To exercise these rights, please contact us using the
                  information provided below. We will respond to your request
                  within the timeframe required by applicable law.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cookie className="w-5 h-5 mr-2 text-orange-600" />
                Cookies and Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  We use cookies and similar tracking technologies to improve
                  your experience and analyze how our service is used:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Essential Cookies:</strong> Required for basic
                    functionality and security
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand usage
                    patterns and improve our service
                  </li>
                  <li>
                    <strong>Functional Cookies:</strong> Remember your
                    preferences and settings
                  </li>
                </ul>
                <p>
                  You can control cookie settings through your browser
                  preferences. Note that disabling certain cookies may affect
                  the functionality of our service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <p>
                  Our service integrates with third-party services that have
                  their own privacy policies:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Google Firebase:</strong> Authentication, database,
                    and hosting services
                  </li>
                  <li>
                    <strong>SMS Providers:</strong> For sending text message
                    notifications
                  </li>
                  <li>
                    <strong>Authentication Providers:</strong> Google OAuth for
                    sign-in
                  </li>
                </ul>
                <p>
                  We recommend reviewing the privacy policies of these
                  third-party services to understand how they handle your
                  information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Your information may be transferred to and processed in
                countries other than your own. We ensure that such transfers
                comply with applicable data protection laws and implement
                appropriate safeguards to protect your information.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may update this privacy policy from time to time to reflect
                changes in our practices or applicable laws. When we make
                significant changes, we will notify you by updating the
                &quot;Last updated&quot; date and, where appropriate, provide
                additional notice through our service or via email.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
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
                  If you have questions about this privacy policy or how we
                  handle your personal information, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">
                    <strong>Email:</strong> privacy@tabletamer.com
                  </p>
                  <p className="mb-2">
                    <strong>Subject Line:</strong> Privacy Policy Inquiry
                  </p>
                  <p className="text-sm text-gray-600">
                    We aim to respond to all privacy-related inquiries within 30
                    days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">
            Your privacy is important to us. Thank you for trusting Table Tamer
            with your event management needs.
          </p>
          <div className="space-x-4">
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Terms of Service
            </Link>
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
