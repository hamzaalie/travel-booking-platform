import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esimApi } from '@/services/api';
import { Smartphone, Search, Eye, RefreshCw, Clock, Check, X, Globe, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface EsimOrder {
  id: string;
  productId: string;
  totalAmount: number;
  currency: string;
  status: string;
  activationCode: string | null;
  qrCode: string | null;
  iccid: string | null;
  externalOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    name: string;
    countries: string[];
    dataAmount: string;
    validityDays: number;
    price: number;
    currency: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-accent-100 text-primary-900',
  ACTIVATED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-accent-100 text-accent-600',
};

export default function EsimManagementPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<EsimOrder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['esim-orders', statusFilter, searchTerm, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response: any = await esimApi.getAdminOrders(params);
      return response.data?.data || response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      esimApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esim-orders'] });
      setSelectedOrder(null);
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const stats = {
    total: data?.total || 0,
    activated: data?.orders?.filter((o: EsimOrder) => o.status === 'ACTIVATED').length || 0,
    pending: data?.orders?.filter((o: EsimOrder) => o.status === 'PENDING').length || 0,
    revenue: data?.orders?.reduce((sum: number, o: EsimOrder) => 
      o.status === 'ACTIVATED' ? sum + Number(o.totalAmount) : sum, 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">eSIM Management</h1>
          <p className="text-gray-600 mt-1">Manage eSIM products and orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-900 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-primary-950">Total Orders</p>
              <p className="text-2xl font-bold text-primary-950">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600">Activated</p>
              <p className="text-2xl font-bold text-green-800">{stats.activated}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-500 rounded-lg">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-accent-500">Revenue</p>
              <p className="text-2xl font-bold text-accent-600">
                NPR {stats.revenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, order ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-full sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="ACTIVATED">Activated</option>
            <option value="EXPIRED">Expired</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : !data?.orders?.length ? (
          <div className="text-center py-8 text-gray-500">
            <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No eSIM orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Country
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.orders.map((order: EsimOrder) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-gray-900">
                        {order.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {order.user?.firstName} {order.user?.lastName}
                        </div>
                        <div className="text-gray-500">{order.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.product?.name}</div>
                        <div className="text-gray-500">
                          {order.product?.dataAmount} • {order.product?.validityDays} days
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        {(order.product?.countries || []).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {order.currency} {Number(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
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
            {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? 'bg-primary-950 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">eSIM Order Details</h3>
                  <p className="text-gray-500 text-sm font-mono">{selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer */}
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <div className="text-right">
                  <div className="font-medium">
                    {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{selectedOrder.user?.email}</div>
                </div>
              </div>

              {/* Product */}
              <div className="flex justify-between">
                <span className="text-gray-500">Product</span>
                <div className="text-right">
                  <div className="font-medium">{selectedOrder.product?.name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedOrder.product?.dataAmount} • {selectedOrder.product?.validityDays} days
                  </div>
                </div>
              </div>

              {/* Country */}
              <div className="flex justify-between">
                <span className="text-gray-500">Country</span>
                <span className="font-medium">{(selectedOrder.product?.countries || []).join(', ')}</span>
              </div>

              {/* Price */}
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-medium">
                  {selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString()}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedOrder.status]}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Activation Code */}
              {selectedOrder.activationCode && (
                <div className="border-t pt-4">
                  <label className="text-sm text-gray-500 block mb-1">Activation Code</label>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                    {selectedOrder.activationCode}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {selectedOrder.qrCode && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">QR Code</label>
                  <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
                    <img src={selectedOrder.qrCode} alt="eSIM QR Code" className="w-40 h-40" />
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PROCESSING') && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Update Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'ACTIVATED',
                      })}
                      className="btn btn-primary flex-1"
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Activate
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'FAILED',
                      })}
                      className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
                      disabled={updateStatusMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Mark Failed
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'ACTIVATED' && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => updateStatusMutation.mutate({
                      orderId: selectedOrder.id,
                      status: 'REFUNDED',
                    })}
                    className="btn btn-secondary w-full"
                    disabled={updateStatusMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Process Refund
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
