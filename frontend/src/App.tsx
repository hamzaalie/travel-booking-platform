import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import ScrollToTop from './components/common/ScrollToTop';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AgentRegistrationPage from './pages/auth/AgentRegistrationPage';
import FlightSearchPage from './pages/public/FlightSearchPage';
import FlightResultsPage from './pages/public/FlightResultsPage';
import HotelSearchPage from './pages/public/HotelSearchPage';
import HotelDetailsPage from './pages/public/HotelDetailsPage';
import CarRentalPage from './pages/public/CarRentalPage';
import FlightBookingPage from './pages/booking/FlightBookingPage';
import HotelBookingPage from './pages/booking/HotelBookingPage';
import CarBookingPage from './pages/booking/CarBookingPage';
import PaymentPage from './pages/booking/PaymentPage';
import PaymentSuccessPage from './pages/booking/PaymentSuccessPage';
import KhaltiCallbackPage from './pages/booking/KhaltiCallbackPage';
import EsewaCallbackPage from './pages/booking/EsewaCallbackPage';
import EsewaFailurePage from './pages/booking/EsewaFailurePage';
import BookingConfirmationPage from './pages/booking/BookingConfirmationPage';
import EsimPage from './pages/public/EsimPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import BlogPage, { BlogPostPage } from './pages/public/BlogPage';
import StaticPage from './pages/public/StaticPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';
import RefundPolicyPage from './pages/legal/RefundPolicyPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import BookingDetailsPage from './pages/customer/BookingDetailsPage';
import CancellationRequestPage from './pages/shared/CancellationRequestPage';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentBookingsPage from './pages/agent/AgentBookingsPage';
import WalletPage from './pages/agent/WalletPage';
import AgentMarkupsPage from './pages/agent/AgentMarkupsPage';
import AgentDocumentsPageAgent from './pages/agent/AgentDocumentsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentApprovalPage from './pages/admin/AgentApprovalPage';
import AllBookingsPage from './pages/admin/AllBookingsPage';
import AdminBookingDetailPage from './pages/admin/AdminBookingDetailPage';
import FundRequestsPage from './pages/admin/FundRequestsPage';
import MarkupManagementPage from './pages/admin/MarkupManagementPage';
import ReportingDashboardPage from './pages/admin/ReportingDashboardPage';
import RefundManagementPage from './pages/admin/RefundManagementPage';
import AgentMarkupManagementPage from './pages/admin/AgentMarkupManagementPage';
import AgentDocumentsPage from './pages/admin/AgentDocumentsPage';
import CustomerManagementPage from './pages/admin/CustomerManagementPage';
import B2BUserManagementPage from './pages/admin/B2BUserManagementPage';
import FlightChangeManagementPage from './pages/admin/FlightChangeManagementPage';
import SettingsManagementPage from './pages/admin/SettingsManagementPage';
import PageManagementPage from './pages/admin/PageManagementPage';
import BlogManagementPage from './pages/admin/BlogManagementPage';
import CurrencyManagementPage from './pages/admin/CurrencyManagementPage';
import EsimManagementPage from './pages/admin/EsimManagementPage';
import ApiManagementPage from './pages/admin/ApiManagementPage';
import PaymentGatewayManagementPage from './pages/admin/PaymentGatewayManagementPage';
import PopularDestinationsPage from './pages/admin/PopularDestinationsPage';
import B2BPortalManagementPage from './pages/admin/B2BPortalManagementPage';
import EsimCommissionPage from './pages/admin/EsimCommissionPage';
import BookingCustomizationPage from './pages/admin/BookingCustomizationPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<FlightSearchPage />} />
        <Route path="/search/results" element={<FlightResultsPage />} />
        <Route path="/hotels" element={<HotelSearchPage />} />
        <Route path="/hotels/:hotelId" element={<HotelDetailsPage />} />
        <Route path="/cars" element={<CarRentalPage />} />
        <Route path="/booking/flight" element={<FlightBookingPage />} />
        <Route path="/booking/hotel" element={<HotelBookingPage />} />
        <Route path="/booking/car" element={<CarBookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/khalti/callback" element={<KhaltiCallbackPage />} />
        <Route path="/payment/esewa/success" element={<EsewaCallbackPage />} />
        <Route path="/payment/esewa/failure" element={<EsewaFailurePage />} />
        <Route path="/booking/confirmation/:id" element={<BookingConfirmationPage />} />
        <Route path="/esim" element={<EsimPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/page/:slug" element={<StaticPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/agent" element={<AgentRegistrationPage />} />
      </Route>

      {/* Customer Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['B2C_CUSTOMER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="bookings/:id/cancel" element={<CancellationRequestPage />} />
        <Route path="bookings/:id" element={<BookingDetailsPage />} />
      </Route>

      {/* Agent Routes */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute allowedRoles={['B2B_AGENT']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AgentDashboard />} />
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="bookings" element={<AgentBookingsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="markups" element={<AgentMarkupsPage />} />
        <Route path="documents" element={<AgentDocumentsPageAgent />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="agents" element={<AgentApprovalPage />} />
        <Route path="agents/markup" element={<AgentMarkupManagementPage />} />
        <Route path="agents/:agentId/documents" element={<AgentDocumentsPage />} />
        <Route path="agents/:agentId" element={<AgentDocumentsPage />} />
        <Route path="bookings" element={<AllBookingsPage />} />
        <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
        <Route path="fund-requests" element={<FundRequestsPage />} />
        <Route path="markups" element={<MarkupManagementPage />} />
        <Route path="refunds" element={<RefundManagementPage />} />
        <Route path="reports" element={<ReportingDashboardPage />} />
        <Route path="customers" element={<CustomerManagementPage />} />
        <Route path="b2b-users" element={<B2BUserManagementPage />} />
        <Route path="flight-changes" element={<FlightChangeManagementPage />} />
        <Route path="settings" element={<SettingsManagementPage />} />
        <Route path="pages" element={<PageManagementPage />} />
        <Route path="blog" element={<BlogManagementPage />} />
        <Route path="currencies" element={<CurrencyManagementPage />} />
        <Route path="esim" element={<EsimManagementPage />} />
        <Route path="api-management" element={<ApiManagementPage />} />
        <Route path="payment-gateways" element={<PaymentGatewayManagementPage />} />
        <Route path="popular-destinations" element={<PopularDestinationsPage />} />
        <Route path="b2b-portal" element={<B2BPortalManagementPage />} />
        <Route path="esim-commission" element={<EsimCommissionPage />} />
        <Route path="booking-customize" element={<BookingCustomizationPage />} />
      </Route>

      {/* 404 eror solved*/}
      <Route path="*" element={<div className="flex items-center justify-center h-screen"><h1 className="text-4xl font-bold">404 - Page Not Found</h1></div>} />
    </Routes>
    </>
  );
}

export default App;
