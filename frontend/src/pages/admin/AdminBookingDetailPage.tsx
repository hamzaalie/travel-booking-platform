import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, adminApi } from '@/services/api';
import {
  Plane,
  Calendar,
  Users,
  CreditCard,
  FileText,
  ArrowLeft,
  XCircle,
  Download,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Ban,
  Edit,
  Send,
  Printer,
  Shield,
  User,
  Mail,
  Phone,
  Building2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChangeFlightForm {
  requestType: string;
  reason: string;
  newDepartureDate: string;
  newDestination: string;
  adminNotes: string;
}

interface RefundForm {
  reason: string;
  penaltyAmount: number;
  penaltyType: 'PERCENTAGE' | 'FIXED';
  penaltyValue: number;
  adminNotes: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', icon: Clock, label: 'Pending' },
  CONFIRMED: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle, label: 'Confirmed' },
  TICKETED: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: FileText, label: 'Ticketed' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: XCircle, label: 'Cancelled' },
  REFUNDED: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: RotateCcw, label: 'Refunded' },
  FAILED: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', icon: AlertTriangle, label: 'Failed' },
};

const PENALTY_RULES = [
  { label: 'No Penalty (Full Refund)', percentage: 0 },
  { label: 'Light Penalty (10%)', percentage: 10 },
  { label: 'Standard Penalty (25%)', percentage: 25 },
  { label: 'High Penalty (50%)', percentage: 50 },
  { label: 'Severe Penalty (75%)', percentage: 75 },
  { label: 'Non-Refundable (100%)', percentage: 100 },
];

const triggerBlobDownload = (data: any, filename: string) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function AdminBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>('details');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeFlightModal, setShowChangeFlightModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [expandedPassenger, setExpandedPassenger] = useState<number | null>(null);

  const [changeFlightForm, setChangeFlightForm] = useState<ChangeFlightForm>({
    requestType: 'DATE_CHANGE',
    reason: '',
    newDepartureDate: '',
    newDestination: '',
    adminNotes: '',
  });

  const [refundForm, setRefundForm] = useState<RefundForm>({
    reason: '',
    penaltyAmount: 0,
    penaltyType: 'PERCENTAGE',
    penaltyValue: 0,
    adminNotes: '',
  });

  // Fetch booking details (backend allows SUPER_ADMIN access)
  const { data: booking, isLoading } = useQuery({
    queryKey: ['admin-booking', id],
    queryFn: async () => {
      const response: any = await bookingApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Cancel booking
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await bookingApi.cancel(id!, cancelReason);
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-booking', id] });
      setShowCancelModal(false);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    },
  });

  // Change booking status
  const statusMutation = useMutation({
    mutationFn: async () => {
      return await adminApi.updateBookingStatus(id!, { status: newStatus, note: statusNote });
    },
    onSuccess: () => {
      toast.success(`Booking status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-booking', id] });
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNote('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Initiate refund
  const refundMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = Number(booking?.totalAmount || booking?.totalPrice || 0);
      let penaltyAmt = 0;
      if (refundForm.penaltyType === 'PERCENTAGE') {
        penaltyAmt = (totalAmount * refundForm.penaltyValue) / 100;
      } else {
        penaltyAmt = refundForm.penaltyValue;
      }
      const refundAmount = Math.max(0, totalAmount - penaltyAmt);

      return await adminApi.initiateRefund(id!, {
        reason: refundForm.reason,
        penaltyAmount: penaltyAmt,
        refundAmount,
        adminNotes: refundForm.adminNotes,
      });
    },
    onSuccess: () => {
      toast.success('Refund initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-booking', id] });
      setShowRefundModal(false);
      setRefundForm({ reason: '', penaltyAmount: 0, penaltyType: 'PERCENTAGE', penaltyValue: 0, adminNotes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initiate refund');
    },
  });

  // Submit flight change request
  const changeFlightMutation = useMutation({
    mutationFn: async () => {
      return await adminApi.createFlightChangeRequest(id!, {
        requestType: changeFlightForm.requestType,
        reason: changeFlightForm.reason,
        requestedChanges: {
          newDepartureDate: changeFlightForm.newDepartureDate,
          newDestination: changeFlightForm.newDestination,
        },
        adminNotes: changeFlightForm.adminNotes,
      });
    },
    onSuccess: () => {
      toast.success('Flight change request created');
      queryClient.invalidateQueries({ queryKey: ['admin-booking', id] });
      setShowChangeFlightModal(false);
      setChangeFlightForm({ requestType: 'DATE_CHANGE', reason: '', newDepartureDate: '', newDestination: '', adminNotes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create change request');
    },
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </span>
    );
  };

  const totalAmount = Number(booking?.totalAmount || booking?.totalPrice || 0);
  const baseFare = Number(booking?.baseFare || booking?.basePrice || 0);
  const taxes = Number(booking?.taxes || 0);
  const markup = Number(booking?.markup || 0);
  const agentMarkup = Number(booking?.agentMarkup || 0);
  const commission = Number(booking?.commissionAmount || 0);

  const calculatedRefund = (() => {
    if (refundForm.penaltyType === 'PERCENTAGE') {
      return Math.max(0, totalAmount - (totalAmount * refundForm.penaltyValue) / 100);
    }
    return Math.max(0, totalAmount - refundForm.penaltyValue);
  })();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        <p className="text-gray-600 mt-4">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Booking not found</p>
        <button onClick={() => navigate('/admin/bookings')} className="btn btn-primary">
          Back to Bookings
        </button>
      </div>
    );
  }

  const flight = booking.flightDetails as any;
  const passengers = (booking.passengers as any[]) || [];
  const payments = booking.payments || [];
  const refunds = booking.refunds || [];
  const changeRequests = booking.changeRequests || [];
  const bookingStatus = booking.status;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/admin/bookings')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              {getStatusBadge(bookingStatus)}
            </div>
            <p className="text-gray-500 mt-1">
              Ref: <span className="font-mono font-semibold text-gray-700">{booking.bookingReference}</span>
              {booking.pnr && (
                <span className="ml-3">PNR: <span className="font-mono font-semibold text-gray-700">{booking.pnr}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                toast.loading('Generating ticket...', { id: 'ticket-dl' });
                const response = await bookingApi.downloadTicket(id!) as any;
                triggerBlobDownload(response, `ticket-${booking?.bookingReference || id}.pdf`);
                toast.success('Ticket downloaded!', { id: 'ticket-dl' });
              } catch {
                toast.error('Failed to download ticket', { id: 'ticket-dl' });
              }
            }}
            className="btn btn-secondary text-sm flex items-center gap-1.5"
            title="Download E-Ticket"
          >
            <Download className="h-4 w-4" />
            E-Ticket
          </button>
          <button
            onClick={async () => {
              try {
                toast.loading('Generating invoice...', { id: 'invoice-dl' });
                const response = await bookingApi.downloadInvoice(id!) as any;
                triggerBlobDownload(response, `invoice-${booking?.bookingReference || id}.pdf`);
                toast.success('Invoice downloaded!', { id: 'invoice-dl' });
              } catch {
                toast.error('Failed to download invoice', { id: 'invoice-dl' });
              }
            }}
            className="btn btn-secondary text-sm flex items-center gap-1.5"
            title="Download Invoice"
          >
            <Printer className="h-4 w-4" />
            Invoice
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'details', label: 'Booking Details', icon: FileText },
            { key: 'actions', label: 'Manage & Actions', icon: Shield },
            { key: 'history', label: 'History & Logs', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-950 text-primary-950'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Booking Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Information */}
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary-950" />
                Flight Information
              </h2>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{flight?.origin || booking.origin}</p>
                    <p className="text-sm text-gray-500 mt-1">{flight?.originCity || 'Departure'}</p>
                    {flight?.departureTime && (
                      <p className="text-sm font-medium text-gray-700 mt-1">{flight.departureTime}</p>
                    )}
                  </div>
                  <div className="flex-1 px-6">
                    <div className="flex items-center">
                      <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                      <Plane className="h-5 w-5 text-primary-950 mx-3 transform rotate-90" />
                      <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-1">
                      {flight?.duration || booking.tripType?.replace('_', ' ')}
                    </p>
                    {flight?.airline && (
                      <p className="text-center text-xs font-medium text-gray-600">
                        {flight.airline} {flight.flightNumber && `• ${flight.flightNumber}`}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{flight?.destination || booking.destination}</p>
                    <p className="text-sm text-gray-500 mt-1">{flight?.destinationCity || 'Arrival'}</p>
                    {flight?.arrivalTime && (
                      <p className="text-sm font-medium text-gray-700 mt-1">{flight.arrivalTime}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="text-sm font-medium">
                      {booking.departureDate
                        ? new Date(booking.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {booking.returnDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Return</p>
                      <p className="text-sm font-medium">
                        {new Date(booking.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Passengers</p>
                    <p className="text-sm font-medium">{passengers.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Trip Type</p>
                    <p className="text-sm font-medium">{booking.tripType?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {booking.pnr && (
                <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-700 font-medium">PNR (Passenger Name Record)</p>
                    <p className="text-lg font-bold text-primary-900 font-mono">{booking.pnr}</p>
                  </div>
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
              )}
            </div>

            {/* Passenger Information */}
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-950" />
                Passengers ({passengers.length})
              </h2>
              <div className="space-y-3">
                {passengers.map((pax: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedPassenger(expandedPassenger === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-950" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">
                            {pax.title || ''} {pax.firstName} {pax.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{pax.type || 'Adult'} • Passenger {idx + 1}</p>
                        </div>
                      </div>
                      {expandedPassenger === idx ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedPassenger === idx && (
                      <div className="px-4 pb-4 border-t bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 text-sm">
                          {pax.dateOfBirth && (
                            <div>
                              <span className="text-gray-500">Date of Birth</span>
                              <p className="font-medium">{new Date(pax.dateOfBirth).toLocaleDateString()}</p>
                            </div>
                          )}
                          {pax.gender && (
                            <div>
                              <span className="text-gray-500">Gender</span>
                              <p className="font-medium">{pax.gender === 'M' ? 'Male' : pax.gender === 'F' ? 'Female' : pax.gender}</p>
                            </div>
                          )}
                          {pax.nationality && (
                            <div>
                              <span className="text-gray-500">Nationality</span>
                              <p className="font-medium">{pax.nationality}</p>
                            </div>
                          )}
                          {pax.passportNumber && (
                            <div>
                              <span className="text-gray-500">Passport No.</span>
                              <p className="font-medium font-mono">{pax.passportNumber}</p>
                            </div>
                          )}
                          {pax.passportExpiry && (
                            <div>
                              <span className="text-gray-500">Passport Expiry</span>
                              <p className="font-medium">{new Date(pax.passportExpiry).toLocaleDateString()}</p>
                            </div>
                          )}
                          {pax.email && (
                            <div>
                              <span className="text-gray-500">Email</span>
                              <p className="font-medium">{pax.email}</p>
                            </div>
                          )}
                          {pax.phone && (
                            <div>
                              <span className="text-gray-500">Phone</span>
                              <p className="font-medium">{pax.phone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Right 1/3 */}
          <div className="space-y-6">
            {/* Customer / Agent Info */}
            <div className="card">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-950" />
                {booking.agent ? 'Agent & Customer' : 'Customer'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{booking.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{booking.user?.firstName} {booking.user?.lastName}</span>
                </div>
                {booking.user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{booking.user.phone}</span>
                  </div>
                )}
                {booking.agent && (
                  <>
                    <div className="border-t my-2"></div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{booking.agent.agencyName || 'B2B Agent'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{booking.agent.user?.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="card">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-950" />
                Price Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium">NPR {baseFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-medium">NPR {taxes.toLocaleString()}</span>
                </div>
                {markup > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Markup</span>
                    <span className="font-medium">NPR {markup.toLocaleString()}</span>
                  </div>
                )}
                {agentMarkup > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Markup</span>
                    <span className="font-medium">NPR {agentMarkup.toLocaleString()}</span>
                  </div>
                )}
                {commission > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Commission</span>
                    <span className="font-medium">NPR {commission.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="text-base font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-primary-900">NPR {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="card">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary-950" />
                Payment Info
              </h3>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Gateway</span>
                        <span className="font-medium">{payment.gateway?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Status</span>
                        <span className={`font-medium ${payment.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium">NPR {Number(payment.amount || 0).toLocaleString()}</span>
                      </div>
                      {payment.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Txn ID</span>
                          <span className="font-mono text-xs">{payment.transactionId}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No payment records</p>
              )}
            </div>

            {/* Booking Timeline */}
            <div className="card">
              <h3 className="text-lg font-bold mb-3">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Booking Created</p>
                    <p className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {booking.confirmedAt && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Confirmed</p>
                      <p className="text-xs text-gray-500">{new Date(booking.confirmedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {(booking.cancellationData as any)?.cancelledAt && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cancelled</p>
                      <p className="text-xs text-gray-500">
                        {new Date((booking.cancellationData as any).cancelledAt).toLocaleString()}
                      </p>
                      {(booking.cancellationData as any)?.reason && (
                        <p className="text-xs text-red-600 mt-0.5">Reason: {(booking.cancellationData as any).reason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Manage & Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Manage Ticket */}
            <div className="card border-2 border-blue-100 hover:border-blue-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold">Manage Ticket</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Download e-ticket, invoice, or resend to customer</p>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      toast.loading('Generating ticket...', { id: 'ticket-dl' });
                      const response = await bookingApi.downloadTicket(id!) as any;
                      triggerBlobDownload(response, `ticket-${booking?.bookingReference || id}.pdf`);
                      toast.success('Ticket downloaded!', { id: 'ticket-dl' });
                    } catch {
                      toast.error('Failed to download ticket', { id: 'ticket-dl' });
                    }
                  }}
                  className="w-full btn btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download E-Ticket
                </button>
                <button
                  onClick={async () => {
                    try {
                      toast.loading('Generating invoice...', { id: 'invoice-dl' });
                      const response = await bookingApi.downloadInvoice(id!) as any;
                      triggerBlobDownload(response, `invoice-${booking?.bookingReference || id}.pdf`);
                      toast.success('Invoice downloaded!', { id: 'invoice-dl' });
                    } catch {
                      toast.error('Failed to download invoice', { id: 'invoice-dl' });
                    }
                  }}
                  className="w-full btn btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Download Invoice
                </button>
                <button
                  onClick={() => {
                    toast.promise(
                      adminApi.resendTicketEmail(id!),
                      {
                        loading: 'Sending ticket email...',
                        success: 'Ticket email sent to customer',
                        error: 'Failed to send email',
                      }
                    );
                  }}
                  className="w-full btn btn-outline text-sm flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Resend Ticket Email
                </button>
              </div>
            </div>

            {/* Change Flight */}
            <div className="card border-2 border-orange-100 hover:border-orange-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold">Change Flight</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Change date, route, class upgrade, or passenger details</p>
              <button
                onClick={() => setShowChangeFlightModal(true)}
                disabled={bookingStatus === 'CANCELLED' || bookingStatus === 'REFUNDED'}
                className="w-full btn btn-warning text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Edit className="h-4 w-4" />
                Create Change Request
              </button>
              {changeRequests.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {changeRequests.length} previous change request(s)
                </p>
              )}
            </div>

            {/* Cancel Booking */}
            <div className="card border-2 border-red-100 hover:border-red-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold">Cancel Booking</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Cancel this booking and notify the customer</p>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={bookingStatus === 'CANCELLED' || bookingStatus === 'REFUNDED'}
                className="w-full btn btn-danger text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel Booking
              </button>
            </div>

            {/* Process Refund */}
            <div className="card border-2 border-purple-100 hover:border-purple-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold">Refund</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Initiate full or partial refund with penalty settings</p>
              <button
                onClick={() => setShowRefundModal(true)}
                disabled={bookingStatus === 'REFUNDED' || bookingStatus === 'FAILED'}
                className="w-full btn bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <DollarSign className="h-4 w-4" />
                Initiate Refund
              </button>
              {refunds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {refunds.length} previous refund(s)
                </p>
              )}
            </div>

            {/* Penalty Charge */}
            <div className="card border-2 border-amber-100 hover:border-amber-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold">Penalty Charge</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Apply penalty for no-show, late cancellation, or changes</p>
              <button
                onClick={() => {
                  setRefundForm((prev) => ({ ...prev, penaltyType: 'PERCENTAGE', penaltyValue: 25 }));
                  setShowRefundModal(true);
                }}
                disabled={bookingStatus === 'REFUNDED' || bookingStatus === 'FAILED'}
                className="w-full btn bg-amber-500 hover:bg-amber-600 text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Apply Penalty & Refund
              </button>
            </div>

            {/* Change Status */}
            <div className="card border-2 border-gray-100 hover:border-gray-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="font-semibold">Update Status</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Manually change booking status</p>
              <button
                onClick={() => setShowStatusModal(true)}
                className="w-full btn btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Change Status
              </button>
            </div>
          </div>

          {/* Existing Refunds */}
          {refunds.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Refund History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Penalty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Refunded</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {refunds.map((refund: any) => (
                      <tr key={refund.id}>
                        <td className="px-4 py-2">{new Date(refund.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">NPR {Number(refund.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-red-600">NPR {Number(refund.penaltyAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-green-600 font-medium">NPR {Number(refund.refundAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            refund.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            refund.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{refund.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Existing Change Requests */}
          {changeRequests.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Flight Change Requests</h3>
              <div className="space-y-3">
                {changeRequests.map((req: any) => (
                  <div key={req.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{req.requestType?.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        req.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    {req.reason && <p className="text-sm text-gray-600">{req.reason}</p>}
                    {req.penaltyAmount != null && Number(req.penaltyAmount) >= 0 && (
                      <p className="text-sm text-red-600 mt-1">Penalty: NPR {Number(req.penaltyAmount).toLocaleString()}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: History & Logs */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Booking Activity Log</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6 pl-10">
                <div className="relative">
                  <div className="absolute -left-[1.625rem] h-5 w-5 bg-green-500 rounded-full border-2 border-white"></div>
                  <div>
                    <p className="font-medium text-gray-900">Booking Created</p>
                    <p className="text-sm text-gray-600">
                      Booking {booking.bookingReference} created by {booking.user?.email}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {payments.map((payment: any, idx: number) => (
                  <div key={`pay-${idx}`} className="relative">
                    <div className={`absolute -left-[1.625rem] h-5 w-5 rounded-full border-2 border-white ${
                      payment.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Payment {payment.status === 'COMPLETED' ? 'Received' : payment.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        NPR {Number(payment.amount || 0).toLocaleString()} via {payment.gateway?.toUpperCase()}
                        {payment.transactionId && ` — Txn: ${payment.transactionId}`}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {booking.confirmedAt && (
                  <div className="relative">
                    <div className="absolute -left-[1.625rem] h-5 w-5 bg-blue-500 rounded-full border-2 border-white"></div>
                    <div>
                      <p className="font-medium text-gray-900">Booking Confirmed</p>
                      <p className="text-sm text-gray-600">Status changed to CONFIRMED</p>
                      <p className="text-xs text-gray-400">{new Date(booking.confirmedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {changeRequests.map((req: any, idx: number) => (
                  <div key={`cr-${idx}`} className="relative">
                    <div className="absolute -left-[1.625rem] h-5 w-5 bg-orange-500 rounded-full border-2 border-white"></div>
                    <div>
                      <p className="font-medium text-gray-900">Flight Change: {req.requestType?.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">{req.reason || 'No reason specified'} — Status: {req.status}</p>
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {refunds.map((refund: any, idx: number) => (
                  <div key={`ref-${idx}`} className="relative">
                    <div className="absolute -left-[1.625rem] h-5 w-5 bg-purple-500 rounded-full border-2 border-white"></div>
                    <div>
                      <p className="font-medium text-gray-900">Refund {refund.status}</p>
                      <p className="text-sm text-gray-600">
                        Amount: NPR {Number(refund.refundAmount || 0).toLocaleString()}
                        {Number(refund.penaltyAmount) > 0 && ` (Penalty: NPR ${Number(refund.penaltyAmount).toLocaleString()})`}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(refund.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {(booking.cancellationData as any)?.cancelledAt && (
                  <div className="relative">
                    <div className="absolute -left-[1.625rem] h-5 w-5 bg-red-500 rounded-full border-2 border-white"></div>
                    <div>
                      <p className="font-medium text-gray-900">Booking Cancelled</p>
                      <p className="text-sm text-gray-600">
                        {(booking.cancellationData as any)?.reason || 'No reason provided'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date((booking.cancellationData as any).cancelledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute -left-[1.625rem] h-5 w-5 bg-gray-300 rounded-full border-2 border-white"></div>
                  <div>
                    <p className="font-medium text-gray-500">Last Updated</p>
                    <p className="text-xs text-gray-400">{new Date(booking.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Cancel Booking</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This will cancel booking <strong>{booking.bookingReference}</strong>. The customer will be notified.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Enter reason for cancellation..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Keep Booking
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                className="flex-1 btn btn-danger disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Update Booking Status</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input w-full"
              >
                <option value="">Select status...</option>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key} disabled={key === bookingStatus}>
                    {val.label} {key === bookingStatus ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="input w-full"
                rows={2}
                placeholder="Add a note for this change..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowStatusModal(false)} className="flex-1 btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => statusMutation.mutate()}
                disabled={!newStatus || statusMutation.isPending}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {statusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund / Penalty Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRefundModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold">Refund & Penalty</h3>
            </div>

            {/* Booking Amount Summary */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Booking Amount</span>
                <span className="font-bold">NPR {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Penalty Quick Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Penalty Rule</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PENALTY_RULES.map((rule) => (
                  <button
                    key={rule.percentage}
                    onClick={() => setRefundForm((prev) => ({
                      ...prev,
                      penaltyType: 'PERCENTAGE',
                      penaltyValue: rule.percentage,
                    }))}
                    className={`p-2 rounded-lg text-sm border text-left transition ${
                      refundForm.penaltyType === 'PERCENTAGE' && refundForm.penaltyValue === rule.percentage
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {rule.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Penalty */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Type</label>
                <select
                  value={refundForm.penaltyType}
                  onChange={(e) => setRefundForm((prev) => ({
                    ...prev,
                    penaltyType: e.target.value as 'PERCENTAGE' | 'FIXED',
                  }))}
                  className="input w-full"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (NPR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {refundForm.penaltyType === 'PERCENTAGE' ? 'Penalty %' : 'Penalty Amount'}
                </label>
                <input
                  type="number"
                  value={refundForm.penaltyValue}
                  onChange={(e) => setRefundForm((prev) => ({
                    ...prev,
                    penaltyValue: Number(e.target.value),
                  }))}
                  min={0}
                  max={refundForm.penaltyType === 'PERCENTAGE' ? 100 : totalAmount}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Calculated Refund Preview */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Penalty Amount</span>
                <span className="font-medium text-red-600">
                  - NPR {(totalAmount - calculatedRefund).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-base border-t border-green-200 pt-2 mt-2">
                <span className="font-bold text-gray-900">Refund to Customer</span>
                <span className="font-bold text-green-700">NPR {calculatedRefund.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={refundForm.reason}
                onChange={(e) => setRefundForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="input w-full"
                rows={2}
                placeholder="Reason for refund..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (optional)</label>
              <textarea
                value={refundForm.adminNotes}
                onChange={(e) => setRefundForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                className="input w-full"
                rows={2}
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundForm({ reason: '', penaltyAmount: 0, penaltyType: 'PERCENTAGE', penaltyValue: 0, adminNotes: '' });
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => refundMutation.mutate()}
                disabled={!refundForm.reason.trim() || refundMutation.isPending}
                className="flex-1 btn bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {refundMutation.isPending ? 'Processing...' : `Refund NPR ${calculatedRefund.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Flight Modal */}
      {showChangeFlightModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChangeFlightModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold">Flight Change Request</h3>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Change Type</label>
              <select
                value={changeFlightForm.requestType}
                onChange={(e) => setChangeFlightForm((prev) => ({ ...prev, requestType: e.target.value }))}
                className="input w-full"
              >
                <option value="DATE_CHANGE">Date Change</option>
                <option value="ROUTE_CHANGE">Route Change</option>
                <option value="CLASS_UPGRADE">Class Upgrade</option>
                <option value="NAME_CORRECTION">Name Correction</option>
                <option value="ADD_PASSENGER">Add Passenger</option>
                <option value="REMOVE_PASSENGER">Remove Passenger</option>
              </select>
            </div>

            {changeFlightForm.requestType === 'DATE_CHANGE' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Departure Date</label>
                <input
                  type="date"
                  value={changeFlightForm.newDepartureDate}
                  onChange={(e) => setChangeFlightForm((prev) => ({ ...prev, newDepartureDate: e.target.value }))}
                  className="input w-full"
                />
              </div>
            )}

            {changeFlightForm.requestType === 'ROUTE_CHANGE' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Destination</label>
                <input
                  type="text"
                  value={changeFlightForm.newDestination}
                  onChange={(e) => setChangeFlightForm((prev) => ({ ...prev, newDestination: e.target.value }))}
                  className="input w-full"
                  placeholder="e.g. BKK, DEL, DXB"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={changeFlightForm.reason}
                onChange={(e) => setChangeFlightForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="input w-full"
                rows={2}
                placeholder="Reason for the change..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={changeFlightForm.adminNotes}
                onChange={(e) => setChangeFlightForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                className="input w-full"
                rows={2}
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowChangeFlightModal(false)} className="flex-1 btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => changeFlightMutation.mutate()}
                disabled={!changeFlightForm.reason.trim() || changeFlightMutation.isPending}
                className="flex-1 btn btn-warning disabled:opacity-50"
              >
                {changeFlightMutation.isPending ? 'Submitting...' : 'Submit Change Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
