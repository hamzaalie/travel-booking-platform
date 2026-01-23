import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Eye,
  AlertTriangle,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Globe,
  Briefcase,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// API URL - Use environment variable or default to Railway production backend
const API_URL = (import.meta.env.VITE_API_URL || 'https://web-production-b72c0.up.railway.app/api').replace('/api', '');

interface AgentDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface Agent {
  id: string;
  agencyName: string;
  agencyLicense: string | null;
  status: string;
  address: string | null;
  city: string | null;
  country: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  panNumber: string | null;
  secondaryPhone: string | null;
  secondaryEmail: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  businessType: string | null;
  registrationNumber: string | null;
  taxVatNumber: string | null;
  websiteUrl: string | null;
  yearEstablished: number | null;
  numberOfEmployees: number | null;
  monthlyBookingVolume: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  markupType: string | null;
  markupValue: number | null;
  discountType: string | null;
  discountValue: number | null;
  creditLimit: number | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  wallet: {
    balance: number;
    status: string;
  } | null;
  documents: AgentDocument[];
}

export default function AgentDocumentsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch agent details with documents
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agentDetails', agentId],
    queryFn: async () => {
      const response: any = await adminApi.getAgentDetails(agentId!);
      return response.data as Agent;
    },
    enabled: !!agentId,
  });

  // Verify document mutation done already 
  const verifyMutation = useMutation({
    mutationFn: async ({ documentId, action, reason }: { documentId: string; action: 'VERIFIED' | 'REJECTED'; reason?: string }) => {
      return await adminApi.verifyDocument(documentId, action, reason);
    },
    onSuccess: (_, variables) => {
      toast.success(`Document ${variables.action.toLowerCase()} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['agentDetails', agentId] });
      setShowRejectModal(false);
      setRejectingDocId(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update document status');
    },
  });

  const handleVerify = (documentId: string) => {
    verifyMutation.mutate({ documentId, action: 'VERIFIED' });
  };

  const openRejectModal = (documentId: string) => {
    setRejectingDocId(documentId);
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (!rejectingDocId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    verifyMutation.mutate({ documentId: rejectingDocId, action: 'REJECTED', reason: rejectionReason });
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      CITIZENSHIP_FRONT: 'Citizenship (Front)',
      CITIZENSHIP_BACK: 'Citizenship (Back)',
      PASSPORT: 'Passport',
      PAN_CARD: 'PAN Card',
      COMPANY_REGISTRATION: 'Company Registration',
      VAT_CERTIFICATE: 'VAT Certificate',
      TAX_CLEARANCE: 'Tax Clearance',
      BANK_STATEMENT: 'Bank Statement',
      PROFILE_PHOTO: 'Profile Photo',
      SIGNATURE: 'Signature',
      OTHER: 'Other Document',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
    }
  };

  const getFileUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const isImageFile = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Agent not found</h3>
          <Link to="/admin/agents/markup" className="btn btn-primary mt-4">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  const pendingDocs = agent.documents.filter(d => d.verificationStatus === 'PENDING');
  const verifiedDocs = agent.documents.filter(d => d.verificationStatus === 'VERIFIED');
  const rejectedDocs = agent.documents.filter(d => d.verificationStatus === 'REJECTED');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.agencyName}</h1>
            <p className="text-gray-600">Agent Documents & Verification</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingDocs.length > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {pendingDocs.length} pending verification
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agent Info Sidebar */}
        <div className="col-span-1 space-y-6">
          {/* Basic Info Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Contact Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {agent.user.email}
              </div>
              {agent.user.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {agent.user.phone}
                </div>
              )}
              {agent.secondaryPhone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {agent.secondaryPhone} (Secondary)
                </div>
              )}
              {(agent.address || agent.city) && (
                <div className="flex items-start text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <span>{[agent.address, agent.city, agent.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {agent.dateOfBirth && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  DOB: {new Date(agent.dateOfBirth).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Business Info Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary-600" />
              Business Information
            </h3>
            <div className="space-y-3 text-sm">
              {agent.businessType && (
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {agent.businessType.replace('_', ' ')}
                </div>
              )}
              {agent.registrationNumber && (
                <div className="text-gray-600">
                  <span className="font-medium">Reg No:</span> {agent.registrationNumber}
                </div>
              )}
              {agent.taxVatNumber && (
                <div className="text-gray-600">
                  <span className="font-medium">VAT No:</span> {agent.taxVatNumber}
                </div>
              )}
              {agent.panNumber && (
                <div className="text-gray-600">
                  <span className="font-medium">PAN:</span> {agent.panNumber}
                </div>
              )}
              {agent.websiteUrl && (
                <div className="flex items-center text-gray-600">
                  <Globe className="h-4 w-4 mr-2" />
                  <a href={agent.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">
                    {agent.websiteUrl}
                  </a>
                </div>
              )}
              {agent.yearEstablished && (
                <div className="text-gray-600">
                  <span className="font-medium">Est:</span> {agent.yearEstablished}
                </div>
              )}
            </div>
          </div>

          {/* Bank Details Card */}
          {agent.bankName && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
                Bank Details
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><span className="font-medium">Bank:</span> {agent.bankName}</div>
                {agent.bankBranch && <div><span className="font-medium">Branch:</span> {agent.bankBranch}</div>}
                {agent.bankAccountName && <div><span className="font-medium">A/C Name:</span> {agent.bankAccountName}</div>}
                {agent.bankAccountNumber && <div><span className="font-medium">A/C No:</span> {agent.bankAccountNumber}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="col-span-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card bg-yellow-50 border border-yellow-200">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingDocs.length}</p>
                </div>
              </div>
            </div>
            <div className="card bg-green-50 border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-700">Verified</p>
                  <p className="text-2xl font-bold text-green-900">{verifiedDocs.length}</p>
                </div>
              </div>
            </div>
            <div className="card bg-red-50 border border-red-200">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-red-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{rejectedDocs.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
            
            {agent.documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agent.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-lg p-4 ${
                      doc.verificationStatus === 'PENDING' 
                        ? 'border-yellow-200 bg-yellow-50' 
                        : doc.verificationStatus === 'VERIFIED'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          {isImageFile(doc.documentUrl) ? (
                            <img
                              src={getFileUrl(doc.documentUrl)}
                              alt={doc.documentName}
                              className="h-16 w-16 object-cover rounded cursor-pointer"
                              onClick={() => setPreviewUrl(getFileUrl(doc.documentUrl))}
                            />
                          ) : (
                            <FileText className="h-16 w-16 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getDocumentTypeLabel(doc.documentType)}
                          </h4>
                          <p className="text-sm text-gray-600">{doc.documentName}</p>
                          {doc.documentNumber && (
                            <p className="text-sm text-gray-500">Doc No: {doc.documentNumber}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc.verificationStatus)}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPreviewUrl(getFileUrl(doc.documentUrl))}
                            className="p-2 text-gray-600 hover:bg-white rounded-lg"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={getFileUrl(doc.documentUrl)}
                            download
                            className="p-2 text-gray-600 hover:bg-white rounded-lg"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          
                          {doc.verificationStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleVerify(doc.id)}
                                disabled={verifyMutation.isPending}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                title="Verify"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openRejectModal(doc.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </div>
                    )}
                    
                    {doc.verificationStatus === 'VERIFIED' && doc.verifiedAt && (
                      <div className="mt-2 text-xs text-green-700">
                        Verified on {new Date(doc.verifiedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Reject Document</h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input"
                rows={3}
                placeholder="Provide a reason for rejection..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={verifyMutation.isPending || !rejectionReason.trim()}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                {verifyMutation.isPending ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <iframe
                src={previewUrl}
                className="w-[800px] h-[90vh]"
                title="Document Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
