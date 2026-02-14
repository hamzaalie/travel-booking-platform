import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { LogOut, User, ShieldAlert, ArrowLeft, Menu } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

export default function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const isImpersonating = !!localStorage.getItem('adminReturnToken');

  const handleReturnToAdmin = () => {
    const adminToken = localStorage.getItem('adminReturnToken');
    const adminUser = localStorage.getItem('adminReturnUser');
    if (adminToken) {
      localStorage.setItem('accessToken', adminToken);
      localStorage.removeItem('adminReturnToken');
      if (adminUser) {
        localStorage.setItem('user', adminUser);
        localStorage.removeItem('adminReturnUser');
      }
      // Reload to re-fetch admin user data
      window.location.href = '/admin';
    }
  };

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-white px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium text-sm truncate">
              Admin View: {user?.firstName} {user?.lastName}
            </span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-700 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Admin
          </button>
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu toggle */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                Welcome, {user?.firstName}!
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {user?.role === 'SUPER_ADMIN'
                  ? 'System Administrator'
                  : user?.role === 'B2B_AGENT'
                  ? 'Travel Agent'
                  : 'Customer'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center space-x-2 px-3 md:px-4 py-2 bg-gray-50 rounded-lg">
              <User className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
              <span className="text-xs md:text-sm font-medium text-gray-900 max-w-[120px] md:max-w-none truncate">{user?.email}</span>
            </div>
            
            {isImpersonating ? (
              <button
                onClick={handleReturnToAdmin}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Back to Admin</span>
              </button>
            ) : (
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
