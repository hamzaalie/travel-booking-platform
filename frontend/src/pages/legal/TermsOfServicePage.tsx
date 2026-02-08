import { FileText, Check, AlertTriangle, Scale, Users, Ban } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-white/80">
            Please read these terms carefully before using our services.
          </p>
          <p className="text-sm text-white/60 mt-4">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Check className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Acceptance of Terms</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                By accessing or using TravelBooking's services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, 
                you are prohibited from using or accessing our services.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Booking Terms</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">When making bookings through our platform:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All bookings are subject to availability and confirmation</li>
                <li>Prices are subject to change until booking is confirmed</li>
                <li>You must ensure all passenger information is accurate and matches travel documents</li>
                <li>Airline and hotel terms and conditions apply in addition to our terms</li>
                <li>Cancellation and refund policies vary by booking type and provider</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Payment Terms</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All prices are displayed in the selected currency</li>
                <li>Payment is required at the time of booking unless otherwise specified</li>
                <li>We accept major credit cards, debit cards, and digital wallets</li>
                <li>B2B agents may use wallet balance for bookings</li>
                <li>Currency conversion rates are determined at the time of transaction</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Ban className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Prohibited Activities</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Transmit malware or other harmful code</li>
                <li>Make bookings with fraudulent payment methods</li>
                <li>Resell or commercially exploit our services without authorization</li>
                <li>Interfere with or disrupt the integrity of our platform</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                TravelBooking acts as an intermediary between you and travel service providers. 
                We are not liable for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Flight delays, cancellations, or schedule changes by airlines</li>
                <li>Quality of accommodations or services provided by hotels</li>
                <li>Personal injury or property damage during travel</li>
                <li>Force majeure events including natural disasters, pandemics, or political unrest</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Our total liability shall not exceed the amount paid for the booking in question.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
