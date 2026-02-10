import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { DollarSign, CheckCircle, XCircle, Clock, Building, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FundRequestsPage() {
  const queryClient = useQueryClient();

  const { data: fundRequests, isLoading } = useQuery({
    queryKey: ['allFundRequests'],
    queryFn: async () => {
      const response: any = await adminApi.getFundRequests();
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await adminApi.approveFundRequest(String(requestId));
    },
    onSuccess: () => {
      toast.success('Fund request approved and wallet credited!');
      queryClient.invalidateQueries({ queryKey: ['allFundRequests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await adminApi.rejectFundRequest(String(requestId), 'Rejected by admin');
    },
    onSuccess: () => {
      toast.success('Fund request rejected');
      queryClient.invalidateQueries({ queryKey: ['allFundRequests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    },
  });

  const pendingRequests = fundRequests?.filter((r: any) => r.status === 'PENDING') || [];
  const approvedRequests = fundRequests?.filter((r: any) => r.status === 'APPROVED') || [];
  const rejectedRequests = fundRequests?.filter((r: any) => r.status === 'REJECTED') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Approved</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Rejected</span>;
      default:
        return null;
    }
  };

  const RequestCard = ({ request }: { request: any }) => (
    <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3">
          <div className="bg-green-100 p-3 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              ${request.amount.toFixed(2)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {request.agent?.agencyName}
            </p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Building className="h-4 w-4 mr-2" />
          Agent: {request.agent?.user?.firstName} {request.agent?.user?.lastName}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FileText className="h-4 w-4 mr-2" />
          Method: {request.paymentMethod?.replace('_', ' ')}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          Requested: {new Date(request.createdAt).toLocaleString()}
        </div>
        {request.notes && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Notes:</strong> {request.notes}
            </p>
          </div>
        )}
      </div>

      {request.status === 'PENDING' && (
        <div className="flex space-x-2">
          <button
            onClick={() => approveMutation.mutate(request.id)}
            disabled={approveMutation.isPending}
            className="flex-1 btn btn-success flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Credit
          </button>
          <button
            onClick={() => rejectMutation.mutate(request.id)}
            disabled={rejectMutation.isPending}
            className="flex-1 btn btn-danger flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </button>
        </div>
      )}

      {request.status === 'APPROVED' && request.approvedAt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-800">
            Approved on {new Date(request.approvedAt).toLocaleString()}
          </p>
        </div>
      )}

      {request.status === 'REJECTED' && request.rejectedAt && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-800">
            Rejected on {new Date(request.rejectedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Fund Requests</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-yellow-700">{pendingRequests.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            Total: ${pendingRequests.reduce((sum: number, r: any) => sum + r.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Approved Requests</h3>
          <p className="text-3xl font-bold text-green-700">{approvedRequests.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            Total: ${approvedRequests.reduce((sum: number, r: any) => sum + r.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-700">{rejectedRequests.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
          <p className="text-gray-600 mt-4">Loading fund requests...</p>
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {/* Approved Requests */}
          {approvedRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Approved Requests ({approvedRequests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedRequests.slice(0, 6).map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Requests */}
          {rejectedRequests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Rejected Requests ({rejectedRequests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedRequests.slice(0, 6).map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {fundRequests?.length === 0 && (
            <div className="card text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No fund requests yet</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
