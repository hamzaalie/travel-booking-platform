import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout, setUser } from '@/store/slices/authSlice';
import { LogOut, User, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function DashboardHeader() {
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
        <div className="bg-amber-500 text-white px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-medium text-sm">
              Admin View: You are logged in as {user?.firstName} {user?.lastName} ({user?.email})
            </span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-700 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Admin
          </button>
        </div>
      )}

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
            
            {isImpersonating ? (
              <button
                onClick={handleReturnToAdmin}
                className="flex items-center space-x-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Admin</span>
              </button>
            ) : (
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
