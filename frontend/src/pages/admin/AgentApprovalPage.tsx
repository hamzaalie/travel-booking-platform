import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { CheckCircle, XCircle, Clock, Building, Mail, Phone, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentApprovalPage() {
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['allAgents'],
    queryFn: async () => {
      const response: any = await adminApi.getAllAgents();
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (agentId: number) => {
      return await adminApi.approveAgent(String(agentId));
    },
    onSuccess: () => {
      toast.success('Agent approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['allAgents'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve agent');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (agentId: number) => {
      return await adminApi.rejectAgent(String(agentId), 'Rejected by admin');
    },
    onSuccess: () => {
      toast.success('Agent rejected');
      queryClient.invalidateQueries({ queryKey: ['allAgents'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject agent');
    },
  });

  const pendingAgents = agents?.filter((a: any) => a.status === 'PENDING') || [];
  const approvedAgents = agents?.filter((a: any) => a.status === 'APPROVED') || [];
  const rejectedAgents = agents?.filter((a: any) => a.status === 'REJECTED') || [];

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

  const AgentCard = ({ agent }: { agent: any }) => (
    <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Building className="h-6 w-6 text-primary-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{agent.agencyName}</h3>
            <p className="text-sm text-gray-600">
              {agent.user?.firstName} {agent.user?.lastName}
            </p>
          </div>
        </div>
        {getStatusBadge(agent.status)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2" />
          {agent.user?.email}
        </div>
        {agent.user?.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            {agent.user.phone}
          </div>
        )}
        {agent.agencyLicense && (
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-2" />
            License: {agent.agencyLicense}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          Applied: {new Date(agent.createdAt).toLocaleDateString()}
        </div>
      </div>

      {agent.status === 'PENDING' && (
        <div className="flex space-x-2">
          <button
            onClick={() => approveMutation.mutate(agent.id)}
            disabled={approveMutation.isPending}
            className="flex-1 btn btn-success flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </button>
          <button
            onClick={() => rejectMutation.mutate(agent.id)}
            disabled={rejectMutation.isPending}
            className="flex-1 btn btn-danger flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </button>
        </div>
      )}

      {agent.status === 'APPROVED' && agent.wallet && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-800">
            <strong>Wallet Balance:</strong> ${parseFloat(agent.wallet.balance || 0).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Agent Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-700">{pendingAgents.length}</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Approved Agents</h3>
          <p className="text-3xl font-bold text-green-700">{approvedAgents.length}</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-700">{rejectedAgents.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
          <p className="text-gray-600 mt-4">Loading agents...</p>
        </div>
      ) : (
        <>
          {/* Pending Agents */}
          {pendingAgents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pending Approvals ({pendingAgents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingAgents.map((agent: any) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}

          {/* Approved Agents */}
          {approvedAgents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Approved Agents ({approvedAgents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedAgents.map((agent: any) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Agents */}
          {rejectedAgents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Rejected Agents ({rejectedAgents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedAgents.map((agent: any) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}

          {agents?.length === 0 && (
            <div className="card text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No agent applications yet</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
