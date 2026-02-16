import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function EsewaFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Your eSewa payment was not completed. Please try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                // bookingData is still in sessionStorage, go straight to payment
                const hasBookingData = sessionStorage.getItem('bookingData');
                if (hasBookingData) {
                  navigate('/payment');
                } else {
                  navigate('/search');
                }
              }}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary w-full"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
