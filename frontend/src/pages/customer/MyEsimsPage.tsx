import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { esimApi } from '@/services/api';
// MULTI-CURRENCY MODEL REMOVED
// import { useSelector } from 'react-redux';
// import { RootState } from '@/store';
// import { convertPrice } from '@/store/slices/currencySlice';
import {
  Smartphone, Search, Filter, Globe, Wifi, Clock, ChevronRight,
  AlertCircle, CheckCircle, Loader2, XCircle, RefreshCw, Zap,
} from 'lucide-react';

type OrderStatus = 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ACTIVATED' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  PROCESSING: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Loader2 },
  COMPLETED: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  ACTIVATED: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Wifi },
  EXPIRED: { color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock },
  FAILED: { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  CANCELLED: { color: 'text-gray-700', bg: 'bg-gray-200', icon: XCircle },
  REFUNDED: { color: 'text-purple-700', bg: 'bg-purple-100', icon: RefreshCw },
};

export default function MyEsimsPage() {
  const navigate = useNavigate();
  // MULTI-CURRENCY MODEL REMOVED - Only NPR supported
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const formatPrice = (amount: number, _sourceCurrency: string = 'NPR') => {
    const num = Number(amount);
    if (isNaN(num)) return '—';
    return `रू ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['my-esim-orders'],
    queryFn: async () => {
      const response: any = await esimApi.getOrders();
      return response.data?.data || response.data || [];
    },
  });

  const filteredOrders = (orders || []).filter((order: any) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesSearch = !searchTerm ||
      order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.iccid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.product?.countries || []).join(', ').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = (orders || []).reduce((acc: Record<string, number>, order: any) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My eSIMs</h1>
          <p className="text-gray-500 mt-1">Manage your eSIM orders and activations</p>
        </div>
        <button
          onClick={() => navigate('/esim')}
          className="btn btn-primary flex items-center gap-2 self-start"
        >
          <Smartphone className="h-4 w-4" />
          Buy New eSIM
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">
            {(statusCounts['ACTIVATED'] || 0) + (statusCounts['COMPLETED'] || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <p className="text-sm text-gray-500">Processing</p>
          <p className="text-2xl font-bold text-blue-600">
            {(statusCounts['PENDING'] || 0) + (statusCounts['PROCESSING'] || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-gray-500">
            {statusCounts['EXPIRED'] || 0}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by country, order ID, or ICCID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
              className="input pl-10 w-full sm:w-48"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="ACTIVATED">Activated</option>
              <option value="EXPIRED">Expired</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your eSIM orders...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</h3>
          <p className="text-gray-500">Please try again later</p>
        </div>
      ) : !filteredOrders.length ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {orders?.length ? 'No matching orders' : 'No eSIM orders yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {orders?.length
              ? 'Try adjusting your search or filter'
              : 'Purchase an eSIM to stay connected while traveling'}
          </p>
          {!orders?.length && (
            <button
              onClick={() => navigate('/esim')}
              className="btn btn-primary"
            >
              Browse eSIM Plans
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => {
            const cfg = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = cfg.icon;
            const countries = order.product?.countries?.join(', ') || 'Unknown';

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/customer/esim/${order.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/customer/esim/${order.id}`); } }}
                role="button"
                tabIndex={0}
                aria-label={`View order ${order.product?.name || order.id}`}
                className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Product info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <Globe className="h-6 w-6 text-primary-950" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {order.product?.name || 'eSIM Order'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {countries}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="h-3.5 w-3.5" />
                          {order.product?.dataAmount || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {order.product?.validityDays || '—'} days
                        </span>
                      </div>
                      {order.iccid && (
                        <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                          ICCID: {order.iccid}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Price, status, date */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(order.totalAmount, order.currency)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {order.status}
                    </span>
                    {['COMPLETED', 'ACTIVATED', 'EXPIRED'].includes(order.status) && order.iccid && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/customer/esim/${order.id}?topup=true`); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                        <Zap className="h-3 w-3" />
                        Top Up
                      </button>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-gray-400 hidden sm:block shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
