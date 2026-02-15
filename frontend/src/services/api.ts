import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// IMPORTANT: API Base URL - Railway backend with /api prefix
// Last updated: 2026-02-15 - Updated to correct Railway backend URL
const RAILWAY_BACKEND = 'https://web-production-b13e2.up.railway.app';

// Ensure API URL always ends with /api
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // If env URL is set, ensure it has /api suffix
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return `${RAILWAY_BACKEND}/api`;
};

const API_URL = getApiUrl();
console.log('API URL:', API_URL); // Debug logging

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 - Token expired (skip for login/register/refresh endpoints)
        const requestUrl = originalRequest.url || '';
        const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                               requestUrl.includes('/auth/register') || 
                               requestUrl.includes('/auth/refresh');
        
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const newAccessToken = response.data?.data?.accessToken;
            if (!newAccessToken) throw new Error('No access token in refresh response');

            localStorage.setItem('accessToken', newAccessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - force logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // If retry also got 401, force logout instead of looping
        if (error.response?.status === 401 && originalRequest._retry) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Handle other errors
        const errorMessage =
          (error.response?.data as any)?.error ||
          error.message ||
          'An unexpected error occurred';

        toast.error(errorMessage);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiService();

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Flight API
export const flightApi = {
  search: (params: any) =>
    api.get('/flights/search', { params }),
  
  priceOffer: (flightOffer: any) =>
    api.post('/flights/price', { flightOffer }),
};

// Booking API
export const bookingApi = {
  create: (data: any) =>
    api.post('/bookings', data),
  
  confirm: (id: string, paymentData?: any) =>
    api.post(`/bookings/${id}/confirm`, { paymentData }),
  
  getById: (id: string) =>
    api.get(`/bookings/${id}`),
  
  getMyBookings: (params?: any) =>
    api.get('/bookings', { params }),
  
  cancel: (id: string, reason?: string) =>
    api.post(`/bookings/${id}/cancel`, { reason }),
};

// Wallet API
export const walletApi = {
  getWallet: () =>
    api.get('/wallet'),
  
  getTransactions: (params?: any) =>
    api.get('/wallet/transactions', { params }),
  
  requestFund: (data: any) =>
    api.post('/wallet/fund-request', data),
  
  getFundRequests: () =>
    api.get('/wallet/fund-requests'),
};

// Agent API
export const agentApi = {
  getBookings: (params?: any) =>
    api.get('/agent/bookings', { params }),
  
  getMarkups: () =>
    api.get('/agent/markups'),
  
  createMarkup: (data: any) =>
    api.post('/agent/markups', data),

  getProfile: () =>
    api.get('/agent/profile'),

  getDocuments: () =>
    api.get('/agent/documents'),

  uploadDocuments: (formData: FormData) =>
    api.post('/agent/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteDocument: (id: string) =>
    api.delete(`/agent/documents/${id}`),
};

// Admin API
export const adminApi = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  
  getPendingAgents: () =>
    api.get('/admin/agents/pending'),
  
  approveAgent: (id: string) =>
    api.post(`/admin/agents/${id}/approve`),
  
  rejectAgent: (id: string, reason: string) =>
    api.post(`/admin/agents/${id}/reject`, { reason }),
  
  getAllAgents: (params?: any) =>
    api.get('/admin/agents', { params }),
  
  getAllBookings: (params?: any) =>
    api.get('/admin/bookings', { params }),
  
  getFundRequests: (status?: string) =>
    api.get('/admin/fund-requests', { params: { status } }),
  
  approveFundRequest: (id: string) =>
    api.post(`/admin/fund-requests/${id}/approve`),
  
  rejectFundRequest: (id: string, reason: string) =>
    api.post(`/admin/fund-requests/${id}/reject`, { reason }),
  
  getMarkups: (params?: any) =>
    api.get('/admin/markups', { params }),
  
  createMarkup: (data: any) =>
    api.post('/admin/markups', data),
  
  updateMarkup: (id: string, data: any) =>
    api.put(`/admin/markups/${id}`, data),
  
  deleteMarkup: (id: string) =>
    api.delete(`/admin/markups/${id}`),
  
  // Agent Markup Management and then go to the admin panel and then f 
  getAgentsWithMarkupSettings: (params?: { status?: string; search?: string }) =>
    api.get('/admin/agents/markup-settings', { params }),
  
  getAgentDetails: (agentId: string) =>
    api.get(`/admin/agents/${agentId}/details`),
  
  getAgentDocuments: (agentId: string) =>
    api.get(`/admin/agents/${agentId}/documents`),
  
  updateAgentMarkupSettings: (agentId: string, settings: any) =>
    api.put(`/admin/agents/${agentId}/markup-settings`, settings),
  
  bulkUpdateAgentMarkupSettings: (agentIds: string[], settings: any) =>
    api.post('/admin/agents/bulk-markup-settings', { agentIds, ...settings }),
  
  verifyDocument: (documentId: string, action: any) =>
    api.post(`/admin/documents/${documentId}/verify`, typeof action === 'string' ? { action } : action),

  // Admin login as user (Direct Login)
  loginAsUser: (userId: string) =>
    api.post(`/admin-extended/login-as-user/${userId}`),

  // Get bookings with extended params
  getBookings: (params?: any) =>
    api.get('/admin/bookings', { params }),

  // Booking management actions
  updateBookingStatus: (id: string, data: { status: string; note?: string }) =>
    api.put(`/admin-extended/bookings/${id}/status`, data),

  initiateRefund: (id: string, data: { reason: string; penaltyAmount: number; refundAmount: number; adminNotes?: string }) =>
    api.post(`/admin-extended/bookings/${id}/refund`, data),

  createFlightChangeRequest: (id: string, data: { requestType: string; reason: string; requestedChanges: any; adminNotes?: string }) =>
    api.post(`/admin-extended/bookings/${id}/change-request`, data),

  resendTicketEmail: (id: string) =>
    api.post(`/admin-extended/bookings/${id}/resend-ticket`),
};

// Payment API
export const paymentApi = {
  createStripePayment: (data: any) =>
    api.post('/payments/stripe/create', data),
  
  createStripeCheckout: (data: any) =>
    api.post('/payments/stripe/checkout', data),
  
  initiateKhalti: (data: any) =>
    api.post('/payments/khalti/initiate', data),
  
  verifyKhalti: (pidx: string, bookingId: string) =>
    api.post('/payments/khalti/verify', { pidx, bookingId }),
  
  initiateEsewa: (data: any) =>
    api.post('/payments/esewa/initiate', data),
  
  verifyEsewa: (data: any) =>
    api.post('/payments/esewa/verify', data),
  
  createPayPalOrder: (data: any) =>
    api.post('/payments/paypal/create', data),
  
  capturePayPalPayment: (orderId: string, bookingId: string) =>
    api.post('/payments/paypal/capture', { orderId, bookingId }),
};

// Hotel API
export const hotelApi = {
  search: (params: any) =>
    api.get('/hotels/search', { params }),
  
  getOffers: (hotelId: string, params: any) =>
    api.get(`/hotels/${hotelId}/offers`, { params }),
  
  book: (data: any) =>
    api.post('/hotels/book', data),
};

// Car Rental API
export const carRentalApi = {
  search: (params: any) =>
    api.get('/car-rentals/search', { params }),
  
  getOffer: (offerId: string) =>
    api.get(`/car-rentals/offers/${offerId}`),
  
  book: (data: any) =>
    api.post('/car-rentals/book', data),
};

// Currency API
export const currencyApi = {
  getCurrencies: () =>
    api.get('/currency'),
  
  detect: () =>
    api.get('/currency/detect'),
  
  getCurrency: (code: string) =>
    api.get(`/currency/${code}`),
  
  convert: (amount: number, from: string, to: string) =>
    api.post('/currency/convert', { amount, from, to }),
  
  getExchangeRate: (code: string) =>
    api.get(`/currency/exchange-rate/${code}`),
  
  getCountries: () =>
    api.get('/currency/countries/list'),
  
  // Admin
  updateCurrency: (id: string, data: any) =>
    api.put(`/currency/${id}`, data),
  
  createCurrency: (data: any) =>
    api.post('/currency', data),
  
  deleteCurrency: (id: string) =>
    api.delete(`/currency/${id}`),
  
  setDefaultCurrency: (id: string) =>
    api.put(`/currency/${id}/default`),
  
  refreshRates: () =>
    api.post('/currency/refresh-rates'),
};

// Site Settings API
export const settingsApi = {
  getPublic: () =>
    api.get('/settings/public'),
  
  getHeader: () =>
    api.get('/settings/header'),
  
  getFooter: () =>
    api.get('/settings/footer'),
  
  getBranding: () =>
    api.get('/settings/branding'),
  
  getSeo: () =>
    api.get('/settings/seo'),
  
  getGeneral: () =>
    api.get('/settings/general'),
  
  // Admin
  getAll: () =>
    api.get('/settings/all'),
  
  updateHeader: (data: any) =>
    api.put('/settings/header', data),
  
  updateFooter: (data: any) =>
    api.put('/settings/footer', data),
  
  updateBranding: (data: any) =>
    api.put('/settings/branding', data),
  
  updateSeo: (data: any) =>
    api.put('/settings/seo', data),
  
  updateGeneral: (data: any) =>
    api.put('/settings/general', data),
  
  // Platform Markup
  getPlatformMarkup: () =>
    api.get('/settings/platform-markup'),
  
  updatePlatformMarkup: (data: { percentage: number; enabled: boolean }) =>
    api.put('/settings/platform-markup', data),
};

// Content API (Pages & Blog)
export const contentApi = {
  // Public pages
  getPage: (slug: string) =>
    api.get(`/content/pages/${slug}`),
  
  // Public blog
  getBlogPosts: (params?: { category?: string; limit?: number; page?: number }) =>
    api.get('/content/blog', { params }),
  
  getBlogPost: (slug: string) =>
    api.get(`/content/blog/${slug}`),
  
  getFeaturedPosts: (limit?: number) =>
    api.get('/content/blog/featured', { params: { limit } }),
  
  getBlogCategories: () =>
    api.get('/content/blog/categories'),
  
  // Admin pages
  getAdminPages: (params?: { isPublished?: boolean }) =>
    api.get('/content/admin/pages', { params }),
  
  getAllPages: (params?: { isPublished?: boolean }) =>
    api.get('/content/admin/pages', { params }),
  
  getPageById: (id: string) =>
    api.get(`/content/admin/pages/${id}`),
  
  createPage: (data: any) =>
    api.post('/content/admin/pages', data),
  
  updatePage: (id: string, data: any) =>
    api.put(`/content/admin/pages/${id}`, data),
  
  deletePage: (id: string) =>
    api.delete(`/content/admin/pages/${id}`),
  
  // Admin blog
  getAdminBlogPosts: (params?: any) =>
    api.get('/content/admin/blog', { params }),
  
  getAllBlogPosts: (params?: any) =>
    api.get('/content/admin/blog', { params }),
  
  getBlogPostById: (id: string) =>
    api.get(`/content/admin/blog/${id}`),
  
  createBlogPost: (data: any) =>
    api.post('/content/admin/blog', data),
  
  updateBlogPost: (id: string, data: any) =>
    api.put(`/content/admin/blog/${id}`, data),
  
  deleteBlogPost: (id: string) =>
    api.delete(`/content/admin/blog/${id}`),
};

// eSIM API
export const esimApi = {
  getProducts: (params?: { country?: string; limit?: number; page?: number }) =>
    api.get('/esim/products', { params }),
  
  getProduct: (id: string) =>
    api.get(`/esim/products/${id}`),
  
  getDestinations: () =>
    api.get('/esim/destinations'),
  
  purchase: (productId: string, quantity?: number) =>
    api.post('/esim/purchase', { productId, quantity }),
  
  getOrders: (params?: { status?: string; search?: string; limit?: number; page?: number }) =>
    api.get('/esim/orders', { params }),
  
  getOrder: (id: string) =>
    api.get(`/esim/orders/${id}`),
  
  checkUsage: (orderId: string) =>
    api.get(`/esim/orders/${orderId}/usage`),
  
  // Admin
  updateOrderStatus: (orderId: string, status: string) =>
    api.put(`/esim/admin/orders/${orderId}/status`, { status }),
};

// Flight Change API
export const flightChangeApi = {
  createRequest: (data: any) =>
    api.post('/flight-change', data),
  
  getRequests: (params?: { status?: string; requestType?: string }) =>
    api.get('/flight-change', { params }),
  
  getRequest: (id: string) =>
    api.get(`/flight-change/${id}`),
  
  cancelRequest: (id: string) =>
    api.post(`/flight-change/${id}/cancel`),
  
  // Admin
  getAdminRequests: (params?: { status?: string; requestType?: string; limit?: number; page?: number }) =>
    api.get('/flight-change/admin/all', { params }),
  
  getAllRequests: (params?: { status?: string; requestType?: string; limit?: number }) =>
    api.get('/flight-change/admin/all', { params }),
  
  processRequest: (id: string, data: { status: string; adminNotes?: string; approvedRefundAmount?: number }) =>
    api.put(`/flight-change/admin/${id}/process`, data),
  
  getStats: () =>
    api.get('/flight-change/admin/stats'),
  
  markUnderReview: (id: string) =>
    api.put(`/flight-change/admin/${id}/review`),
  
  approveRequest: (id: string, data?: { adminNotes?: string; penaltyAmount?: number }) =>
    api.post(`/flight-change/admin/${id}/approve`, data),
  
  rejectRequest: (id: string, adminNotes?: string) =>
    api.post(`/flight-change/admin/${id}/reject`, { adminNotes }),
};

// Extended Admin API
export const adminExtendedApi = {
  // Customer management
  getCustomers: (params?: { search?: string; isActive?: boolean; limit?: number; page?: number }) =>
    api.get('/admin/customers', { params }),
  
  getCustomerDetails: (id: string) =>
    api.get(`/admin/customers/${id}`),
  
  updateCustomerStatus: (id: string, isActive: boolean) =>
    api.put(`/admin/customers/${id}/status`, { isActive }),
  
  getCustomerBookings: (id: string, params?: { status?: string; limit?: number }) =>
    api.get(`/admin/customers/${id}/bookings`, { params }),
  
  // B2B user management
  getB2BUsers: (params?: { status?: string; search?: string; limit?: number; page?: number }) =>
    api.get('/admin/b2b-users', { params }),
  
  getB2BUserDetails: (id: string) =>
    api.get(`/admin/b2b-users/${id}`),
  
  updateB2BUser: (id: string, data: any) =>
    api.put(`/admin/b2b-users/${id}`, data),
  
  getUserStats: () =>
    api.get('/admin/user-stats'),
};

// Sabre GDS API
export const sabreApi = {
  searchFlights: (params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    cabinClass?: string;
  }) => api.post('/sabre/search', params),
  
  getFlightDetails: (offerId: string) =>
    api.get(`/sabre/flights/${offerId}`),
  
  getSeatMap: (offerId: string) =>
    api.post('/sabre/seatmap', { offerId }),
  
  verifyPrice: (offerId: string) =>
    api.post('/sabre/verify-price', { offerId }),
  
  createBooking: (data: {
    offerId: string;
    passengers: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender: string;
      passportNumber?: string;
      passportExpiry?: string;
      nationality?: string;
    }>;
    contactInfo: {
      email: string;
      phone: string;
    };
  }) => api.post('/sabre/book', data),
  
  getPNR: (recordLocator: string) =>
    api.get(`/sabre/pnr/${recordLocator}`),
  
  cancelBooking: (recordLocator: string) =>
    api.post(`/sabre/cancel/${recordLocator}`),
  
  getAirlines: () =>
    api.get('/sabre/airlines'),
  
  getAirports: (query?: string) =>
    api.get('/sabre/airports', { params: { query } }),
  
  getFlightStatus: (params: {
    flightNumber: string;
    departureDate: string;
    airline: string;
  }) => api.get('/sabre/flight-status', { params }),
  
  issueTicket: (recordLocator: string) =>
    api.post('/sabre/issue-ticket', { recordLocator }),
  
  getFareRules: (offerId: string) =>
    api.post('/sabre/fare-rules', { offerId }),
};

export default api;

// ============================================================================
// ADMIN API MANAGEMENT (Amadeus, Sabre, Hotels, eSIM, etc.)
// ============================================================================
export const adminApiManagementApi = {
  getProviders: (params?: { type?: string }) =>
    api.get('/admin-extended/api-providers', { params }),
  
  toggleProvider: (id: string, isEnabled: boolean) =>
    api.put(`/admin-extended/api-providers/${id}/toggle`, { isEnabled }),
  
  testConnection: (id: string) =>
    api.post(`/admin-extended/api-providers/${id}/test`),
  
  updateConfig: (id: string, config: any) =>
    api.put(`/admin-extended/api-providers/${id}/config`, config),
  
  setPrimary: (id: string, type: string) =>
    api.put(`/admin-extended/api-providers/${id}/primary`, { type }),
};

// ============================================================================
// ADMIN PAYMENT GATEWAY MANAGEMENT
// ============================================================================
export const adminPaymentGatewayApi = {
  getGateways: () =>
    api.get('/admin-extended/payment-gateways'),
  
  toggleGateway: (id: string, isEnabled: boolean) =>
    api.put(`/admin-extended/payment-gateways/${id}/toggle`, { isEnabled }),
  
  testGateway: (id: string) =>
    api.post(`/admin-extended/payment-gateways/${id}/test`),
  
  updateConfig: (id: string, config: any) =>
    api.put(`/admin-extended/payment-gateways/${id}/config`, config),
};

// ============================================================================
// ADMIN POPULAR DESTINATIONS
// ============================================================================
export const adminPopularDestinationsApi = {
  getAll: () =>
    api.get('/admin-extended/popular-destinations'),
  
  create: (data: any) =>
    api.post('/admin-extended/popular-destinations', data),
  
  update: (id: string, data: any) =>
    api.put(`/admin-extended/popular-destinations/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/admin-extended/popular-destinations/${id}`),
  
  toggle: (id: string, isActive: boolean) =>
    api.put(`/admin-extended/popular-destinations/${id}/toggle`, { isActive }),
};

// ============================================================================
// ADMIN ESIM COMMISSION & MARKUP
// ============================================================================
export const adminEsimCommissionApi = {
  getRules: () =>
    api.get('/admin-extended/esim-commission'),
  
  createRule: (data: any) =>
    api.post('/admin-extended/esim-commission', data),
  
  updateRule: (id: string, data: any) =>
    api.put(`/admin-extended/esim-commission/${id}`, data),
  
  deleteRule: (id: string) =>
    api.delete(`/admin-extended/esim-commission/${id}`),
  
  toggleRule: (id: string, isActive: boolean) =>
    api.put(`/admin-extended/esim-commission/${id}/toggle`, { isActive }),
};

// ============================================================================
// ADMIN BOOKING CUSTOMIZATION
// ============================================================================
export const adminBookingCustomizationApi = {
  updateBooking: (id: string, data: any) =>
    api.put(`/admin-extended/bookings/${id}/customize`, data),
};
