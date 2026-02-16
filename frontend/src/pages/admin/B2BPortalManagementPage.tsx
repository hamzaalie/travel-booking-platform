import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminExtendedApi, adminApi } from '@/services/api';
import {
  Building2,
  Search,
  Eye,
  FileCheck,
  LogIn,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronDown,
  ChevronUp,
  Ban,
  DollarSign,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AgentDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt: string | null;
  rejectionReason: string | null;
}


const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Ban },
};

const DOC_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
};

const REQUIRED_DOCUMENTS = [
  { type: 'COMPANY_REGISTRATION', label: 'Company Registration', description: 'Official business registration certificate' },
  { type: 'TOURISM_CERTIFICATE', label: 'Tourism Certificate', description: 'Tourism board license/certificate' },
  { type: 'PAN_VAT', label: 'PAN/VAT Certificate', description: 'Tax registration document' },
  { type: 'COMPANY_PROFILE', label: 'Company Name / Profile', description: 'Company name and business profile' },
  { type: 'CONTACT_DETAILS', label: 'Contact Number and Email', description: 'Official contact information' },
  { type: 'OFFICE_ADDRESS', label: 'Office Location Address', description: 'Physical office address with proof' },
];

export default function B2BPortalManagementPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'documents' | 'wallet' | 'settings'>('info');

  // Fetch B2B users
  const { data, isLoading } = useQuery({
    queryKey: ['b2b-portal', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response: any = await adminExtendedApi.getB2BUsers(params);
      // response.data = { success, data: { agents, total, page, totalPages } }
      return response.data?.data || response.data || {};
    },
  });

  // Approve agent
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-portal'] });
      toast.success('Agent approved successfully');
    },
    onError: () => toast.error('Failed to approve agent'),
  });

  // Reject agent
  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectAgent(id, 'Rejected by admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-portal'] });
      toast.success('Agent rejected');
    },
    onError: () => toast.error('Failed to reject agent'),
  });

  // Verify document
  const verifyDocMutation = useMutation({
    mutationFn: ({ docId, status, reason }: { docId: string; status: string; reason?: string }) =>
      adminApi.verifyDocument(docId, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-portal'] });
      toast.success('Document verification updated');
    },
    onError: () => toast.error('Failed to verify document'),
  });

  // Direct login as agent
  const loginAsAgentMutation = useMutation({
    mutationFn: (userId: string) =>
      adminApi.loginAsUser(userId),
    onSuccess: (data: any) => {
      // Store the admin's token and user data temporarily
      const adminToken = localStorage.getItem('accessToken');
      const adminUser = localStorage.getItem('user');
      localStorage.setItem('adminReturnToken', adminToken || '');
      localStorage.setItem('adminReturnUser', adminUser || '');
      // Set agent's token and user data
      localStorage.setItem('accessToken', data.data?.accessToken || '');
      if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      toast.success('Logged in as agent - you can switch back from the header');
      window.location.href = '/agent';
    },
    onError: () => toast.error('Failed to login as agent'),
  });

  const agents = data?.agents || data?.users || [];
  const total = data?.total || agents.length;

  const stats = {
    total: total,
    approved: agents.filter((a: any) => a.status === 'APPROVED').length,
    pending: agents.filter((a: any) => a.status === 'PENDING').length,
    suspended: agents.filter((a: any) => a.status === 'SUSPENDED').length,
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading B2B portal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">B2B Portal Management</h1>
          <p className="text-gray-600 mt-1">Manage B2B agents, documents, wallet, and direct login access</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary-950" />
            <div>
              <p className="text-sm text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-primary-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <Ban className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-red-700">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Required Documents Checklist */}
      <div className="card border-accent-200 bg-accent-50/50">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary-950" />
          Required Documents for B2B Agent Registration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REQUIRED_DOCUMENTS.map((doc, idx) => (
            <div key={doc.type} className="bg-white rounded-lg border p-3 flex items-start gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-950 text-white text-xs font-bold">{idx + 1}</span>
              <div>
                <p className="font-medium text-sm text-gray-900">{doc.label}</p>
                <p className="text-xs text-gray-500">{doc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, agency..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`px-3 py-2 text-sm rounded-lg font-medium ${
                  statusFilter === status ? 'bg-primary-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-4">
        {agents.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No agents found</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        )}
        {agents.map((agent: any) => {
          const isExpanded = expandedAgent === agent.id;
          const agentStatus = agent.status || (agent.user?.isActive ? 'APPROVED' : 'PENDING');
          const statusStyle = STATUS_STYLES[agentStatus] || STATUS_STYLES.PENDING;
          const StatusIcon = statusStyle.icon;
          // Agent data may have user nested or flattened depending on source
          const firstName = agent.user?.firstName || agent.firstName || '';
          const lastName = agent.user?.lastName || agent.lastName || '';
          const email = agent.user?.email || agent.email || '';
          const phone = agent.user?.phone || agent.phone || '';
          const userId = agent.user?.id || agent.userId || agent.id;
          const companyName = agent.agencyName || agent.companyName || '';

          return (
            <div key={agent.id} className="card border-2 hover:shadow-md transition-shadow">
              {/* Agent Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-950" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {firstName} {lastName}
                      {companyName && <span className="text-gray-500 text-sm font-normal ml-2">({companyName})</span>}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>
                      {phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    <StatusIcon className="h-4 w-4" />
                    {agentStatus}
                  </span>
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => navigate(`/admin/agents/${agent.id}/documents`)}
                  className="btn btn-outline text-sm flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  View Documents
                </button>
                <button
                  onClick={() => navigate(`/admin/wallets?agentId=${agent.id}`)}
                  className="btn btn-outline text-sm flex items-center gap-1"
                >
                  <Wallet className="h-4 w-4" />
                  Wallet
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Login as ${firstName} ${lastName}? You'll be redirected to their portal.`)) {
                      loginAsAgentMutation.mutate(userId);
                    }
                  }}
                  className="btn btn-outline text-sm flex items-center gap-1 text-accent-600 border-accent-200 hover:bg-accent-50"
                >
                  <LogIn className="h-4 w-4" />
                  Direct Login
                </button>
                {agentStatus === 'PENDING' && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(agent.id)}
                      className="btn btn-primary text-sm flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(agent.id)}
                      className="btn btn-outline text-sm flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-2">
                    {(['info', 'documents', 'wallet', 'settings'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveDetailTab(tab)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                          activeDetailTab === tab ? 'bg-primary-950 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Info Tab */}
                  {activeDetailTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Business Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-500">Company:</span> <span className="font-medium">{companyName || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Registration #:</span> <span className="font-medium">{agent.registrationNumber || agent.panNumber || 'N/A'}</span></div>
                          <div><span className="text-gray-500">PAN/VAT:</span> <span className="font-medium">{agent.panVatNumber || agent.panNumber || 'N/A'}</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Contact & Location
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{email}</span></div>
                          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{phone || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Address:</span> <span className="font-medium">{agent.companyAddress || agent.officeAddress || 'N/A'}</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> Financial
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-500">Markup:</span> <span className="font-medium">{agent.markupPercentage || agent.markupValue || 0}%</span></div>
                          <div><span className="text-gray-500">Credit Limit:</span> <span className="font-medium">NPR {(agent.creditLimit || 0).toLocaleString()}</span></div>
                          <div><span className="text-gray-500">Bookings:</span> <span className="font-medium">{agent._count?.bookings || agent.totalBookings || 0}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeDetailTab === 'documents' && (
                    <div>
                      <h4 className="font-medium mb-3">Required Documents Verification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {REQUIRED_DOCUMENTS.map((reqDoc) => {
                          const uploaded = agent.documents?.find((d: AgentDocument) => d.documentType === reqDoc.type);
                          return (
                            <div key={reqDoc.type} className={`border rounded-lg p-4 ${uploaded ? 'border-gray-200' : 'border-dashed border-orange-300 bg-orange-50/50'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{reqDoc.label}</p>
                                  <p className="text-xs text-gray-500">{reqDoc.description}</p>
                                </div>
                                {uploaded ? (
                                  <span className={`text-xs px-2 py-1 rounded-full ${DOC_STATUS_STYLES[uploaded.verificationStatus]?.bg} ${DOC_STATUS_STYLES[uploaded.verificationStatus]?.text}`}>
                                    {uploaded.verificationStatus}
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">Not Uploaded</span>
                                )}
                              </div>
                              {uploaded && (
                                <div className="mt-3 flex gap-2">
                                  <a
                                    href={uploaded.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline text-xs px-2 py-1 flex items-center gap-1"
                                  >
                                    <Eye className="h-3 w-3" /> View
                                  </a>
                                  {uploaded.verificationStatus === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => verifyDocMutation.mutate({ docId: uploaded.id, status: 'VERIFIED' })}
                                        className="btn btn-primary text-xs px-2 py-1 flex items-center gap-1"
                                      >
                                        <CheckCircle className="h-3 w-3" /> Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          const reason = prompt('Rejection reason:');
                                          if (reason) verifyDocMutation.mutate({ docId: uploaded.id, status: 'REJECTED', reason });
                                        }}
                                        className="btn btn-outline text-xs px-2 py-1 flex items-center gap-1 text-red-600"
                                      >
                                        <XCircle className="h-3 w-3" /> Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Wallet Tab */}
                  {activeDetailTab === 'wallet' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-600">Balance</p>
                          <p className="text-2xl font-bold text-green-700">NPR {(agent.walletBalance || agent.creditBalance || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-primary-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-600">Credit Limit</p>
                          <p className="text-2xl font-bold text-primary-900">NPR {(agent.creditLimit || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-600">Wallet Status</p>
                          <p className={`text-xl font-bold ${agent.walletStatus === 'FROZEN' ? 'text-red-600' : 'text-green-600'}`}>
                            {agent.walletStatus || 'ACTIVE'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Full wallet transaction history is available in the{' '}
                        <a href="/admin/fund-requests" className="text-primary-600 underline">Fund Requests</a> section.
                      </p>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeDetailTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Percent className="h-4 w-4" /> Markup & Commission Settings
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Markup Type:</span>
                            <span className="font-medium">{agent.markupType || 'PERCENTAGE'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Markup Value:</span>
                            <span className="font-medium">{agent.markupPercentage || agent.markupValue || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Commission Type:</span>
                            <span className="font-medium">{agent.commissionType || 'PERCENTAGE'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Commission Value:</span>
                            <span className="font-medium">{agent.commissionValue || 0}%</span>
                          </div>
                        </div>
                        <a
                          href="/admin/agents/markup"
                          className="btn btn-outline text-sm mt-3 w-full text-center"
                        >
                          Manage Markup Settings
                        </a>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Access & Permissions
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Account Status:</span>
                            <span className={`font-medium ${agent.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Joined:</span>
                            <span className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Can Book Flights:</span>
                            <span className="font-medium text-green-600">Yes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Can Book Hotels:</span>
                            <span className="font-medium text-green-600">Yes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-outline text-sm"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= Math.ceil(total / 20)}
            className="btn btn-outline text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
