import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { LogOut, User } from 'lucide-react';

export default function DashboardHeader() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'SUPER_ADMIN'
              ? 'System Administrator'
              : user?.role === 'B2B_AGENT'
              ? 'Travel Agent'
              : 'Customer'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
          
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
