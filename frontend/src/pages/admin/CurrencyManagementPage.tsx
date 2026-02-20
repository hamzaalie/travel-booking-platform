// --- MULTI-CURRENCY MODEL REMOVED ---
// This page was used for managing multiple currencies and exchange rates.
// Only NPR (Nepalese Rupee) is now supported as the default and only currency.

import { Coins, Globe } from 'lucide-react';

export default function CurrencyManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Currency Settings</h1>
        <p className="text-gray-600 mt-1">System currency configuration</p>
      </div>

      {/* Info Card */}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Globe className="h-6 w-6 text-primary-950 mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary-950 text-lg">Single Currency Mode</h3>
            <p className="text-sm text-primary-900 mt-2">
              The system is configured to use <strong>NPR (Nepalese Rupee)</strong> as the only currency.
              Multi-currency support has been disabled. All prices, bookings, and transactions
              are processed in NPR.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-8">
          <Coins className="h-16 w-16 mx-auto mb-4 text-primary-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Default Currency: NPR</h2>
          <p className="text-gray-600 mb-1">Nepalese Rupee</p>
          <p className="text-sm text-gray-500">Symbol: NPR | Code: NPR | Decimal Places: 2</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active and Default
          </div>
        </div>
      </div>
    </div>
  );
}
