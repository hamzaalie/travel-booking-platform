import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-950 to-primary-950 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <Shield className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-white/80">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-white/60 mt-4">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-primary-950" />
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                make a booking, or contact our support team. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Passport and travel document details for flight bookings</li>
                <li>Payment information (processed securely through our payment partners)</li>
                <li>Travel preferences and booking history</li>
                <li>Communication records with our customer support</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-primary-950" />
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Process and confirm your travel bookings</li>
                <li>Send booking confirmations, updates, and travel alerts</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Personalize your experience and recommend relevant travel options</li>
                <li>Process payments and prevent fraud</li>
                <li>Comply with legal obligations and regulatory requirements</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary-950" />
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>256-bit SSL encryption for all data transmission</li>
                <li>PCI-DSS compliant payment processing</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Strict access controls and employee training</li>
                <li>Secure data centers with redundant backups</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-6 w-6 text-primary-950" />
              <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access and download your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-primary-950" />
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact our Data Protection Officer at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-medium">Peakpass Travel Privacy Team</p>
                <p className="text-gray-600">Email: privacy@peakpasstravel.com</p>
                <p className="text-gray-600">Address: 123 Travel Street, Suite 100, New York, NY 10001</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
