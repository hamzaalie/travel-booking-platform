import { Cookie, Settings, BarChart, Shield, ToggleLeft, Info } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <Cookie className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl text-white/80">
            Learn how we use cookies to enhance your browsing experience.
          </p>
          <p className="text-sm text-white/60 mt-4">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">What Are Cookies?</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                keeping you signed in, and understanding how you use our platform.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Types of Cookies We Use</h2>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Essential Cookies</h3>
                <p className="text-gray-600 text-sm">
                  These cookies are necessary for the website to function properly. They enable core 
                  functionalities like security, network management, and account authentication. 
                  You cannot opt out of these cookies.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Functional Cookies</h3>
                <p className="text-gray-600 text-sm">
                  These cookies allow us to remember your preferences and provide enhanced features. 
                  This includes your language preference, currency selection, and recent searches.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">Analytics Cookies</h3>
                <p className="text-gray-600 text-sm">
                  We use analytics cookies to understand how visitors interact with our website. 
                  This helps us improve our services and user experience. All data is anonymized.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">Marketing Cookies</h3>
                <p className="text-gray-600 text-sm">
                  These cookies are used to track visitors across websites and display relevant 
                  advertisements. You can opt out of these cookies without affecting your 
                  ability to use our services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <BarChart className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Third-Party Cookies</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We may use third-party services that set their own cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Google Analytics:</strong> For understanding website traffic and user behavior</li>
                <li><strong>Stripe/PayPal:</strong> For secure payment processing</li>
                <li><strong>Intercom:</strong> For customer support chat functionality</li>
                <li><strong>Facebook Pixel:</strong> For advertising and remarketing (optional)</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <ToggleLeft className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Managing Your Cookie Preferences</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use our cookie consent banner to customize your preferences</li>
                <li>Adjust your browser settings to block or delete cookies</li>
                <li>Use browser extensions that block tracking cookies</li>
                <li>Opt out of Google Analytics using their browser add-on</li>
              </ul>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Blocking certain cookies may impact your experience 
                  on our website and limit the functionality of some features.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                Under GDPR and other privacy regulations, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Know what data we collect through cookies</li>
                <li>Opt out of non-essential cookies at any time</li>
                <li>Request deletion of data collected through cookies</li>
                <li>Access information about our cookie practices</li>
              </ul>
              <p className="text-gray-600 mt-4">
                For questions about our cookie practices, contact us at privacy@travelbooking.com
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
