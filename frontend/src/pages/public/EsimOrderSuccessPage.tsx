import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Smartphone, Copy, ArrowLeft, QrCode, Key, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface EsimOrderData {
  orderId: string;
  iccid: string;
  qrCode: string;
  activationCode: string;
  instructions: string;
  status: string;
  productName?: string;
  productCountry?: string;
  productData?: string;
  productValidity?: number;
}

export default function EsimOrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state as EsimOrderData | null;

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Order Data</h1>
          <p className="text-gray-600 mb-6">Order details not found. Check your eSIM orders in your dashboard.</p>
          <button onClick={() => navigate('/customer/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/esim')}
          className="mb-6 flex items-center text-gray-600 hover:text-primary-950"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to eSIM Store
        </button>

        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">eSIM Purchased Successfully!</h1>
            <p className="text-gray-600 mt-1">Your eSIM is ready to be activated</p>
          </div>

          {/* Order Summary */}
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Order Summary
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Order ID</span>
                <p className="font-medium text-gray-900 truncate">{orderData.orderId}</p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <p>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {orderData.status}
                  </span>
                </p>
              </div>
              {orderData.productName && (
                <div>
                  <span className="text-gray-500">Product</span>
                  <p className="font-medium text-gray-900">{orderData.productName}</p>
                </div>
              )}
              {orderData.productCountry && (
                <div>
                  <span className="text-gray-500">Country</span>
                  <p className="font-medium text-gray-900">{orderData.productCountry}</p>
                </div>
              )}
              {orderData.productData && (
                <div>
                  <span className="text-gray-500">Data</span>
                  <p className="font-medium text-gray-900">{orderData.productData}</p>
                </div>
              )}
              {orderData.productValidity && (
                <div>
                  <span className="text-gray-500">Validity</span>
                  <p className="font-medium text-gray-900">{orderData.productValidity} days</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {orderData.qrCode && (
            <div className="p-6 border-b text-center">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code to Activate
              </h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 inline-block">
                {orderData.qrCode.startsWith('http') ? (
                  <img
                    src={orderData.qrCode}
                    alt="eSIM QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-xs text-gray-500 text-center px-2 break-all">{orderData.qrCode}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Open your phone&apos;s camera or eSIM settings to scan this QR code
              </p>
            </div>
          )}

          {/* ICCID & Activation Code */}
          <div className="p-6 border-b space-y-4">
            {orderData.iccid && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Smartphone className="h-4 w-4" />
                  ICCID
                </h3>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <code className="text-sm font-mono flex-1 break-all">{orderData.iccid}</code>
                  <button
                    onClick={() => copyToClipboard(orderData.iccid, 'ICCID')}
                    className="text-gray-400 hover:text-primary-950 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {orderData.activationCode && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Key className="h-4 w-4" />
                  Activation Code (LPA)
                </h3>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <code className="text-sm font-mono flex-1 break-all">{orderData.activationCode}</code>
                  <button
                    onClick={() => copyToClipboard(orderData.activationCode, 'Activation code')}
                    className="text-gray-400 hover:text-primary-950 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activation Instructions */}
          {orderData.instructions && (
            <div className="p-6 border-b">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Activation Instructions
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📱 For iPhone (iOS 12.1+)</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to Settings → Cellular/Mobile Data</li>
                    <li>Tap &quot;Add Cellular Plan&quot; or &quot;Add eSIM&quot;</li>
                    <li>Scan the QR code above</li>
                    <li>Follow the on-screen instructions</li>
                    <li>Once activated, turn on Data Roaming</li>
                  </ol>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">🤖 For Android</h3>
                  <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                    <li>Go to Settings → Network &amp; Internet → Mobile network</li>
                    <li>Tap &quot;Add&quot; or &quot;+&quot; button</li>
                    <li>Select &quot;Scan QR code&quot;</li>
                    <li>Scan the QR code above</li>
                    <li>Enable Data Roaming when traveling</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Keep your original SIM active for calls/SMS</li>
                    <li>Activate eSIM before traveling (needs Wi-Fi or data)</li>
                    <li>Data roaming must be enabled for the eSIM to work abroad</li>
                    <li>If QR doesn&apos;t work, use the manual activation code above</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="btn btn-secondary flex-1"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/esim')}
              className="btn btn-primary flex-1"
            >
              Buy Another eSIM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
