import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/services/api';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response: any = await walletApi.getWallet();
      return response.data;
    },
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', page],
    queryFn: async () => {
      const response: any = await walletApi.getTransactions({ page, limit: 20 });
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
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit fund request');
    },
  });

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(amount) < 100) {
      toast.error('Minimum fund request amount is $100');
      return;
    }
    requestFundMutation.mutate({
      amount: parseFloat(amount),
      paymentMethod,
      notes,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="btn btn-primary"
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
          <p className="text-3xl font-bold text-green-600">
            ${transactionsData?.transactions
              ?.filter((t: any) => t.type === 'CREDIT')
              ?.reduce((sum: number, t: any) => sum + t.amount, 0)
              ?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Debits</h3>
          <p className="text-3xl font-bold text-red-600">
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
        <h2 className="text-2xl font-bold mb-6">Transaction History</h2>

        {transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
          <>
            <div className="space-y-3">
              {transactionsData.transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
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
