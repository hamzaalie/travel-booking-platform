import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminBookingCustomizationApi, adminApi } from '@/services/api';
import { formatAmount, getBookingCurrency } from '@/utils/currency';
import {
  Plane,
  Search,
  Eye,
  Settings,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Save,
  Armchair,
  UtensilsCrossed,
  Luggage,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingDetail {
  id: string;
  bookingReference: string;
  pnr: string;
  customerName: string;
  customerEmail: string;
  isB2C: boolean;
  tripType: string;
  route: string;
  airlines: string;
  departureDate: string;
  status: string;
  fareClass: string;
  cabinClass: string;
  baseFare: number;
  taxes: number;
  markup: number;
  totalAmount: number;
  seatAssignment: string | null;
  mealPreference: string | null;
  baggageAllowance: string | null;
  specialAssistance: string | null;
  passengers: Array<{
    name: string;
    type: string;
    seatNumber: string | null;
    meal: string | null;
    baggage: string | null;
  }>;
  createdAt: string;
}

interface FareClassConfig {
  code: string;
  name: string;
  description: string;
  isRefundable: boolean;
  changeFee: number;
  baggageIncluded: string;
  seatSelectionFree: boolean;
  priority: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  TICKETED: { bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-700' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-700' },
};

const FARE_CLASSES: FareClassConfig[] = [
  { code: 'Y', name: 'Economy', description: 'Standard economy fare', isRefundable: false, changeFee: 3000, baggageIncluded: '20kg', seatSelectionFree: false, priority: 1 },
  { code: 'B', name: 'Economy Flex', description: 'Flexible economy fare', isRefundable: true, changeFee: 1500, baggageIncluded: '25kg', seatSelectionFree: true, priority: 2 },
  { code: 'W', name: 'Premium Economy', description: 'Premium economy fare', isRefundable: true, changeFee: 1000, baggageIncluded: '30kg', seatSelectionFree: true, priority: 3 },
  { code: 'C', name: 'Business', description: 'Business class fare', isRefundable: true, changeFee: 0, baggageIncluded: '40kg', seatSelectionFree: true, priority: 4 },
  { code: 'F', name: 'First Class', description: 'First class fare', isRefundable: true, changeFee: 0, baggageIncluded: '50kg', seatSelectionFree: true, priority: 5 },
];

const SEAT_TYPES = [
  'Window', 'Aisle', 'Middle', 'Exit Row Window', 'Exit Row Aisle',
  'Bulkhead', 'Extra Legroom', 'Front Row',
];

const MEAL_OPTIONS = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher',
  'Gluten-Free', 'Child Meal', 'Diabetic', 'Low Salt',
];

export default function BookingCustomizationPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('B2C');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'fare-classes' | 'seat-config'>('bookings');
  const [customizeForm, setCustomizeForm] = useState({
    fareClass: '',
    seatAssignment: '',
    mealPreference: '',
    baggageAllowance: '',
    specialAssistance: '',
    adminNotes: '',
  });

  // Fetch bookings
  const { data, isLoading, error: _fetchError } = useQuery({
    queryKey: ['admin-bookings-custom', searchTerm, statusFilter, channelFilter, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (channelFilter !== 'all') params.channel = channelFilter;
      const response: any = await adminApi.getBookings(params);
      return response.data;
    },
  });

  // Update booking customization
  const customizeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminBookingCustomizationApi.updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-custom'] });
      setIsCustomizeModalOpen(false);
      toast.success('Booking customized successfully');
    },
    onError: () => toast.error('Failed to customize booking'),
  });

  const parseFlightDetails = (booking: any) => {
    try {
      return typeof booking.flightDetails === 'string'
        ? JSON.parse(booking.flightDetails || '{}')
        : (booking.flightDetails || {});
    } catch {
      return {};
    }
  };

  const openCustomize = (booking: any) => {
    setSelectedBooking(booking);
    const fd = parseFlightDetails(booking);
    setCustomizeForm({
      fareClass: fd.fareClass || fd.cabinClass || booking.cabinClass || 'Y',
      seatAssignment: fd.seatAssignment || '',
      mealPreference: fd.mealPreference || '',
      baggageAllowance: fd.baggageAllowance || '',
      specialAssistance: fd.specialAssistance || '',
      adminNotes: fd.adminNotes || '',
    });
    setIsCustomizeModalOpen(true);
  };

  const handleCustomize = () => {
    if (selectedBooking) {
      customizeMutation.mutate({ id: selectedBooking.id, data: customizeForm });
    }
  };

  const bookings = data?.bookings || [];
  const total = data?.total || 0;

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Booking Customization</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Admin B2C/B2B booking management - Fare Class, Seat Assignment, Meal & Baggage</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {[
          { id: 'bookings', label: 'Booking Management', icon: Plane },
          { id: 'fare-classes', label: 'Fare Class Config', icon: Tag },
          { id: 'seat-config', label: 'Seat & Services', icon: Armchair },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-950 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by PNR, booking ref, customer name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <select
                value={channelFilter}
                onChange={(e) => { setChannelFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Channels</option>
                <option value="B2C">B2C Only</option>
                <option value="B2B">B2B Only</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="TICKETED">Ticketed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            {bookings.map((booking: any) => {
              const isExpanded = expandedBooking === booking.id;
              const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
              let flightDetails: any = {};
              try {
                flightDetails = typeof booking.flightDetails === 'string' 
                  ? JSON.parse(booking.flightDetails || '{}') 
                  : (booking.flightDetails || {});
              } catch {
                flightDetails = {};
              }

              const fd = flightDetails;

              return (
                <div key={booking.id} className="card border-2 hover:shadow-md transition-shadow">
                  {/* Booking Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Plane className="h-5 w-5 text-primary-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{booking.bookingReference}</h3>
                          {booking.pnr && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">PNR: {booking.pnr}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            booking.agentId ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {booking.agentId ? 'B2B' : 'B2C'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          <span>{booking.user?.firstName} {booking.user?.lastName}</span>
                          <span>{booking.tripType}</span>
                          <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-primary-900">{formatAmount(booking.totalAmount || 0, getBookingCurrency(booking))}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {booking.status}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Fare & Price Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Fare & Price Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Fare Class:</span>
                              <span className="font-medium">
                                {fd.fareClass
                                  ? `${fd.fareClass} - ${FARE_CLASSES.find(fc => fc.code === fd.fareClass)?.name || fd.fareClass}`
                                  : fd.cabinClass || booking.cabinClass || 'Economy (Y)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Base Fare:</span>
                              <span className="font-medium">{formatAmount(booking.baseFare || 0, getBookingCurrency(booking))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Taxes:</span>
                              <span className="font-medium">{formatAmount(booking.taxes || 0, getBookingCurrency(booking))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Markup:</span>
                              <span className="font-medium">{formatAmount(booking.markup || 0, getBookingCurrency(booking))}</span>
                            </div>
                            {booking.agentMarkup > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Agent Markup:</span>
                                <span className="font-medium">{formatAmount(booking.agentMarkup, getBookingCurrency(booking))}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-2 font-bold">
                              <span>Total:</span>
                              <span>{formatAmount(booking.totalAmount || 0, getBookingCurrency(booking))}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <Armchair className="h-4 w-4" /> Service Customization
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Seat:</span>
                              <span className="font-medium">{fd.seatAssignment || 'Not assigned'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Meal:</span>
                              <span className="font-medium">{fd.mealPreference || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Baggage:</span>
                              <span className="font-medium">{fd.baggageAllowance || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Assistance:</span>
                              <span className="font-medium">{fd.specialAssistance || 'None'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCustomize(booking)}
                          className="btn btn-primary text-sm flex items-center gap-1"
                        >
                          <Settings className="h-4 w-4" />
                          Customize Booking
                        </button>
                        <button
                          onClick={() => window.open(`/admin/bookings/${booking.id}`, '_blank')}
                          className="btn btn-outline text-sm flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          View Full Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {bookings.length === 0 && (
              <div className="card text-center py-12">
                <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No bookings found</p>
              </div>
            )}
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
        </>
      )}

      {/* Fare Class Configuration Tab */}
      {activeTab === 'fare-classes' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Fare Class Configuration</h3>
            <p className="text-gray-600 text-sm mb-6">
              Configure fare class options available for B2C bookings. Admin can check and manage fare classes displayed to customers.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-sm font-medium text-gray-500">Code</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Description</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Refundable</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Change Fee</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Baggage</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Free Seat Selection</th>
                  </tr>
                </thead>
                <tbody>
                  {FARE_CLASSES.map((fc) => (
                    <tr key={fc.code} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono font-bold text-primary-900">{fc.code}</td>
                      <td className="py-3 font-medium">{fc.name}</td>
                      <td className="py-3 text-sm text-gray-600">{fc.description}</td>
                      <td className="py-3">
                        {fc.isRefundable ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-red-500 text-xs">Non-refundable</span>
                        )}
                      </td>
                      <td className="py-3 text-sm">
                        {fc.changeFee === 0 ? (
                          <span className="text-green-600 font-medium">Free</span>
                        ) : (
                          <span>$ {fc.changeFee.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 text-sm">{fc.baggageIncluded}</td>
                      <td className="py-3">
                        {fc.seatSelectionFree ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-yellow-600 text-xs">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-700">Admin B2C Booking Features</h4>
                <ul className="text-sm text-blue-600 mt-1 space-y-1">
                  <li>• Admin can check and modify fare class for any B2C booking</li>
                  <li>• Seat assignments can be managed per passenger from the booking detail view</li>
                  <li>• Meal and baggage preferences are customizable by admin</li>
                  <li>• Changes are logged in the audit trail for accountability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat & Services Configuration Tab */}
      {activeTab === 'seat-config' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seat Types */}
            <div className="card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Armchair className="h-5 w-5 text-primary-950" />
                Available Seat Types
              </h3>
              <div className="space-y-2">
                {SEAT_TYPES.map((seat) => (
                  <div key={seat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{seat}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Options */}
            <div className="card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary-950" />
                Available Meal Options
              </h3>
              <div className="space-y-2">
                {MEAL_OPTIONS.map((meal) => (
                  <div key={meal} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{meal}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Baggage Options */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Luggage className="h-5 w-5 text-primary-950" />
              Baggage Allowance Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['15kg', '20kg', '25kg', '30kg', '40kg', '50kg', '23kg x 2', '32kg x 2'].map((bag) => (
                <div key={bag} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{bag}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {isCustomizeModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Customize Booking</h2>
              <p className="text-gray-600 text-sm mt-1">
                {selectedBooking.bookingReference} • {selectedBooking.pnr}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fare Class</label>
                <select
                  value={customizeForm.fareClass}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, fareClass: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {FARE_CLASSES.map((fc) => (
                    <option key={fc.code} value={fc.code}>{fc.code} - {fc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Assignment</label>
                <select
                  value={customizeForm.seatAssignment}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, seatAssignment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">No preference</option>
                  {SEAT_TYPES.map((seat) => (
                    <option key={seat} value={seat}>{seat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Preference</label>
                <select
                  value={customizeForm.mealPreference}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, mealPreference: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Standard</option>
                  {MEAL_OPTIONS.map((meal) => (
                    <option key={meal} value={meal}>{meal}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baggage Allowance</label>
                <select
                  value={customizeForm.baggageAllowance}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, baggageAllowance: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Standard</option>
                  {['15kg', '20kg', '25kg', '30kg', '40kg', '50kg', '23kg x 2', '32kg x 2'].map((bag) => (
                    <option key={bag} value={bag}>{bag}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Assistance</label>
                <textarea
                  value={customizeForm.specialAssistance}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, specialAssistance: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Wheelchair, unaccompanied minor, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={customizeForm.adminNotes}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, adminNotes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Internal notes about this customization"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setIsCustomizeModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button
                onClick={handleCustomize}
                disabled={customizeMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {customizeMutation.isPending ? 'Saving...' : 'Save Customization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
