import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi } from '@/services/api';
import { DollarSign, CheckCircle, XCircle, Clock, Search, RefreshCw, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
};

export default function RefundManagementPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  // Fetch refunds from real API
  const { data, isLoading } = useQuery({
    queryKey: ['admin-refunds', filterStatus, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      const response: any = await refundApi.getAll(params);
      return response.data;
    },
  });

  const refunds: any[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Retry failed refund
  const retryMutation = useMutation({
    mutationFn: (id: string) => refundApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast.success('Refund retry initiated');
    },
    onError: () => toast.error('Failed to retry refund'),
  });

  // Client-side search filter
  const filteredRefunds = refunds.filter((refund: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      refund.booking?.bookingReference?.toLowerCase().includes(term) ||
      refund.booking?.pnr?.toLowerCase().includes(term) ||
      refund.booking?.user?.email?.toLowerCase().includes(term) ||
      refund.booking?.user?.firstName?.toLowerCase().includes(term) ||
      refund.booking?.user?.lastName?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const parseDecimal = (val: any) => {
    if (val === null || val === undefined) return 0;
    return parseFloat(String(val)) || 0;
  };

  // Stats from loaded data
  const stats = {
    pending: refunds.filter((r: any) => r.status === 'PENDING').length,
    processing: refunds.filter((r: any) => r.status === 'PROCESSING').length,
    completed: refunds.filter((r: any) => r.status === 'COMPLETED').length,
    failed: refunds.filter((r: any) => r.status === 'FAILED').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-primary-950 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading refunds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ref, PNR, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Processing</p>
              <p className="text-3xl font-bold text-blue-900">{stats.processing}</p>
            </div>
            <RefreshCw className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="card bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-900">{stats.failed}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Refunds List */}
      <div className="card">
        {filteredRefunds.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No refunds found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRefunds.map((refund: any) => {
                  const amount = parseDecimal(refund.amount);
                  const penalty = parseDecimal(refund.penaltyAmount);
                  const refundAmount = parseDecimal(refund.refundAmount);

                  return (
                    <tr key={refund.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {refund.booking?.bookingReference || 'N/A'}
                          </p>
                          {refund.booking?.pnr && (
                            <p className="text-sm text-gray-500">PNR: {refund.booking.pnr}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {refund.booking?.origin} → {refund.booking?.destination}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {refund.booking?.user?.firstName} {refund.booking?.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{refund.booking?.user?.email}</p>
                          {refund.booking?.agent && (
                            <p className="text-xs text-blue-600">Agent: {refund.booking.agent.agencyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Original: NPR {amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-red-600">
                            Penalty: -NPR {penalty.toFixed(2)}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            Refund: NPR {refundAmount.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(refund.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(refund.createdAt).toLocaleString()}
                        {refund.processedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Processed: {new Date(refund.processedAt).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRefund(refund)}
                            className="text-primary-950 hover:text-primary-800"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {refund.status === 'FAILED' && (
                            <button
                              onClick={() => retryMutation.mutate(refund.id)}
                              disabled={retryMutation.isPending}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="Retry Refund"
                            >
                              {retryMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Refund Details</h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
                  <p className="font-semibold">{selectedRefund.booking?.bookingReference || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">PNR</p>
                  <p className="font-semibold">{selectedRefund.booking?.pnr || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="font-semibold">
                  {selectedRefund.booking?.user?.firstName} {selectedRefund.booking?.user?.lastName}
                </p>
                <p className="text-sm text-gray-600">{selectedRefund.booking?.user?.email}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Route</p>
                <p className="font-semibold">
                  {selectedRefund.booking?.origin} → {selectedRefund.booking?.destination}
                </p>
                {selectedRefund.booking?.departureDate && (
                  <p className="text-sm text-gray-500">
                    Departure: {new Date(selectedRefund.booking.departureDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="bg-accent-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Amount Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Original Amount:</span>
                    <span className="font-semibold">NPR {parseDecimal(selectedRefund.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Penalty:</span>
                    <span className="font-semibold">-NPR {parseDecimal(selectedRefund.penaltyAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Refund Amount:</span>
                    <span className="font-bold text-green-600">
                      NPR {parseDecimal(selectedRefund.refundAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  {getStatusBadge(selectedRefund.status)}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedRefund.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedRefund.reason && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Reason</p>
                  <p className="text-sm">{selectedRefund.reason}</p>
                </div>
              )}

              {selectedRefund.refundData?.adminNotes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Admin Notes</p>
                  <p className="text-sm">{selectedRefund.refundData.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRefund(null)}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
              {selectedRefund.status === 'FAILED' && (
                <button
                  onClick={() => {
                    retryMutation.mutate(selectedRefund.id);
                    setSelectedRefund(null);
                  }}
                  className="btn btn-primary flex-1"
                >
                  Retry Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
