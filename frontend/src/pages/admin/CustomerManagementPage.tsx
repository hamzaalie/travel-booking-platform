import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminExtendedApi } from '@/services/api';
import { Search, Users, Eye, ToggleLeft, ToggleRight, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    bookings: number;
    payments: number;
  };
}

export default function CustomerManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, activeFilter, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      if (activeFilter !== 'all') params.isActive = activeFilter === 'active';
      
      const response: any = await adminExtendedApi.getCustomers(params);
      return response.data;
    },
  });

  const { data: customerDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['customerDetails', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const response: any = await adminExtendedApi.getCustomerDetails(selectedCustomer.id);
      return response.data;
    },
    enabled: !!selectedCustomer,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminExtendedApi.updateCustomerStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer status updated');
    },
    onError: () => {
      toast.error('Failed to update customer status');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage B2C customer accounts</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
          <Users className="h-5 w-5 text-primary-600" />
          <span className="text-primary-700 font-semibold">
            {data?.total || 0} Total Customers
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </form>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2">
          <div className="card">
            {isLoading ? (
              <div className="text-center py-8">Loading customers...</div>
            ) : !data?.customers?.length ? (
              <div className="text-center py-8 text-gray-500">No customers found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bookings
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.customers.map((customer: Customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(customer.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {customer._count.bookings}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${customer.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'}`}
                          >
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-1 text-gray-400 hover:text-primary-600"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => toggleStatusMutation.mutate({
                                id: customer.id,
                                isActive: !customer.isActive
                              })}
                              className={`p-1 ${customer.isActive 
                                ? 'text-red-400 hover:text-red-600' 
                                : 'text-green-400 hover:text-green-600'}`}
                              title={customer.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {customer.isActive ? (
                                <ToggleRight className="h-5 w-5" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>
                          </div>
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
                {Array.from({ length: data.totalPages }, (_, i) => (
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
        </div>

        {/* Customer Details Panel */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
            
            {!selectedCustomer ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a customer to view details</p>
              </div>
            ) : isLoadingDetails ? (
              <div className="text-center py-8">Loading...</div>
            ) : customerDetails ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">
                      {customerDetails.firstName?.[0]}{customerDetails.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {customerDetails.firstName} {customerDetails.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{customerDetails.email}</div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone:</span>
                    <span>{customerDetails.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email Verified:</span>
                    <span className={customerDetails.emailVerified ? 'text-green-600' : 'text-orange-600'}>
                      {customerDetails.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Bookings:</span>
                    <span className="font-medium">{customerDetails._count.bookings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Payments:</span>
                    <span className="font-medium">{customerDetails._count.payments}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Member Since:</span>
                    <span>{new Date(customerDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Recent Bookings */}
                {customerDetails.bookings?.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Recent Bookings</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customerDetails.bookings.slice(0, 5).map((booking: any) => (
                        <div key={booking.id} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{booking.bookingReference}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            {booking.origin} → {booking.destination}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
