import { useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { esimApi } from '@/services/api';
// MULTI-CURRENCY MODEL REMOVED
// import { useSelector } from 'react-redux';
// import { RootState } from '@/store';
// import { convertPrice } from '@/store/slices/currencySlice';
import {
  ArrowLeft, Globe, Wifi, Clock, Smartphone, Copy, CheckCircle,
  AlertCircle, Loader2, QrCode, Signal, CreditCard,
  ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import EsimQrCode from '@/components/EsimQrCode';
import EsimTopUpModal from '@/components/esim/EsimTopUpModal';
import { useState } from 'react';

const statusConfig: Record<string, { color: string; bg: string; text: string }> = {
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', text: 'Pending' },
  PROCESSING: { color: 'text-blue-700', bg: 'bg-blue-100', text: 'Processing' },
  COMPLETED: { color: 'text-green-700', bg: 'bg-green-100', text: 'Completed' },
  ACTIVATED: { color: 'text-emerald-700', bg: 'bg-emerald-100', text: 'Activated' },
  EXPIRED: { color: 'text-gray-700', bg: 'bg-gray-100', text: 'Expired' },
  FAILED: { color: 'text-red-700', bg: 'bg-red-100', text: 'Failed' },
  CANCELLED: { color: 'text-gray-700', bg: 'bg-gray-200', text: 'Cancelled' },
  REFUNDED: { color: 'text-purple-700', bg: 'bg-purple-100', text: 'Refunded' },
};

export default function EsimOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // MULTI-CURRENCY MODEL REMOVED - Only NPR supported
  const [copied, setCopied] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [showInstructions, setShowInstructions] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(searchParams.get('topup') === 'true');

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, []);

  const formatPrice = (amount: number, _sourceCurrency: string = 'NPR') => {
    return `रू ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['esim-order', id],
    queryFn: async () => {
      const response: any = await esimApi.getOrder(id!);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['esim-usage', id],
    queryFn: async () => {
      const response: any = await esimApi.checkUsage(id!);
      return response.data?.data || response.data;
    },
    enabled: !!id && order?.status && ['COMPLETED', 'ACTIVATED'].includes(order.status),
    refetchInterval: 60000, // refresh every minute for active eSIMs
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
        <p className="text-gray-500 mb-4">This order doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/customer/esim')} className="btn btn-primary">
          Back to My eSIMs
        </button>
      </div>
    );
  }

  const cfg = statusConfig[order.status] || statusConfig.PENDING;
  const isActive = ['PROCESSING', 'COMPLETED', 'ACTIVATED'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/customer/esim')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My eSIMs
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
              <Globe className="h-7 w-7 text-primary-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {order.product?.name || 'eSIM Order'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {(order.product?.countries || []).join(', ') || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="h-3.5 w-3.5" />
                  {order.product?.dataAmount || '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {order.product?.validityDays || '—'} days
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.color}`}>
              {cfg.text}
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(order.totalAmount, order.currency)}
            </span>
            {isActive && order.iccid && (
              <button
                onClick={() => setShowTopUpModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
              >
                <Zap className="h-4 w-4" />
                Top Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code & Activation Details */}
      {isActive && (order.qrCode || order.iccid || order.activationCode) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code */}
          {order.qrCode && (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Installation QR Code
              </h2>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-3">
                <EsimQrCode value={order.qrCode} size={192} />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Scan this QR code with your phone's camera to install the eSIM
              </p>
            </div>
          )}

          {/* Activation Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Activation Details
            </h2>
            <div className="space-y-4">
              {order.iccid && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">ICCID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono break-all">
                      {order.iccid}
                    </code>
                    <button
                      onClick={() => copyToClipboard(order.iccid, 'iccid')}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Copy"
                    >
                      {copied === 'iccid' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {order.activationCode && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Activation Code</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono break-all">
                      {order.activationCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(order.activationCode, 'activation')}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Copy"
                    >
                      {copied === 'activation' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {order.externalOrderId && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Provider Order ID</label>
                  <code className="bg-gray-50 px-3 py-2 rounded text-sm font-mono block">
                    {order.externalOrderId}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Usage (for active eSIMs) */}
      {isActive && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Signal className="h-5 w-5" />
              Data Usage
            </h2>
            {order.iccid && (
              <button
                onClick={() => setShowTopUpModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                <Zap className="h-3.5 w-3.5" />
                Add More Data
              </button>
            )}
          </div>
          {usageLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking usage...
            </div>
          ) : usage ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Data Used</p>
                <p className="text-xl font-bold text-gray-900">{usage.dataUsed || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Data Remaining</p>
                <p className="text-xl font-bold text-emerald-600">{usage.dataRemaining || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Days Remaining</p>
                <p className="text-xl font-bold text-blue-600">{usage.daysRemaining ?? 'N/A'} days</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Usage data not available yet. Install and activate the eSIM to see usage.</p>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Order Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="text-sm font-mono text-gray-900">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="text-sm text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="text-sm text-gray-900">{order.quantity || 1}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatPrice(order.totalAmount, order.currency)}
            </p>
          </div>
          {order.product?.providerName && (
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="text-sm text-gray-900 capitalize">{order.product.providerName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-sm text-gray-900">
              {new Date(order.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      {isActive && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Installation Instructions
            </h2>
            {showInstructions ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showInstructions && (
            <div className="px-6 pb-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* iPhone */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">📱</span> iPhone (iOS 12.1+)
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                    <li>Go to <strong>Settings → Cellular/Mobile Data</strong></li>
                    <li>Tap <strong>Add eSIM</strong> or <strong>Add Cellular Plan</strong></li>
                    <li>Choose <strong>Use QR Code</strong></li>
                    <li>Scan the QR code above or enter the activation code manually</li>
                    <li>Label the plan (e.g., "Travel Data")</li>
                    <li>Set as <strong>Secondary</strong> for data only</li>
                    <li>Turn on <strong>Data Roaming</strong> when you arrive at your destination</li>
                  </ol>
                </div>

                {/* Android */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">🤖</span> Android (Pixel 2+, Samsung S20+)
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                    <li>Go to <strong>Settings → Network & Internet → SIMs</strong></li>
                    <li>Tap <strong>+ Add eSIM</strong> or <strong>Download SIM</strong></li>
                    <li>Tap <strong>Don't have a code?</strong> → scan QR code</li>
                    <li>Scan the QR code or enter the activation code</li>
                    <li>Wait for the eSIM to download and activate</li>
                    <li>Enable <strong>Mobile Data</strong> for the new SIM</li>
                    <li>Turn on <strong>Data Roaming</strong> when you arrive</li>
                  </ol>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>Important:</strong> Install the eSIM before you travel. You'll need an internet connection for installation. Activate data roaming only when you arrive at your destination.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {order.status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Order Pending</p>
            <p className="text-sm text-yellow-700">Your payment is being processed. The eSIM will be issued once payment is confirmed.</p>
          </div>
        </div>
      )}
      {order.status === 'PROCESSING' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0 animate-spin" />
          <div>
            <p className="font-medium text-blue-800">Processing</p>
            <p className="text-sm text-blue-700">Your eSIM is being provisioned. This usually takes a few seconds.</p>
          </div>
        </div>
      )}
      {order.status === 'FAILED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Order Failed</p>
            <p className="text-sm text-red-700">There was an error processing your eSIM order. Please contact support or try purchasing again.</p>
          </div>
        </div>
      )}

      {/* Expired eSIM - Prompt to top up */}
      {order.status === 'EXPIRED' && order.iccid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">eSIM Data Expired</p>
            <p className="text-sm text-amber-700 mb-3">Your data plan has expired. You can top up this eSIM with a new data package without needing to install a new eSIM.</p>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
            >
              <Zap className="h-4 w-4" />
              Top Up Now
            </button>
          </div>
        </div>
      )}

      {/* Low data warning with top-up prompt */}
      {usage && typeof usage.daysRemaining === 'number' && usage.daysRemaining <= 2 && usage.daysRemaining > 0 && isActive && order.iccid && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-orange-800">Running Low on Data</p>
            <p className="text-sm text-orange-700 mb-3">
              Your eSIM has only {usage.daysRemaining} day{usage.daysRemaining !== 1 ? 's' : ''} remaining. 
              Top up now to stay connected!
            </p>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
            >
              <Zap className="h-4 w-4" />
              Top Up Now
            </button>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      <EsimTopUpModal
        orderId={order.id}
        orderIccid={order.iccid || ''}
        productName={order.product?.name || 'eSIM'}
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
      />
    </div>
  );
}
