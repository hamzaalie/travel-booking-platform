import { RefreshCcw, Plane, Building, Car, Clock, AlertCircle, HelpCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <RefreshCcw className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-xl text-white/80">
            Understand our cancellation and refund procedures for all booking types.
          </p>
          <p className="text-sm text-white/60 mt-4">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          {/* Important Notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Important Notice</h3>
              <p className="text-amber-700 text-sm">
                Refund policies vary by service provider (airlines, hotels, car rental companies). 
                The policies below are general guidelines. Specific terms will be shown during booking.
              </p>
            </div>
          </div>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Plane className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Flight Bookings</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Cancellation Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Refund Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-gray-600">More than 72 hours before departure</td>
                      <td className="px-4 py-3 text-gray-600">Full refund minus airline cancellation fee</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600">24-72 hours before departure</td>
                      <td className="px-4 py-3 text-gray-600">50% refund (subject to airline policy)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600">Less than 24 hours before departure</td>
                      <td className="px-4 py-3 text-gray-600">No refund (non-refundable)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600">No-show</td>
                      <td className="px-4 py-3 text-gray-600">No refund</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                * Special fare tickets may have different or more restrictive refund policies.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Hotel Bookings</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800">Free Cancellation Bookings</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Cancel before the free cancellation deadline for a full refund. 
                    The deadline is typically 24-48 hours before check-in.
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800">Non-Refundable Bookings</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    These bookings cannot be cancelled or refunded. They are typically 
                    offered at discounted rates.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800">Pay at Property</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Cancellation policies are set by the hotel. Check the specific terms 
                    shown during booking.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Car className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Car Rentals</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Free cancellation up to 24 hours before pickup time</li>
                <li>Late cancellations may incur a one-day rental fee</li>
                <li>No-shows are charged the full rental amount</li>
                <li>Prepaid bookings may have different terms</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Refund Processing Time</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
                <li><strong>Digital Wallets (eSewa, Khalti):</strong> 3-5 business days</li>
                <li><strong>Bank Transfers:</strong> 7-14 business days</li>
                <li><strong>Agent Wallet:</strong> Instant credit to wallet balance</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Processing times may vary depending on your bank or payment provider. 
                We will send you a confirmation email once the refund is processed.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">How to Request a Refund</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                <li>Log in to your account and go to "My Bookings"</li>
                <li>Select the booking you wish to cancel</li>
                <li>Click "Request Cancellation" and follow the prompts</li>
                <li>Review the refund amount and confirm</li>
                <li>You will receive a confirmation email with refund details</li>
              </ol>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Need help?</strong> Contact our support team at 
                  <a href="mailto:support@travelbooking.com" className="text-primary-600 ml-1">
                    support@travelbooking.com
                  </a>
                  {' '}or call +1 (234) 567-890
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
