import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '@/services/api';
import {
  FileText, Upload, CheckCircle, XCircle, Clock, Trash2, Eye, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DOCUMENT_TYPES = [
  { field: 'companyRegistration', label: 'Company Registration', type: 'COMPANY_REGISTRATION', required: true },
  { field: 'tourismCertificate', label: 'Tourism Certificate', type: 'TOURISM_CERTIFICATE', required: true },
  { field: 'panCard', label: 'PAN Card', type: 'PAN_CARD', required: true },
  { field: 'vatCertificate', label: 'VAT Certificate', type: 'VAT_CERTIFICATE', required: true },
  { field: 'citizenshipFront', label: 'Citizenship (Front)', type: 'CITIZENSHIP_FRONT', required: false },
  { field: 'citizenshipBack', label: 'Citizenship (Back)', type: 'CITIZENSHIP_BACK', required: false },
  { field: 'passport', label: 'Passport', type: 'PASSPORT', required: false },
  { field: 'profilePhoto', label: 'Profile Photo', type: 'PROFILE_PHOTO', required: false },
  { field: 'bankStatement', label: 'Bank Statement', type: 'BANK_STATEMENT', required: false },
  { field: 'signature', label: 'Signature', type: 'SIGNATURE', required: false },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3.5 w-3.5" /> Verified
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="h-3.5 w-3.5" /> Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="h-3.5 w-3.5" /> Pending
        </span>
      );
  }
}

export default function AgentDocumentsPage() {
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['agentDocuments'],
    queryFn: async () => {
      const response: any = await agentApi.getDocuments();
      return response.data as any[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['agentProfile'],
    queryFn: async () => {
      const response: any = await agentApi.getProfile();
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ field, file }: { field: string; file: File }) => {
      const formData = new FormData();
      formData.append(field, file);
      return await agentApi.uploadDocuments(formData);
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      setUploadField(null);
      queryClient.invalidateQueries({ queryKey: ['agentDocuments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload document');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await agentApi.deleteDocument(id);
    },
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['agentDocuments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    },
  });

  const handleFileUpload = (field: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }
    uploadMutation.mutate({ field, file });
  };

  const getDocsByType = (type: string) => {
    return documents?.filter((d: any) => d.documentType === type) || [];
  };

  // Count verified, pending, missing required
  const verifiedCount = documents?.filter((d: any) => d.verificationStatus === 'VERIFIED').length || 0;
  const pendingCount = documents?.filter((d: any) => d.verificationStatus === 'PENDING').length || 0;
  const rejectedCount = documents?.filter((d: any) => d.verificationStatus === 'REJECTED').length || 0;
  const requiredTypes = DOCUMENT_TYPES.filter(dt => dt.required).map(dt => dt.type);
  const missingRequired = requiredTypes.filter(type => !documents?.some((d: any) => d.documentType === type));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-1">
            Upload and manage your business documents for verification
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-700">{verifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-blue-700">{documents?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Required Documents Warning */}
      {missingRequired.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">Required Documents Missing</p>
            <p className="text-sm text-orange-700 mt-1">
              Please upload the following required documents: {missingRequired.join(', ').replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      )}

      {/* Agent Info */}
      {profile && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Company:</span>{' '}
              <span className="font-medium">{profile.agencyName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Registration No:</span>{' '}
              <span className="font-medium">{profile.registrationNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">PAN/VAT:</span>{' '}
              <span className="font-medium">{profile.taxVatNumber || profile.panNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>{' '}
              <span className="font-medium">{profile.user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{' '}
              <span className="font-medium">{profile.user?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Address:</span>{' '}
              <span className="font-medium">{profile.address ? `${profile.address}, ${profile.city || ''}` : 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Document Types Grid */}
      <div className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDocs = getDocsByType(docType.type);
          const hasDoc = existingDocs.length > 0;

          return (
            <div key={docType.field} className="card border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasDoc ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-5 w-5 ${hasDoc ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {docType.label}
                      {docType.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {hasDoc ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {existingDocs.map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-2">
                            {getStatusBadge(doc.verificationStatus)}
                            {doc.rejectionReason && (
                              <span className="text-xs text-red-600">
                                Reason: {doc.rejectionReason}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not uploaded yet</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {existingDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-1">
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      {doc.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this document?')) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Upload button - always show for re-upload of rejected or new upload */}
                  {(!hasDoc || existingDocs.some((d: any) => d.verificationStatus === 'REJECTED')) && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.field, file);
                          e.target.value = '';
                        }}
                      />
                      <span className="btn btn-primary flex items-center gap-2 text-sm">
                        <Upload className="h-4 w-4" />
                        {hasDoc ? 'Re-upload' : 'Upload'}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Other Documents */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-3">Upload Other Documents</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload any additional documents not listed above
        </p>
        <label className="cursor-pointer inline-block">
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                Array.from(files).forEach(file => {
                  handleFileUpload('otherDocuments', file);
                });
              }
              e.target.value = '';
            }}
          />
          <span className="btn btn-secondary flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Other Documents
          </span>
        </label>
      </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-lg p-4 max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setPreviewUrl(null)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <img src={previewUrl} alt="Document preview" className="max-w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
