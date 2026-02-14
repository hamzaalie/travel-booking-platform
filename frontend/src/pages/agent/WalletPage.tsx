import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/services/api';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, Upload, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response: any = await walletApi.getWallet();
      return response.data;
    },
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', page, filterType],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (filterType) params.type = filterType;
      const response: any = await walletApi.getTransactions(params);
      return response.data;
    },
  });

  const requestFundMutation = useMutation({
    mutationFn: async (data: any) => {
      return await walletApi.requestFund(data);
    },
    onSuccess: () => {
      toast.success('Fund request submitted successfully!');
      setShowRequestForm(false);
      setAmount('');
      setNotes('');
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to submit fund request');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(amount) < 100) {
      toast.error('Minimum fund request amount is $100');
      return;
    }

    let paymentProofUrl = '';
    
    // If there's a payment proof file, convert to base64 for submission
    if (paymentProofFile) {
      paymentProofUrl = paymentProofPreview || '';
    }

    requestFundMutation.mutate({
      amount: parseFloat(amount),
      paymentMethod,
      notes,
      paymentProofUrl,
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Wallet</h1>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          Request Funds
        </button>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-100">Available Balance</h3>
            <Wallet className="h-8 w-8 text-green-200" />
          </div>
          <p className="text-4xl font-bold mb-2">${parseFloat(wallet?.balance || '0').toFixed(2)}</p>
          <div className="flex items-center text-sm text-green-100">
            <span className={`inline-block px-2 py-1 rounded text-xs ${
              wallet?.status === 'ACTIVE' ? 'bg-green-700' : 'bg-yellow-700'
            }`}>
              {wallet?.status || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Credits</h3>
          <p className="text-2xl md:text-3xl font-bold text-green-600">
            ${transactionsData?.transactions
              ?.filter((t: any) => t.type === 'CREDIT')
              ?.reduce((sum: number, t: any) => sum + t.amount, 0)
              ?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Debits</h3>
          <p className="text-2xl md:text-3xl font-bold text-red-600">
            ${transactionsData?.transactions
              ?.filter((t: any) => t.type === 'DEBIT')
              ?.reduce((sum: number, t: any) => sum + t.amount, 0)
              ?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Fund Request Form */}
      {showRequestForm && (
        <div className="card mb-8 border-2 border-primary-300">
          <h2 className="text-xl font-bold mb-4">Request Fund Load</h2>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD) *
              </label>
              <input
                type="number"
                required
                min="100"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                placeholder="Minimum $100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={3}
                placeholder="Add any payment details or notes..."
              />
            </div>

            {/* Payment Proof Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Proof (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {paymentProofFile ? 'Change File' : 'Upload Proof'}
                </button>
                {paymentProofFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-[200px]">{paymentProofFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofFile(null);
                        setPaymentProofPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {paymentProofPreview && paymentProofFile?.type.startsWith('image/') && (
                <img src={paymentProofPreview} alt="Payment proof" className="mt-2 max-h-40 rounded-lg border" />
              )}
              <p className="mt-1 text-xs text-gray-500">Upload bank transfer receipt or payment screenshot (max 5MB)</p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={requestFundMutation.isPending}
                className="btn btn-primary"
              >
                {requestFundMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Transaction History</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto ${showFilters ? 'bg-gray-200' : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="input w-auto"
            >
              <option value="">All Transactions</option>
              <option value="CREDIT">Credits Only</option>
              <option value="DEBIT">Debits Only</option>
            </select>
          </div>
        )}

        {transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
          <>
            <div className="space-y-3">
              {transactionsData.transactions.map((tx: any) => (
                <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${tx.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                      {tx.bookingReference && (
                        <p className="text-xs text-gray-500">Ref: {tx.bookingReference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: ${tx.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {transactionsData.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {page} of {transactionsData.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(transactionsData.totalPages, p + 1))}
                  disabled={page === transactionsData.totalPages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
