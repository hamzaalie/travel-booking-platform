import { useQuery } from '@tanstack/react-query';
import { agentApi } from '@/services/api';
import { TrendingUp, Info } from 'lucide-react';

export default function AgentMarkupsPage() {
  const { data: markups, isLoading } = useQuery({
    queryKey: ['myMarkups'],
    queryFn: async () => {
      const response: any = await agentApi.getMarkups();
      return response.data;
    },
  });

  const agentSpecificMarkups = markups?.filter((m: any) => !m.isGlobal) || [];
  const globalMarkups = markups?.filter((m: any) => m.isGlobal) || [];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-8">My Markups</h1>

      {/* Info Card */}
      <div className="card bg-accent-50 border-accent-200 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="h-6 w-6 text-primary-950 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-primary-950 mb-1">How Markups Work</h3>
            <p className="text-sm text-primary-950">
              Your agent-specific markup will be applied to all bookings. If no agent-specific markup is set,
              the global markup will apply. Contact your admin to configure custom markups for your agency.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
          <p className="text-gray-600 mt-4">Loading markups...</p>
        </div>
      ) : (
        <>
          {/* Agent-Specific Markups */}
          {agentSpecificMarkups.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Custom Markups</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentSpecificMarkups.map((markup: any) => (
                  <div key={markup.id} className="card border-2 border-primary-300 bg-primary-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-4xl font-bold text-primary-900">
                          {markup.type === 'PERCENTAGE' ? `${markup.value}%` : `$${markup.value}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {markup.type === 'PERCENTAGE' ? 'Percentage Markup' : 'Fixed Amount'}
                        </div>
                      </div>
                      <TrendingUp className="h-10 w-10 text-primary-950" />
                    </div>
                    {markup.description && (
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">{markup.description}</p>
                    )}
                    <div className="mt-3 text-xs text-primary-900 font-medium">
                      ✓ Applied to all your bookings
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card bg-yellow-50 border-yellow-200 mb-8">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="font-semibold text-yellow-900 mb-2">No Custom Markup Configured</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  You don't have an agent-specific markup. The global markup will apply to your bookings.
                </p>
                <p className="text-xs text-yellow-700">
                  Contact your administrator to set up a custom markup for your agency.
                </p>
              </div>
            </div>
          )}

          {/* Global Markups */}
          {globalMarkups.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Global Markups (Default)</h2>
              <p className="text-gray-600 mb-4">
                These markups apply when you don't have a custom markup configured.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalMarkups.map((markup: any) => (
                  <div key={markup.id} className="card border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-700">
                          {markup.type === 'PERCENTAGE' ? `${markup.value}%` : `$${markup.value}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {markup.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        Global
                      </span>
                    </div>
                    {markup.description && (
                      <p className="text-sm text-gray-600">{markup.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Calculation */}
          {(agentSpecificMarkups.length > 0 || globalMarkups.length > 0) && (
            <div className="card bg-gray-50 mt-8">
              <h3 className="font-semibold text-gray-900 mb-3">Markup Calculation Example</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Flight Price:</span>
                  <span className="font-medium">$500.00</span>
                </div>
                {(agentSpecificMarkups[0] || globalMarkups[0]) && (
                  <>
                    <div className="flex justify-between text-primary-900">
                      <span>Your Markup ({(agentSpecificMarkups[0] || globalMarkups[0]).type === 'PERCENTAGE' ? 'Percentage' : 'Fixed'}):</span>
                      <span className="font-medium">
                        {(agentSpecificMarkups[0] || globalMarkups[0]).type === 'PERCENTAGE'
                          ? `+ $${(500 * (agentSpecificMarkups[0] || globalMarkups[0]).value / 100).toFixed(2)}`
                          : `+ $${(agentSpecificMarkups[0] || globalMarkups[0]).value.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-900">Customer Pays:</span>
                      <span className="font-bold text-lg">
                        ${(agentSpecificMarkups[0] || globalMarkups[0]).type === 'PERCENTAGE'
                          ? (500 + (500 * (agentSpecificMarkups[0] || globalMarkups[0]).value / 100)).toFixed(2)
                          : (500 + (agentSpecificMarkups[0] || globalMarkups[0]).value).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
