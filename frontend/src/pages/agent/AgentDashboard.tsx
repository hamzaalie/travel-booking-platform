import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { walletApi, agentApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { Wallet, Plane, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AgentDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response: any = await walletApi.getWallet();
      return response.data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['agentBookings'],
    queryFn: async () => {
      const response: any = await agentApi.getBookings();
      return response.data;
    },
  });

  const { data: markups } = useQuery({
    queryKey: ['agentMarkups'],
    queryFn: async () => {
      const response: any = await agentApi.getMarkups();
      return response.data;
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async () => {
      const response: any = await walletApi.getTransactions({ page: 1, limit: 5 });
      return response.data?.transactions || [];
    },
  });

  const todayBookings = bookings?.filter((b: any) => {
    const today = new Date().toDateString();
    return new Date(b.createdAt).toDateString() === today;
  }).length || 0;

  const monthRevenue = bookings?.reduce((sum: number, b: any) => {
    const bookingDate = new Date(b.createdAt);
    const now = new Date();
    if (bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()) {
      return sum + (b.totalPrice || 0);
    }
    return sum;
  }, 0) || 0;

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">{user?.agent?.agencyName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold">${parseFloat(wallet?.balance || 0).toFixed(2)}</p>
            </div>
            <Wallet className="h-12 w-12 text-green-200" />
          </div>
          <Link to="/agent/wallet" className="mt-4 inline-block text-sm text-green-100 hover:text-white">
            View Details →
          </Link>
        </div>

        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-primary-900">{bookings?.length || 0}</p>
            </div>
            <Plane className="h-12 w-12 text-primary-950" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {todayBookings} today
          </p>
        </div>

        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">This Month</p>
              <p className="text-3xl font-bold text-accent-600">${monthRevenue.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-accent-500" />
          </div>
          <p className="mt-2 text-sm text-gray-600">Revenue</p>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Your Markup</p>
              <p className="text-3xl font-bold text-orange-700">
                {markups && markups.length > 0 ? `${markups[0].value}${markups[0].type === 'PERCENTAGE' ? '%' : '$'}` : 'Default'}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-600" />
          </div>
          <Link to="/agent/markups" className="mt-2 text-sm text-orange-700 hover:text-orange-800">
            Configure →
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <Link to="/agent/wallet" className="text-primary-950 hover:text-primary-900 font-medium text-sm">
              View All →
            </Link>
          </div>

          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${tx.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          
          <div className="space-y-3">
            <Link to="/search" className="block p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-lg mr-4">
                  <Plane className="h-6 w-6 text-primary-950" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Book Flight</h3>
                  <p className="text-sm text-gray-600">Search and book flights for customers</p>
                </div>
              </div>
            </Link>

            <Link to="/agent/wallet" className="block p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Request Funds</h3>
                  <p className="text-sm text-gray-600">Load money into your wallet</p>
                </div>
              </div>
            </Link>

            <Link to="/agent/bookings" className="block p-4 border-2 border-gray-200 rounded-lg hover:border-accent-300 hover:bg-accent-50 transition-all">
              <div className="flex items-center">
                <div className="bg-accent-100 p-3 rounded-lg mr-4">
                  <TrendingUp className="h-6 w-6 text-primary-950" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Reports</h3>
                  <p className="text-sm text-gray-600">See your booking history & revenue</p>
                </div>
              </div>
            </Link>
          </div>

          {wallet?.status !== 'ACTIVE' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Your wallet status is <strong>{wallet?.status}</strong>. 
                {wallet?.status === 'FROZEN' && ' Please contact support.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
