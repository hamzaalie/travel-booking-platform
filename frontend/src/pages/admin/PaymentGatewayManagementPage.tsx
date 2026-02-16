import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPaymentGatewayApi } from '@/services/api';
import {
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Settings,
  Wifi,
  Activity,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  TrendingUp,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  logo: string;
  isEnabled: boolean;
  isPrimary: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'MAINTENANCE';
  environment: 'sandbox' | 'production';
  supportedCurrencies: string[];
  transactionFee: number;
  feeType: 'FIXED' | 'PERCENTAGE';
  minAmount: number;
  maxAmount: number;
  config: {
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    webhookSecret?: string;
    callbackUrl?: string;
    additionalConfig?: Record<string, string>;
  };
  stats: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalVolume: number;
    successRate: number;
  };
  lastTransaction: string | null;
  lastError: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-700' },
  MAINTENANCE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

const DEFAULT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'esewa',
    name: 'eSewa',
    provider: 'esewa',
    logo: '💚',
    isEnabled: true,
    isPrimary: true,
    status: 'ACTIVE',
    environment: 'production',
    supportedCurrencies: ['NPR'],
    transactionFee: 1.5,
    feeType: 'PERCENTAGE',
    minAmount: 10,
    maxAmount: 200000,
    config: { publicKey: '', secretKey: '', merchantId: '', callbackUrl: '/payment/esewa/success' },
    stats: { totalTransactions: 3400, successfulTransactions: 3360, failedTransactions: 40, totalVolume: 12500000, successRate: 98.8 },
    lastTransaction: new Date().toISOString(),
    lastError: null,
  },
  {
    id: 'khalti',
    name: 'Khalti',
    provider: 'khalti',
    logo: '💜',
    isEnabled: true,
    isPrimary: false,
    status: 'ACTIVE',
    environment: 'production',
    supportedCurrencies: ['NPR'],
    transactionFee: 1.5,
    feeType: 'PERCENTAGE',
    minAmount: 10,
    maxAmount: 200000,
    config: { publicKey: '', secretKey: '', callbackUrl: '/payment/khalti/callback' },
    stats: { totalTransactions: 2100, successfulTransactions: 2080, failedTransactions: 20, totalVolume: 8200000, successRate: 99.0 },
    lastTransaction: new Date().toISOString(),
    lastError: null,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    provider: 'stripe',
    logo: '💳',
    isEnabled: false,
    isPrimary: false,
    status: 'INACTIVE',
    environment: 'sandbox',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'NPR'],
    transactionFee: 2.9,
    feeType: 'PERCENTAGE',
    minAmount: 1,
    maxAmount: 999999,
    config: { publicKey: '', secretKey: '', webhookSecret: '' },
    stats: { totalTransactions: 0, successfulTransactions: 0, failedTransactions: 0, totalVolume: 0, successRate: 0 },
    lastTransaction: null,
    lastError: null,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    provider: 'paypal',
    logo: '🅿️',
    isEnabled: false,
    isPrimary: false,
    status: 'INACTIVE',
    environment: 'sandbox',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    transactionFee: 3.49,
    feeType: 'PERCENTAGE',
    minAmount: 1,
    maxAmount: 500000,
    config: { publicKey: '', secretKey: '', merchantId: '' },
    stats: { totalTransactions: 0, successfulTransactions: 0, failedTransactions: 0, totalVolume: 0, successRate: 0 },
    lastTransaction: null,
    lastError: null,
  },
  {
    id: 'wallet',
    name: 'Agent Wallet',
    provider: 'wallet',
    logo: '👛',
    isEnabled: true,
    isPrimary: false,
    status: 'ACTIVE',
    environment: 'production',
    supportedCurrencies: ['NPR'],
    transactionFee: 0,
    feeType: 'FIXED',
    minAmount: 0,
    maxAmount: 999999,
    config: {},
    stats: { totalTransactions: 5600, successfulTransactions: 5590, failedTransactions: 10, totalVolume: 25000000, successRate: 99.8 },
    lastTransaction: new Date().toISOString(),
    lastError: null,
  },
];

export default function PaymentGatewayManagementPage() {
  const queryClient = useQueryClient();
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [configForm, setConfigForm] = useState<any>({});

  const { data: gateways = DEFAULT_GATEWAYS, isLoading } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: async () => {
      try {
        const response: any = await adminPaymentGatewayApi.getGateways();
        const saved = response.data?.data?.gateways || response.data?.gateways || null;
        if (!saved || !Array.isArray(saved) || saved.length === 0) {
          return DEFAULT_GATEWAYS;
        }
        // Merge saved settings with defaults so we keep full structure
        return DEFAULT_GATEWAYS.map((def) => {
          const override = saved.find((s: any) => s.id === def.id);
          return override ? { ...def, ...override } : def;
        });
      } catch {
        return DEFAULT_GATEWAYS;
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      adminPaymentGatewayApi.toggleGateway(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      toast.success('Payment gateway updated');
    },
    onError: () => toast.error('Failed to update payment gateway'),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => adminPaymentGatewayApi.testGateway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      toast.success('Payment gateway test successful');
    },
    onError: () => toast.error('Payment gateway test failed'),
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: any }) =>
      adminPaymentGatewayApi.updateConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      setIsConfigModalOpen(false);
      toast.success('Gateway configuration updated');
    },
    onError: () => toast.error('Failed to update configuration'),
  });

  const openConfig = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setConfigForm({
      ...gateway.config,
      environment: gateway.environment,
      transactionFee: gateway.transactionFee,
      feeType: gateway.feeType,
      minAmount: gateway.minAmount,
      maxAmount: gateway.maxAmount,
    });
    setIsConfigModalOpen(true);
  };

  const totalVolume = gateways.reduce((sum: number, g: PaymentGateway) => sum + g.stats.totalVolume, 0);
  const totalTransactions = gateways.reduce((sum: number, g: PaymentGateway) => sum + g.stats.totalTransactions, 0);
  const failedTransactions = gateways.reduce((sum: number, g: PaymentGateway) => sum + g.stats.failedTransactions, 0);

  if (isLoading) {
    return <div className="text-center py-8">Loading payment gateways...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-gray-600 mt-1">Manage payment gateways - enable/disable, configure API keys, monitor transactions</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-green-700 font-semibold">
            {gateways.filter((g: PaymentGateway) => g.isEnabled).length} Active Gateways
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary-950" />
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-primary-900">NPR {(totalVolume / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-green-700">{totalTransactions.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Failed Transactions</p>
              <p className="text-2xl font-bold text-red-700">{failedTransactions}</p>
            </div>
          </div>
        </div>
        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-accent-500" />
            <div>
              <p className="text-sm text-gray-600">Avg Success Rate</p>
              <p className="text-2xl font-bold text-primary-900">
                {gateways.filter((g: PaymentGateway) => g.stats.totalTransactions > 0).length > 0
                  ? (gateways.filter((g: PaymentGateway) => g.stats.totalTransactions > 0)
                      .reduce((sum: number, g: PaymentGateway) => sum + g.stats.successRate, 0) /
                      gateways.filter((g: PaymentGateway) => g.stats.totalTransactions > 0).length).toFixed(1)
                  : '0'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {gateways.map((gateway: PaymentGateway) => {
          const statusStyle = STATUS_STYLES[gateway.status] || STATUS_STYLES.INACTIVE;
          return (
            <div key={gateway.id} className={`card border-2 transition-shadow hover:shadow-lg ${
              gateway.isEnabled ? 'border-gray-200' : 'border-gray-100 opacity-75'
            }`}>
              {/* Gateway Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{gateway.logo}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{gateway.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {gateway.status}
                      </span>
                      {gateway.isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: gateway.id, isEnabled: !gateway.isEnabled })}
                  className="text-gray-500 hover:text-gray-700"
                  title={gateway.isEnabled ? 'Disable' : 'Enable'}
                >
                  {gateway.isEnabled ? (
                    <ToggleRight className="h-8 w-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Environment</span>
                  <span className={`font-medium ${gateway.environment === 'production' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {gateway.environment === 'production' ? '🟢 Production' : '🟡 Sandbox'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Fee</span>
                  <span className="font-medium">
                    {gateway.feeType === 'PERCENTAGE' ? `${gateway.transactionFee}%` : `NPR ${gateway.transactionFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Currencies</span>
                  <span className="font-medium">{gateway.supportedCurrencies.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Limits</span>
                  <span className="font-medium">NPR {gateway.minAmount} - {gateway.maxAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Transaction Stats */}
              {gateway.stats.totalTransactions > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Transactions</p>
                      <p className="font-semibold">{gateway.stats.totalTransactions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Success Rate</p>
                      <p className="font-semibold text-green-600">{gateway.stats.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Volume</p>
                      <p className="font-semibold">NPR {(gateway.stats.totalVolume / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Failed</p>
                      <p className="font-semibold text-red-600">{gateway.stats.failedTransactions}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {gateway.lastError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    {gateway.lastError}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => testMutation.mutate(gateway.id)}
                  className="flex-1 btn btn-outline text-sm flex items-center justify-center gap-1"
                >
                  <Wifi className="h-4 w-4" />
                  Test
                </button>
                <button
                  onClick={() => openConfig(gateway)}
                  className="flex-1 btn btn-primary text-sm flex items-center justify-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Config Modal */}
      {isConfigModalOpen && selectedGateway && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Configure {selectedGateway.name}</h2>
              <p className="text-gray-600 text-sm mt-1">Update gateway credentials and settings</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={configForm.environment}
                  onChange={(e) => setConfigForm({ ...configForm, environment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.transactionFee}
                    onChange={(e) => setConfigForm({ ...configForm, transactionFee: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                  <select
                    value={configForm.feeType}
                    onChange={(e) => setConfigForm({ ...configForm, feeType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (NPR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (NPR)</label>
                  <input
                    type="number"
                    value={configForm.minAmount}
                    onChange={(e) => setConfigForm({ ...configForm, minAmount: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (NPR)</label>
                  <input
                    type="number"
                    value={configForm.maxAmount}
                    onChange={(e) => setConfigForm({ ...configForm, maxAmount: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {selectedGateway.provider !== 'wallet' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Public Key / Merchant ID</label>
                    <div className="relative">
                      <input
                        type={showSecrets['publicKey'] ? 'text' : 'password'}
                        value={configForm.publicKey || configForm.merchantId || ''}
                        onChange={(e) => setConfigForm({ ...configForm, publicKey: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets({ ...showSecrets, publicKey: !showSecrets['publicKey'] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showSecrets['publicKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                    <div className="relative">
                      <input
                        type={showSecrets['secretKey'] ? 'text' : 'password'}
                        value={configForm.secretKey || ''}
                        onChange={(e) => setConfigForm({ ...configForm, secretKey: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets({ ...showSecrets, secretKey: !showSecrets['secretKey'] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showSecrets['secretKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {selectedGateway.provider === 'stripe' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                      <div className="relative">
                        <input
                          type={showSecrets['webhookSecret'] ? 'text' : 'password'}
                          value={configForm.webhookSecret || ''}
                          onChange={(e) => setConfigForm({ ...configForm, webhookSecret: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets({ ...showSecrets, webhookSecret: !showSecrets['webhookSecret'] })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showSecrets['webhookSecret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {configForm.environment === 'production' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-700 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Production Mode - Changes affect live payments</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setIsConfigModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button
                onClick={() => {
                  if (selectedGateway) {
                    updateConfigMutation.mutate({ id: selectedGateway.id, config: configForm });
                  }
                }}
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
