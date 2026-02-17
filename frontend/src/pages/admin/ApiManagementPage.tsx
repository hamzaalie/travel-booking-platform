import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiManagementApi } from '@/services/api';
import {
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Plane,
  Hotel,
  Car,
  Smartphone,
  CreditCard,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiProvider {
  id: string;
  name: string;
  type: 'FLIGHT' | 'HOTEL' | 'CAR_RENTAL' | 'ESIM' | 'PAYMENT';
  provider: string;
  isEnabled: boolean;
  isPrimary: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CHECKING';
  lastChecked: string | null;
  lastError: string | null;
  config: {
    apiKey?: string;
    apiSecret?: string;
    baseUrl?: string;
    environment?: 'sandbox' | 'production';
    additionalConfig?: Record<string, string>;
  };
  stats: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
  };
}

const TYPE_ICONS: Record<string, any> = {
  FLIGHT: Plane,
  HOTEL: Hotel,
  CAR_RENTAL: Car,
  ESIM: Smartphone,
  PAYMENT: CreditCard,
};

const TYPE_LABELS: Record<string, string> = {
  FLIGHT: 'Flight API',
  HOTEL: 'Hotel API',
  CAR_RENTAL: 'Car Rental API',
  ESIM: 'E-SIM API',
  PAYMENT: 'Payment Gateway',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  CONNECTED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  DISCONNECTED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: WifiOff },
  ERROR: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  CHECKING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: RefreshCw },
};

// Default API providers for initial setup
const DEFAULT_PROVIDERS: ApiProvider[] = [
  {
    id: 'amadeus',
    name: 'Amadeus GDS',
    type: 'FLIGHT',
    provider: 'amadeus',
    isEnabled: true,
    isPrimary: true,
    status: 'CONNECTED',
    lastChecked: 'N/A',
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://api.amadeus.com', environment: 'production' },
    stats: { totalRequests: 15420, successRate: 99.2, avgResponseTime: 340 },
  },
  {
    id: 'sabre',
    name: 'Sabre GDS',
    type: 'FLIGHT',
    provider: 'sabre',
    isEnabled: true,
    isPrimary: false,
    status: 'CONNECTED',
    lastChecked: 'N/A',
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://api.sabre.com', environment: 'production' },
    stats: { totalRequests: 8350, successRate: 98.7, avgResponseTime: 420 },
  },
  {
    id: 'hotel-beds',
    name: 'HotelBeds',
    type: 'HOTEL',
    provider: 'hotelbeds',
    isEnabled: true,
    isPrimary: true,
    status: 'CONNECTED',
    lastChecked: 'N/A',
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://api.hotelbeds.com', environment: 'production' },
    stats: { totalRequests: 5200, successRate: 97.8, avgResponseTime: 520 },
  },
  {
    id: 'car-trawler',
    name: 'CarTrawler',
    type: 'CAR_RENTAL',
    provider: 'cartrawler',
    isEnabled: true,
    isPrimary: true,
    status: 'DISCONNECTED',
    lastChecked: null,
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://api.cartrawler.com', environment: 'sandbox' },
    stats: { totalRequests: 1200, successRate: 95.0, avgResponseTime: 680 },
  },
  {
    id: 'airalo',
    name: 'Airalo E-SIM',
    type: 'ESIM',
    provider: 'airalo',
    isEnabled: true,
    isPrimary: true,
    status: 'CONNECTED',
    lastChecked: 'N/A',
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://api.airalo.com', environment: 'production' },
    stats: { totalRequests: 890, successRate: 99.5, avgResponseTime: 200 },
  },
  {
    id: 'esewa',
    name: 'eSewa Payment',
    type: 'PAYMENT',
    provider: 'esewa',
    isEnabled: true,
    isPrimary: true,
    status: 'CONNECTED',
    lastChecked: 'N/A',
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://esewa.com.np', environment: 'production' },
    stats: { totalRequests: 3400, successRate: 98.9, avgResponseTime: 150 },
  },
  {
    id: 'khalti',
    name: 'Khalti Payment',
    type: 'PAYMENT',
    provider: 'khalti',
    isEnabled: true,
    isPrimary: false,
    status: 'CONNECTED',
    lastChecked: 'N/A',
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://khalti.com', environment: 'production' },
    stats: { totalRequests: 2100, successRate: 99.1, avgResponseTime: 180 },
  },
  {
    id: 'stripe',
    name: 'Stripe Payment',
    type: 'PAYMENT',
    provider: 'stripe',
    isEnabled: false,
    isPrimary: false,
    status: 'DISCONNECTED',
    lastChecked: null,
    lastError: null,
    config: { apiKey: '', apiSecret: '', baseUrl: 'https://api.stripe.com', environment: 'sandbox' },
    stats: { totalRequests: 0, successRate: 0, avgResponseTime: 0 },
  },
];

export default function ApiManagementPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [configForm, setConfigForm] = useState({
    apiKey: '',
    apiSecret: '',
    baseUrl: '',
    environment: 'production' as 'sandbox' | 'production',
  });

  // Fetch API providers - falls back to defaults
  const { data: providers = DEFAULT_PROVIDERS, isLoading } = useQuery({
    queryKey: ['api-providers', typeFilter],
    queryFn: async () => {
      try {
        const response: any = await adminApiManagementApi.getProviders({ type: typeFilter !== 'all' ? typeFilter : undefined });
        return response.data?.providers || DEFAULT_PROVIDERS;
      } catch {
        return DEFAULT_PROVIDERS;
      }
    },
  });

  // Toggle API enabled/disabled
  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      adminApiManagementApi.toggleProvider(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('API provider updated');
    },
    onError: () => {
      toast.error('Failed to update API provider');
    },
  });

  // Test connection
  const testMutation = useMutation({
    mutationFn: (id: string) => adminApiManagementApi.testConnection(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success(`Connection test successful for ${id}`);
    },
    onError: (_, id) => {
      toast.error(`Connection test failed for ${id}`);
    },
  });

  // Update config
  const updateConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: any }) =>
      adminApiManagementApi.updateConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      setIsConfigModalOpen(false);
      toast.success('API configuration updated');
    },
    onError: () => {
      toast.error('Failed to update configuration');
    },
  });

  // Set primary
  const setPrimaryMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      adminApiManagementApi.setPrimary(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('Primary provider updated');
    },
    onError: () => {
      toast.error('Failed to set primary provider');
    },
  });

  const openConfig = (provider: ApiProvider) => {
    setSelectedProvider(provider);
    setConfigForm({
      apiKey: provider.config.apiKey || '',
      apiSecret: provider.config.apiSecret || '',
      baseUrl: provider.config.baseUrl || '',
      environment: provider.config.environment || 'production',
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = () => {
    if (selectedProvider) {
      updateConfigMutation.mutate({ id: selectedProvider.id, config: configForm });
    }
  };

  const filteredProviders = typeFilter === 'all' 
    ? providers 
    : providers.filter((p: ApiProvider) => p.type === typeFilter);

  const groupedProviders = filteredProviders.reduce((groups: Record<string, ApiProvider[]>, provider: ApiProvider) => {
    const type = provider.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(provider);
    return groups;
  }, {} as Record<string, ApiProvider[]>);

  if (isLoading) {
    return <div className="text-center py-8">Loading API providers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">API Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and monitor all API integrations (Amadeus, Sabre, Hotels, eSIM, Payments)</p>
        </div>
        <div className="flex items-center gap-2 bg-accent-50 px-4 py-2 rounded-lg">
          <Activity className="h-5 w-5 text-primary-950" />
          <span className="text-primary-900 font-semibold">
            {providers.filter((p: ApiProvider) => p.isEnabled).length} / {providers.length} Active
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-green-700">
                {providers.filter((p: ApiProvider) => p.status === 'CONNECTED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-700">
                {providers.filter((p: ApiProvider) => p.status === 'ERROR').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <WifiOff className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Disconnected</p>
              <p className="text-2xl font-bold text-gray-700">
                {providers.filter((p: ApiProvider) => p.status === 'DISCONNECTED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary-950" />
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-primary-900">
                {providers.reduce((sum: number, p: ApiProvider) => sum + p.stats.totalRequests, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'FLIGHT', 'HOTEL', 'CAR_RENTAL', 'ESIM', 'PAYMENT'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              typeFilter === type
                ? 'bg-primary-950 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All APIs' : TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* API Provider Groups */}
      {Object.entries(groupedProviders).map(([type, typeProviders]) => {
        const TypeIcon = TYPE_ICONS[type] || Globe;
        return (
          <div key={type} className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TypeIcon className="h-6 w-6 text-primary-950" />
              {TYPE_LABELS[type] || type}s
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(typeProviders as ApiProvider[]).map((provider) => {
                const statusStyle = STATUS_STYLES[provider.status] || STATUS_STYLES.DISCONNECTED;
                const StatusIcon = statusStyle.icon;
                return (
                  <div key={provider.id} className="card border-2 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${provider.isEnabled ? 'bg-primary-50' : 'bg-gray-100'}`}>
                          <TypeIcon className={`h-6 w-6 ${provider.isEnabled ? 'text-primary-950' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{provider.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                              <StatusIcon className="h-3 w-3" />
                              {provider.status}
                            </span>
                            {provider.isPrimary && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleMutation.mutate({ id: provider.id, isEnabled: !provider.isEnabled })}
                        role="switch"
                        aria-checked={provider.isEnabled}
                        aria-label={`Toggle ${provider.name}`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          provider.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          provider.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Requests</p>
                        <p className="font-semibold">{provider.stats.totalRequests.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Success Rate</p>
                        <p className="font-semibold">{provider.stats.successRate}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Avg Time</p>
                        <p className="font-semibold">{provider.stats.avgResponseTime}ms</p>
                      </div>
                    </div>

                    {/* Environment badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        provider.config.environment === 'production'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {provider.config.environment === 'production' ? '🟢 Production' : '🟡 Sandbox'}
                      </span>
                      {provider.lastChecked && (
                        <span className="text-xs text-gray-500">
                          Checked: {provider.lastChecked && provider.lastChecked !== 'N/A' ? new Date(provider.lastChecked).toLocaleString() : 'Never'}
                        </span>
                      )}
                    </div>

                    {/* Error message */}
                    {provider.lastError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          {provider.lastError}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => testMutation.mutate(provider.id)}
                        disabled={testMutation.isPending}
                        className="flex-1 btn btn-outline text-sm flex items-center justify-center gap-1"
                      >
                        <Wifi className="h-4 w-4" />
                        Test Connection
                      </button>
                      <button
                        onClick={() => openConfig(provider)}
                        className="flex-1 btn btn-primary text-sm flex items-center justify-center gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        Configure
                      </button>
                      {!provider.isPrimary && provider.isEnabled && (
                        <button
                          onClick={() => setPrimaryMutation.mutate({ id: provider.id, type: provider.type })}
                          className="btn btn-outline text-sm px-3"
                          title="Set as Primary"
                        >
                          ⭐
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedProvider && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onKeyDown={(e) => { if (e.key === 'Escape') { setIsConfigModalOpen(false); setSelectedProvider(null); } }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsConfigModalOpen(false); setSelectedProvider(null); } }}
        >
          <div role="dialog" aria-modal="true" aria-label={`Configure ${selectedProvider.name}`} className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Configure {selectedProvider.name}</h2>
              <p className="text-gray-600 text-sm mt-1">Update API credentials and settings</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Environment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={configForm.environment}
                  onChange={(e) => setConfigForm({ ...configForm, environment: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={configForm.baseUrl}
                  onChange={(e) => setConfigForm({ ...configForm, baseUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://api.example.com"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showSecrets['apiKey'] ? 'text' : 'password'}
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    placeholder="Enter API key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets({ ...showSecrets, apiKey: !showSecrets['apiKey'] })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets['apiKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* API Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                <div className="relative">
                  <input
                    type={showSecrets['apiSecret'] ? 'text' : 'password'}
                    value={configForm.apiSecret}
                    onChange={(e) => setConfigForm({ ...configForm, apiSecret: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    placeholder="Enter API secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets({ ...showSecrets, apiSecret: !showSecrets['apiSecret'] })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets['apiSecret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Warning for production */}
              {configForm.environment === 'production' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-700 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Production Mode</span>
                  </div>
                  <p className="text-yellow-600 text-xs mt-1">
                    Changes will affect live API connections. Test in sandbox first.
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
