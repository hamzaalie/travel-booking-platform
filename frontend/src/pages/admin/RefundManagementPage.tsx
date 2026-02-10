import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface RefundRequest {
  id: string;
  bookingReference: string;
  userId: string;
  userName: string;
  userEmail: string;
  pnr: string;
  route: string;
  departureDate: string;
  originalAmount: number;
  penalty: number;
  refundAmount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminRemarks?: string;
}

export default function RefundManagementPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [adjustedRefund, setAdjustedRefund] = useState('');

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockData: RefundRequest[] = [
        {
          id: '1',
          bookingReference: 'BK123456',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          pnr: 'ABC123',
          route: 'JFK → LAX',
          departureDate: '2026-02-15',
          originalAmount: 850,
          penalty: 150,
          refundAmount: 700,
          reason: 'Travel plans changed due to family emergency',
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
        },
        {
          id: '2',
          bookingReference: 'BK123455',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          pnr: 'XYZ789',
          route: 'LAX → NYC',
          departureDate: '2026-03-20',
          originalAmount: 650,
          penalty: 100,
          refundAmount: 550,
          reason: 'Medical reasons',
          status: 'APPROVED',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          processedAt: new Date().toISOString(),
          processedBy: 'Admin',
          adminRemarks: 'Approved as per policy',
        },
      ];
      setRequests(mockData);
    } catch (error) {
      console.error('Failed to fetch refund requests:', error);
      toast.error('Failed to load refund requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (request: RefundRequest, action: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminRemarks('');
    setAdjustedRefund(request.refundAmount.toString());
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    if (actionType === 'REJECT' && !adminRemarks) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    const finalRefund = parseFloat(adjustedRefund);
    if (actionType === 'APPROVE' && (isNaN(finalRefund) || finalRefund < 0)) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      // TODO: API call to process refund request
      // await refundApi.process(selectedRequest.id, {
      //   action: actionType,
      //   refundAmount: finalRefund,
      //   adminRemarks,
      // });

      toast.success(`Refund request ${actionType.toLowerCase()}ed successfully`);
      setShowModal(false);
      fetchRefundRequests();
    } catch (error) {
      console.error('Action error:', error);
      toast.error(`Failed to ${actionType.toLowerCase()} refund request`);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    const matchesSearch =
      req.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.pnr.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { color: 'bg-accent-100 text-primary-950', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      PROCESSED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-primary-950 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading refund requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ref, PNR, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PROCESSED">Processed</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-900">
                {requests.filter((r) => r.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        <div className="card bg-accent-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-900 mb-1">Approved</p>
              <p className="text-3xl font-bold text-primary-950">
                {requests.filter((r) => r.status === 'APPROVED').length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-primary-950" />
          </div>
        </div>
        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Processed</p>
              <p className="text-3xl font-bold text-green-900">
                {requests.filter((r) => r.status === 'PROCESSED').length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="card bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-900">
                {requests.filter((r) => r.status === 'REJECTED').length}
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No refund requests found</p>
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
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.bookingReference}</p>
                        <p className="text-sm text-gray-500">PNR: {request.pnr}</p>
                        <p className="text-sm text-gray-500">{request.route}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.userName}</p>
                        <p className="text-sm text-gray-500">{request.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-500">Original: ${request.originalAmount.toFixed(2)}</p>
                        <p className="text-sm text-red-600">Penalty: -${request.penalty.toFixed(2)}</p>
                        <p className="text-sm font-bold text-green-600">Refund: ${request.refundAmount.toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(request, 'APPROVE')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve Refund"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAction(request, 'REJECT')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject Refund"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Refund Request
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Booking Reference</p>
                  <p className="font-semibold">{selectedRequest.bookingReference}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">PNR</p>
                  <p className="font-semibold">{selectedRequest.pnr}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Customer</p>
                <p className="font-semibold">{selectedRequest.userName}</p>
                <p className="text-sm text-gray-600">{selectedRequest.userEmail}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Flight Details</p>
                <p className="text-sm">
                  <span className="font-medium">Route:</span> {selectedRequest.route}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Departure:</span> {new Date(selectedRequest.departureDate).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-accent-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Amount Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Original Amount:</span>
                    <span className="font-semibold">${selectedRequest.originalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Cancellation Penalty:</span>
                    <span className="font-semibold">-${selectedRequest.penalty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Calculated Refund:</span>
                    <span className="font-bold text-green-600">${selectedRequest.refundAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Cancellation Reason</p>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>

              {actionType === 'APPROVE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Refund Amount (USD) *
                  </label>
                  <input
                    type="number"
                    value={adjustedRefund}
                    onChange={(e) => setAdjustedRefund(e.target.value)}
                    className="input"
                    min="0"
                    max={selectedRequest.originalAmount}
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Adjust if additional penalties or exceptions apply
                  </p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Remarks {actionType === 'REJECT' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                className="input"
                rows={3}
                placeholder={actionType === 'APPROVE' ? 'Add any notes...' : 'Explain reason for rejection...'}
                required={actionType === 'REJECT'}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`btn flex-1 ${
                  actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'
                }`}
                disabled={actionType === 'REJECT' && !adminRemarks}
              >
                {actionType === 'APPROVE' ? 'Approve Refund' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
