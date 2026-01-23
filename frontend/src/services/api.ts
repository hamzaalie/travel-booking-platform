import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// IMPORTANT: API Base URL - Railway backend with /api prefix
// Last updated: 2026-01-22 - Fixed missing /api suffix
const RAILWAY_BACKEND = 'https://web-production-b72c0.up.railway.app';
const API_URL = import.meta.env.VITE_API_URL || `${RAILWAY_BACKEND}/api`;

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

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            localStorage.setItem('accessToken', data.data.accessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
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
  
  verifyDocument: (documentId: string, action: 'VERIFIED' | 'REJECTED', rejectionReason?: string) =>
    api.post(`/admin/documents/${documentId}/verify`, { action, rejectionReason }),
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

export default api;
