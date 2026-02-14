import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { 
  Building, 
  Search, 
  Edit, 
  Save, 
  X, 
  Percent, 
  Users,
  TrendingUp,
  FileText,
  Eye,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Agent {
  id: string;
  agencyName: string;
  status: string;
  markupType: 'FIXED' | 'PERCENTAGE' | null;
  markupValue: number | null;
  discountType: 'FIXED' | 'PERCENTAGE' | null;
  discountValue: number | null;
  commissionType: 'FIXED' | 'PERCENTAGE' | null;
  commissionValue: number | null;
  creditLimit: number | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  wallet: {
    balance: number;
    status: string;
  } | null;
  _count: {
    bookings: number;
    documents: number;
  };
}

interface MarkupSettings {
  markupType: 'FIXED' | 'PERCENTAGE' | '';
  markupValue: string;
  discountType: 'FIXED' | 'PERCENTAGE' | '';
  discountValue: string;
  commissionType: 'FIXED' | 'PERCENTAGE' | '';
  commissionValue: string;
  creditLimit: string;
}

export default function AgentMarkupManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('APPROVED');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editSettings, setEditSettings] = useState<MarkupSettings>({
    markupType: '',
    markupValue: '',
    discountType: '',
    discountValue: '',
    commissionType: '',
    commissionValue: '',
    creditLimit: '',
  });
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkSettings, setBulkSettings] = useState<MarkupSettings>({
    markupType: '',
    markupValue: '',
    discountType: '',
    discountValue: '',
    commissionType: '',
    commissionValue: '',
    creditLimit: '',
  });

  // Fetch agents with markup settings
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agentsWithMarkup', statusFilter, searchTerm],
    queryFn: async () => {
      const response: any = await adminApi.getAgentsWithMarkupSettings({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      return response.data as Agent[];
    },
  });

  // Update markup mutation
  const updateMarkupMutation = useMutation({
    mutationFn: async ({ agentId, settings }: { agentId: string; settings: any }) => {
      return await adminApi.updateAgentMarkupSettings(agentId, settings);
    },
    onSuccess: () => {
      toast.success('Markup settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['agentsWithMarkup'] });
      setEditingAgentId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update markup settings');
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { agentIds: string[]; settings: any }) => {
      return await adminApi.bulkUpdateAgentMarkupSettings(data.agentIds, data.settings);
    },
    onSuccess: (data: any) => {
      toast.success(`Markup settings updated for ${data.data?.updatedCount || selectedAgents.length} agents`);
      queryClient.invalidateQueries({ queryKey: ['agentsWithMarkup'] });
      setSelectedAgents([]);
      setShowBulkEdit(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to bulk update markup settings');
    },
  });

  const startEditing = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setEditSettings({
      markupType: agent.markupType || '',
      markupValue: agent.markupValue?.toString() || '',
      discountType: agent.discountType || '',
      discountValue: agent.discountValue?.toString() || '',
      commissionType: agent.commissionType || '',
      commissionValue: agent.commissionValue?.toString() || '',
      creditLimit: agent.creditLimit?.toString() || '',
    });
  };

  const cancelEditing = () => {
    setEditingAgentId(null);
    setEditSettings({
      markupType: '',
      markupValue: '',
      discountType: '',
      discountValue: '',
      commissionType: '',
      commissionValue: '',
      creditLimit: '',
    });
  };

  const saveMarkupSettings = (agentId: string) => {
    const settings: any = {};
    
    if (editSettings.markupType) {
      settings.markupType = editSettings.markupType;
      settings.markupValue = parseFloat(editSettings.markupValue) || 0;
    }
    if (editSettings.discountType) {
      settings.discountType = editSettings.discountType;
      settings.discountValue = parseFloat(editSettings.discountValue) || 0;
    }
    if (editSettings.commissionType) {
      settings.commissionType = editSettings.commissionType;
      settings.commissionValue = parseFloat(editSettings.commissionValue) || 0;
    }
    if (editSettings.creditLimit) {
      settings.creditLimit = parseFloat(editSettings.creditLimit);
    }

    updateMarkupMutation.mutate({ agentId, settings });
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAgents.length === agents?.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents?.map(a => a.id) || []);
    }
  };

  const applyBulkUpdate = () => {
    const settings: any = {};
    
    if (bulkSettings.markupType) {
      settings.markupType = bulkSettings.markupType;
      settings.markupValue = parseFloat(bulkSettings.markupValue) || 0;
    }
    if (bulkSettings.discountType) {
      settings.discountType = bulkSettings.discountType;
      settings.discountValue = parseFloat(bulkSettings.discountValue) || 0;
    }

    bulkUpdateMutation.mutate({ agentIds: selectedAgents, settings });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>;
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Suspended</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return `NPR ${value.toLocaleString()}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Markup & Discount Management</h1>
        <p className="text-gray-600">Manage individual markup, discount, and commission settings for each agent</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-accent-50 border border-accent-200">
          <div className="flex items-center">
            <Users className="h-10 w-10 text-primary-950 mr-3" />
            <div>
              <p className="text-sm text-primary-950">Total Agents</p>
              <p className="text-2xl font-bold text-primary-950">{agents?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-10 w-10 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">With Markup</p>
              <p className="text-2xl font-bold text-green-900">
                {agents?.filter(a => a.markupType).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-accent-50 border border-accent-200">
          <div className="flex items-center">
            <Percent className="h-10 w-10 text-accent-500 mr-3" />
            <div>
              <p className="text-sm text-accent-500">With Discount</p>
              <p className="text-2xl font-bold text-primary-950">
                {agents?.filter(a => a.discountType).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border border-orange-200">
          <div className="flex items-center">
            <TrendingUp className="h-10 w-10 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-600">Total Bookings</p>
              <p className="text-2xl font-bold text-orange-900">
                {agents?.reduce((sum, a) => sum + a._count.bookings, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-40"
            >
              <option value="">All Status</option>
              <option value="APPROVED">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {selectedAgents.length > 0 && (
            <button
              onClick={() => setShowBulkEdit(true)}
              className="btn btn-primary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Bulk Edit ({selectedAgents.length} selected)
            </button>
          )}
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Bulk Update Markup</h2>
              <button onClick={() => setShowBulkEdit(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Update markup settings for {selectedAgents.length} selected agents
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Markup Type</label>
                <select
                  value={bulkSettings.markupType}
                  onChange={(e) => setBulkSettings({ ...bulkSettings, markupType: e.target.value as any })}
                  className="input"
                >
                  <option value="">No Change</option>
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>

              {bulkSettings.markupType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Markup Value {bulkSettings.markupType === 'PERCENTAGE' ? '(%)' : '(NPR)'}
                  </label>
                  <input
                    type="number"
                    value={bulkSettings.markupValue}
                    onChange={(e) => setBulkSettings({ ...bulkSettings, markupValue: e.target.value })}
                    className="input"
                    min="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  value={bulkSettings.discountType}
                  onChange={(e) => setBulkSettings({ ...bulkSettings, discountType: e.target.value as any })}
                  className="input"
                >
                  <option value="">No Change</option>
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>

              {bulkSettings.discountType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value {bulkSettings.discountType === 'PERCENTAGE' ? '(%)' : '(NPR)'}
                  </label>
                  <input
                    type="number"
                    value={bulkSettings.discountValue}
                    onChange={(e) => setBulkSettings({ ...bulkSettings, discountValue: e.target.value })}
                    className="input"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkUpdate}
                disabled={bulkUpdateMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {bulkUpdateMutation.isPending ? 'Applying...' : 'Apply to All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agents Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-950"></div>
          </div>
        ) : agents?.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No agents found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAgents.length === agents?.length && agents.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Agent</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Markup</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Commission</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Credit Limit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Wallet</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents?.map((agent) => (
                  <tr key={agent.id} className={selectedAgents.includes(agent.id) ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent.id)}
                        onChange={() => handleSelectAgent(agent.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{agent.agencyName}</div>
                        <div className="text-sm text-gray-500">{agent.user.email}</div>
                        <div className="text-xs text-gray-400">
                          {agent._count.bookings} bookings | {agent._count.documents} docs
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(agent.status)}</td>
                    
                    {editingAgentId === agent.id ? (
                      <>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <select
                              value={editSettings.markupType}
                              onChange={(e) => setEditSettings({ ...editSettings, markupType: e.target.value as any })}
                              className="input text-xs py-1 px-2 w-20"
                            >
                              <option value="">None</option>
                              <option value="FIXED">Fixed</option>
                              <option value="PERCENTAGE">%</option>
                            </select>
                            {editSettings.markupType && (
                              <input
                                type="number"
                                value={editSettings.markupValue}
                                onChange={(e) => setEditSettings({ ...editSettings, markupValue: e.target.value })}
                                className="input text-xs py-1 px-2 w-16"
                                min="0"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <select
                              value={editSettings.discountType}
                              onChange={(e) => setEditSettings({ ...editSettings, discountType: e.target.value as any })}
                              className="input text-xs py-1 px-2 w-20"
                            >
                              <option value="">None</option>
                              <option value="FIXED">Fixed</option>
                              <option value="PERCENTAGE">%</option>
                            </select>
                            {editSettings.discountType && (
                              <input
                                type="number"
                                value={editSettings.discountValue}
                                onChange={(e) => setEditSettings({ ...editSettings, discountValue: e.target.value })}
                                className="input text-xs py-1 px-2 w-16"
                                min="0"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <select
                              value={editSettings.commissionType}
                              onChange={(e) => setEditSettings({ ...editSettings, commissionType: e.target.value as any })}
                              className="input text-xs py-1 px-2 w-20"
                            >
                              <option value="">None</option>
                              <option value="FIXED">Fixed</option>
                              <option value="PERCENTAGE">%</option>
                            </select>
                            {editSettings.commissionType && (
                              <input
                                type="number"
                                value={editSettings.commissionValue}
                                onChange={(e) => setEditSettings({ ...editSettings, commissionValue: e.target.value })}
                                className="input text-xs py-1 px-2 w-16"
                                min="0"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            value={editSettings.creditLimit}
                            onChange={(e) => setEditSettings({ ...editSettings, creditLimit: e.target.value })}
                            className="input text-xs py-1 px-2 w-24"
                            placeholder="Limit"
                            min="0"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4">
                          {agent.markupType ? (
                            <span className="inline-flex items-center text-sm">
                              {agent.markupType === 'FIXED' ? (
                                <span className="text-xs font-medium mr-1 text-gray-400">NPR</span>
                              ) : (
                                <Percent className="h-3 w-3 mr-1 text-gray-400" />
                              )}
                              {agent.markupValue}
                              {agent.markupType === 'PERCENTAGE' && '%'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {agent.discountType ? (
                            <span className="inline-flex items-center text-sm text-green-600">
                              {agent.discountType === 'FIXED' ? (
                                <span className="text-xs font-medium mr-1">NPR</span>
                              ) : (
                                <Percent className="h-3 w-3 mr-1" />
                              )}
                              {agent.discountValue}
                              {agent.discountType === 'PERCENTAGE' && '%'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {agent.commissionType ? (
                            <span className="inline-flex items-center text-sm text-accent-500">
                              {agent.commissionType === 'FIXED' ? (
                                <span className="text-xs font-medium mr-1">NPR</span>
                              ) : (
                                <Percent className="h-3 w-3 mr-1" />
                              )}
                              {agent.commissionValue}
                              {agent.commissionType === 'PERCENTAGE' && '%'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {agent.creditLimit ? formatCurrency(agent.creditLimit) : '-'}
                        </td>
                      </>
                    )}
                    
                    <td className="px-4 py-4 text-sm">
                      {agent.wallet ? (
                        <span className={agent.wallet.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(agent.wallet.balance)}
                        </span>
                      ) : '-'}
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {editingAgentId === agent.id ? (
                          <>
                            <button
                              onClick={() => saveMarkupSettings(agent.id)}
                              disabled={updateMarkupMutation.isPending}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(agent)}
                              className="p-1 text-primary-950 hover:bg-accent-50 rounded"
                              title="Edit Markup"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/admin/agents/${agent.id}/documents`}
                              className="p-1 text-accent-500 hover:bg-accent-50 rounded"
                              title="View Documents"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/admin/agents/${agent.id}`}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
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
    </div>
  );
}
