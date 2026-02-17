import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi, esimApi } from '@/services/api';

export default function EsimPaymentCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'issuing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current); };
  }, []);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get pending eSIM purchase data
        const pendingStr = sessionStorage.getItem('pendingEsimPurchase');
        if (!pendingStr) {
          throw new Error('No pending eSIM purchase found');
        }
        const purchaseData = JSON.parse(pendingStr);

        // Determine which payment gateway returned
        const encodedData = searchParams.get('data'); // eSewa
        const pidx = searchParams.get('pidx'); // Khalti
        const sessionId = searchParams.get('session_id'); // Stripe

        let paymentVerified = false;

        if (encodedData) {
          // eSewa callback
          const decodedData = JSON.parse(atob(encodedData));
          if (decodedData.status !== 'COMPLETE') {
            throw new Error(`eSewa payment status: ${decodedData.status}`);
          }

          const verifyResponse = await paymentApi.verifyEsewa({
            transactionUuid: decodedData.transaction_uuid,
            totalAmount: parseFloat(decodedData.total_amount),
            encodedResponse: encodedData,
            bookingId: purchaseData.tempBookingId,
          }) as any;

          paymentVerified = verifyResponse?.success && verifyResponse?.data?.isVerified;
        } else if (pidx) {
          // Khalti callback
          const verifyResponse = await paymentApi.verifyKhalti(pidx, purchaseData.tempBookingId) as any;
          paymentVerified = verifyResponse?.success;
        } else if (sessionId) {
          // Stripe - session completed means payment is done
          paymentVerified = true;
        }

        if (!paymentVerified) {
          throw new Error('Payment verification failed');
        }

        // Payment verified! Now issue the eSIM from Airalo
        setStatus('issuing');

        const esimResponse = await esimApi.purchase(purchaseData.productId) as any;
        const esimData = esimResponse.data?.data || esimResponse.data || esimResponse;

        // Clear session storage
        sessionStorage.removeItem('pendingEsimPurchase');

        setStatus('success');
        toast.success('eSIM purchased successfully!');

        // Redirect to success page after a moment
        redirectTimerRef.current = setTimeout(() => {
          navigate('/esim/order/success', {
            state: {
              orderId: esimData.orderId,
              iccid: esimData.iccid,
              qrCode: esimData.qrCode,
              activationCode: esimData.activationCode,
              instructions: esimData.instructions,
              status: esimData.status,
              productName: purchaseData.productName,
              productCountry: purchaseData.productCountry,
              productData: purchaseData.productData,
              productValidity: purchaseData.productValidity,
            },
          });
        }, 2000);

      } catch (error: any) {
        console.error('eSIM payment callback error:', error);
        setStatus('error');
        // Extract the most useful error message from axios or generic errors
        const backendMsg = error.response?.data?.error || error.response?.data?.message;
        const displayMsg = backendMsg || error.message || 'Payment or eSIM issuance failed';
        setErrorMessage(displayMsg);
        toast.error('eSIM purchase failed');
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="h-16 w-16 text-primary-950 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </>
          )}

          {status === 'issuing' && (
            <>
              <Loader2 className="h-16 w-16 text-green-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Issuing Your eSIM</h1>
              <p className="text-gray-600">Payment confirmed! Activating your eSIM...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">eSIM Ready!</h1>
              <p className="text-gray-600 mb-4">
                Your eSIM has been issued. Redirecting to activation details...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Failed</h1>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/esim')}
                  className="btn btn-primary w-full"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/customer/dashboard')}
                  className="btn btn-secondary w-full"
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
