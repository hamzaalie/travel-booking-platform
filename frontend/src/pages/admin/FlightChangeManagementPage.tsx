import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flightChangeApi } from '@/services/api';
import { RefreshCw, Plane, Clock, Check, X, AlertTriangle, Eye, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface FlightRequest {
  id: string;
  bookingId: string;
  type: string;
  status: string;
  reason: string;
  newDepartureDate: string | null;
  newReturnDate: string | null;
  requestedRefundAmount: number | null;
  approvedRefundAmount: number | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    bookingReference: string;
    origin: string;
    destination: string;
    departureDate: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

const REQUEST_TYPES: Record<string, { label: string; color: string }> = {
  DATE_CHANGE: { label: 'Date Change', color: 'bg-blue-100 text-blue-700' },
  NAME_CORRECTION: { label: 'Name Correction', color: 'bg-purple-100 text-purple-700' },
  CANCELLATION: { label: 'Cancellation', color: 'bg-red-100 text-red-700' },
  REFUND: { label: 'Refund', color: 'bg-orange-100 text-orange-700' },
  ROUTE_CHANGE: { label: 'Route Change', color: 'bg-teal-100 text-teal-700' },
  UPGRADE: { label: 'Upgrade', color: 'bg-green-100 text-green-700' },
  SEAT_CHANGE: { label: 'Seat Change', color: 'bg-gray-100 text-gray-700' },
  BAGGAGE_CHANGE: { label: 'Baggage Change', color: 'bg-yellow-100 text-yellow-700' },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

export default function FlightChangeManagementPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<FlightRequest | null>(null);
  const [processForm, setProcessForm] = useState({
    status: 'APPROVED',
    adminNotes: '',
    approvedRefundAmount: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['flight-change-requests', statusFilter, typeFilter, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const response: any = await flightChangeApi.getAdminRequests(params);
      return response.data;
    },
  });

  const processMutation = useMutation({
    mutationFn: (data: any) =>
      flightChangeApi.processRequest(selectedRequest!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-change-requests'] });
      setSelectedRequest(null);
      toast.success('Request processed successfully');
    },
    onError: () => {
      toast.error('Failed to process request');
    },
  });

  const handleProcess = () => {
    if (!selectedRequest) return;
    
    processMutation.mutate({
      status: processForm.status,
      adminNotes: processForm.adminNotes,
      approvedRefundAmount: processForm.approvedRefundAmount || undefined,
    });
  };

  const pendingCount = data?.requests?.filter((r: FlightRequest) => r.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flight Change Requests</h1>
          <p className="text-gray-600 mt-1">Manage flight modifications and refund requests</p>
        </div>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700 font-semibold">
                {pendingCount} Pending
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <RefreshCw className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700 font-semibold">
              {data?.total || 0} Total Requests
            </span>
          </div>
        </div>
      </div>

      {/* Filters done with all other things now and aksbjbad jbdasdjb nmjnjkb */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-48"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-48"
          >
            <option value="all">All Types</option>
            {Object.entries(REQUEST_TYPES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8">Loading requests...</div>
        ) : !data?.requests?.length ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No change requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booking
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requested Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.requests.map((request: FlightRequest) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.booking.bookingReference}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Plane className="h-3 w-3" />
                          {request.booking.origin} → {request.booking.destination}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {request.booking.user.firstName} {request.booking.user.lastName}
                        </div>
                        <div className="text-gray-500">{request.booking.user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${REQUEST_TYPES[request.type]?.color || 'bg-gray-100'}`}>
                        {REQUEST_TYPES[request.type]?.label || request.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status] || 'bg-gray-100'}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {request.requestedRefundAmount ? (
                        <span className="font-medium">NPR {request.requestedRefundAmount.toLocaleString()}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setProcessForm({
                            status: 'APPROVED',
                            adminNotes: '',
                            approvedRefundAmount: request.requestedRefundAmount || 0,
                          });
                        }}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
            {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Review Request</h3>
                  <p className="text-gray-500 text-sm">
                    Booking: {selectedRequest.booking.bookingReference}
                  </p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Request Type</label>
                  <p className="font-medium">{REQUEST_TYPES[selectedRequest.type]?.label}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Current Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedRequest.status]}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Customer</label>
                  <p className="font-medium">
                    {selectedRequest.booking.user.firstName} {selectedRequest.booking.user.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedRequest.booking.user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Route</label>
                  <p className="font-medium flex items-center gap-1">
                    <Plane className="h-4 w-4" />
                    {selectedRequest.booking.origin} → {selectedRequest.booking.destination}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Departure Date</label>
                  <p className="font-medium">
                    {new Date(selectedRequest.booking.departureDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm text-gray-500">Customer's Reason</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* New Dates (if date change) */}
              {(selectedRequest.newDepartureDate || selectedRequest.newReturnDate) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.newDepartureDate && (
                    <div>
                      <label className="text-sm text-gray-500">Requested New Departure</label>
                      <p className="font-medium">
                        {new Date(selectedRequest.newDepartureDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedRequest.newReturnDate && (
                    <div>
                      <label className="text-sm text-gray-500">Requested New Return</label>
                      <p className="font-medium">
                        {new Date(selectedRequest.newReturnDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Refund Amount */}
              {selectedRequest.requestedRefundAmount && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <label className="text-sm text-yellow-700 font-medium">Requested Refund Amount</label>
                  <p className="text-2xl font-bold text-yellow-800">
                    NPR {selectedRequest.requestedRefundAmount.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Process Form */}
              {selectedRequest.status === 'PENDING' || selectedRequest.status === 'UNDER_REVIEW' ? (
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-semibold">Process Request</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Decision
                    </label>
                    <select
                      value={processForm.status}
                      onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                      className="input w-full"
                    >
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject</option>
                      <option value="UNDER_REVIEW">Keep Under Review</option>
                    </select>
                  </div>

                  {(selectedRequest.type === 'REFUND' || selectedRequest.type === 'CANCELLATION') &&
                    processForm.status === 'APPROVED' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approved Refund Amount (NPR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={processForm.approvedRefundAmount}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              approvedRefundAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="input w-full"
                        />
                      </div>
                    )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={processForm.adminNotes}
                      onChange={(e) => setProcessForm({ ...processForm, adminNotes: e.target.value })}
                      rows={3}
                      className="input w-full"
                      placeholder="Add notes for internal reference or customer communication..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="btn btn-secondary"
                      disabled={processMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProcess}
                      className={`btn ${
                        processForm.status === 'APPROVED' ? 'btn-primary' :
                        processForm.status === 'REJECTED' ? 'bg-red-600 text-white hover:bg-red-700' :
                        'btn-secondary'
                      }`}
                      disabled={processMutation.isPending}
                    >
                      {processForm.status === 'APPROVED' && <Check className="h-4 w-4 mr-1" />}
                      {processForm.status === 'REJECTED' && <X className="h-4 w-4 mr-1" />}
                      {processMutation.isPending ? 'Processing...' : `${processForm.status === 'APPROVED' ? 'Approve' : processForm.status === 'REJECTED' ? 'Reject' : 'Update'} Request`}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-2">Resolution</h4>
                  {selectedRequest.adminNotes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm text-gray-500 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Admin Notes
                      </label>
                      <p className="mt-1">{selectedRequest.adminNotes}</p>
                    </div>
                  )}
                  {selectedRequest.approvedRefundAmount && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <label className="text-sm text-green-700">Approved Refund</label>
                      <p className="text-xl font-bold text-green-800">
                        NPR {selectedRequest.approvedRefundAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
