/**
 * eSIM Top-Up Modal
 * Allows customers to purchase additional data for an existing eSIM
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esimApi, paymentApi } from '@/services/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  X, Wifi, Clock, Check, Loader2, AlertCircle,
  Zap, ShoppingBag, CreditCard, Wallet, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TopUpPackage {
  id: string;
  name: string;
  dataAmount: string;
  validityDays: number;
  price: number;
  currency: string;
}

type PaymentMethod = 'ESEWA' | 'KHALTI' | 'STRIPE';

interface EsimTopUpModalProps {
  orderId: string;
  orderIccid: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EsimTopUpModal({
  orderId,
  orderIccid,
  productName,
  isOpen,
  onClose,
}: EsimTopUpModalProps) {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null);
  const [step, setStep] = useState<'select' | 'payment' | 'processing' | 'success'>('select');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const formatPrice = (amount: number) => {
    return `रू ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch available top-up packages
  const { data: topUpData, isLoading: loadingPackages, error: packagesError } = useQuery({
    queryKey: ['esim-topup-packages', orderId],
    queryFn: async () => {
      const response: any = await esimApi.getTopUpPackages(orderId);
      return response.data?.data || response.data;
    },
    enabled: isOpen,
  });

  // Fetch top-up history
  const { data: topUpHistory } = useQuery({
    queryKey: ['esim-topup-history', orderId],
    queryFn: async () => {
      const response: any = await esimApi.getTopUpHistory(orderId);
      return response.data?.data || response.data || [];
    },
    enabled: isOpen,
  });

  // Apply top-up mutation
  const topUpMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response: any = await esimApi.applyTopUp(orderId, packageId);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      setStep('success');
      // Refresh usage and order data
      queryClient.invalidateQueries({ queryKey: ['esim-usage', orderId] });
      queryClient.invalidateQueries({ queryKey: ['esim-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['esim-topup-history', orderId] });
      toast.success('eSIM topped up successfully!');
    },
    onError: (error: any) => {
      setStep('select');
      toast.error(error.response?.data?.error || 'Failed to apply top-up');
    },
  });

  const handleSelectPackage = (pkg: TopUpPackage) => {
    setSelectedPackage(pkg);
    setStep('payment');
    setSelectedPaymentMethod(null);
  };

  const handleConfirmTopUp = async () => {
    if (!selectedPackage || !selectedPaymentMethod) return;

    setStep('processing');

    try {
      const tempId = `TOPUP-${Date.now()}`;
      const customerEmail = user?.email || '';
      const customerName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer';

      // Store top-up data for callback
      const topUpPurchaseData = {
        orderId,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        paymentMethod: selectedPaymentMethod,
        type: 'ESIM_TOPUP',
      };

      if (selectedPaymentMethod === 'ESEWA') {
        const response = await paymentApi.initiateEsewa({
          amount: Math.round(selectedPackage.price),
          bookingId: tempId,
          customerEmail,
          customerName,
          successUrl: `${window.location.origin}/esim/payment/success?topup=true&orderId=${orderId}`,
          failureUrl: `${window.location.origin}/customer/esim/${orderId}`,
        }) as any;

        if (response.data.paymentData) {
          sessionStorage.setItem('pendingEsimTopUp', JSON.stringify({
            ...topUpPurchaseData,
            tempBookingId: tempId,
            transactionUuid: response.data.transactionUuid,
          }));

          const form = document.createElement('form');
          form.method = 'POST';
          form.action = response.data.paymentUrl;
          Object.keys(response.data.paymentData).forEach((key: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = response.data.paymentData[key];
            form.appendChild(input);
          });
          document.body.appendChild(form);
          form.submit();
          return;
        }
      } else if (selectedPaymentMethod === 'KHALTI') {
        const response = await paymentApi.initiateKhalti({
          amount: Math.round(selectedPackage.price),
          bookingId: tempId,
          customerEmail,
          customerName,
          successUrl: `${window.location.origin}/esim/payment/callback?topup=true&orderId=${orderId}`,
        }) as any;

        if (response.data?.paymentUrl) {
          sessionStorage.setItem('pendingEsimTopUp', JSON.stringify({
            ...topUpPurchaseData,
            tempBookingId: tempId,
          }));
          window.location.href = response.data.paymentUrl;
          return;
        }
      } else if (selectedPaymentMethod === 'STRIPE') {
        const response = await paymentApi.createStripeCheckout({
          amount: selectedPackage.price,
          currency: 'NPR',
          bookingId: tempId,
          customerEmail,
          customerName,
          bookingType: 'eSIM Top-Up',
          successUrl: `${window.location.origin}/esim/payment/success?session_id={CHECKOUT_SESSION_ID}&topup=true&orderId=${orderId}`,
          cancelUrl: `${window.location.origin}/customer/esim/${orderId}`,
        }) as any;

        if (response.data.url) {
          sessionStorage.setItem('pendingEsimTopUp', JSON.stringify({
            ...topUpPurchaseData,
            tempBookingId: tempId,
          }));
          window.location.href = response.data.url;
          return;
        }
      }

      // If payment gateway didn't redirect, apply top-up directly (for demo/testing)
      await topUpMutation.mutateAsync(selectedPackage.id);
    } catch (error: any) {
      console.error('Top-up payment error:', error);
      setStep('select');
      toast.error(error.response?.data?.message || 'Payment initialization failed');
    }
  };

  const handleClose = () => {
    setSelectedPackage(null);
    setStep('select');
    setSelectedPaymentMethod(null);
    onClose();
  };

  if (!isOpen) return null;

  const packages: TopUpPackage[] = topUpData?.packages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Top Up eSIM</h2>
                <p className="text-sm text-white/80 truncate max-w-[250px]">{productName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {orderIccid && (
            <p className="text-xs text-white/60 mt-2 font-mono">ICCID: {orderIccid}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Select Package */}
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose a data package to add to your existing eSIM. The data will be added instantly.
              </p>

              {loadingPackages ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading available packages...</p>
                </div>
              ) : packagesError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <p className="text-sm text-red-600">Failed to load top-up packages</p>
                  <p className="text-xs text-gray-500 mt-1">Please try again later</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8">
                  <Wifi className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No top-up packages available for this eSIM</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                          <Wifi className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{pkg.dataAmount}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Valid for {pkg.validityDays} days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600">{formatPrice(pkg.price)}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Top-up History */}
              {topUpHistory && topUpHistory.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Previous Top-Ups</h3>
                  <div className="space-y-2">
                    {topUpHistory.slice(0, 3).map((topup: any) => (
                      <div key={topup.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <span className="font-medium text-gray-700">{topup.dataAmount}</span>
                          <span className="text-gray-400 mx-2">·</span>
                          <span className="text-gray-500">{topup.validityDays} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{formatPrice(Number(topup.amount))}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            topup.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {topup.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && selectedPackage && (
            <div className="space-y-5">
              {/* Selected Package Summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Selected Package</span>
                  <button onClick={() => { setStep('select'); setSelectedPackage(null); }} className="text-xs text-emerald-600 hover:underline">
                    Change
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{selectedPackage.dataAmount}</p>
                    <p className="text-sm text-gray-500">{selectedPackage.validityDays} days validity</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">{formatPrice(selectedPackage.price)}</p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</h3>
                <div className="space-y-2">
                  {/* eSewa */}
                  <button
                    onClick={() => setSelectedPaymentMethod('ESEWA')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === 'ESEWA'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">eSewa</p>
                      <p className="text-xs text-gray-500">Pay with eSewa wallet</p>
                    </div>
                    {selectedPaymentMethod === 'ESEWA' && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </button>

                  {/* Khalti */}
                  <button
                    onClick={() => setSelectedPaymentMethod('KHALTI')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === 'KHALTI'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">Khalti</p>
                      <p className="text-xs text-gray-500">Pay with Khalti wallet</p>
                    </div>
                    {selectedPaymentMethod === 'KHALTI' && (
                      <Check className="h-5 w-5 text-purple-600" />
                    )}
                  </button>

                  {/* Stripe */}
                  <button
                    onClick={() => setSelectedPaymentMethod('STRIPE')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === 'STRIPE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">Card Payment</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard via Stripe</p>
                    </div>
                    {selectedPaymentMethod === 'STRIPE' && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmTopUp}
                disabled={!selectedPaymentMethod}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <ShoppingBag className="h-5 w-5" />
                Pay {formatPrice(selectedPackage.price)} & Top Up
              </button>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Top-Up</h3>
              <p className="text-sm text-gray-500">Please wait while we add data to your eSIM...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Top-Up Successful!</h3>
              <p className="text-sm text-gray-500 mb-1">
                {selectedPackage?.dataAmount} has been added to your eSIM.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The additional data is available immediately.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
