/**
 * Salon API client for connecting to database endpoints
 */

const API_BASE_URL = '/api/salon';

// Default tenant ID for Bella Salon
const DEFAULT_TENANT_ID = 'bella-salon';

// Helper function to make API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging
  console.log(`🔍 API Call: ${options.method || 'GET'} ${url}`);
  console.log(`🔍 Full URL: ${window.location.origin}${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': DEFAULT_TENANT_ID,
      ...options.headers,
    },
  });

  console.log(`🔍 API Response: ${response.status} ${response.statusText} for ${url}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ API Success: ${options.method || 'GET'} ${url}`, data);
  return data;
}

// Service Management API
export const salonServicesApi = {
  // Get all services
  async getAll() {
    const response = await apiCall<{ success: boolean; data: any[] }>('/services');
    return response.data;
  },

  // Create new service
  async create(service: {
    name: string;
    description?: string;
    category?: string;
    subcategory?: string;
    base_price: number;
    currency?: string;
    duration_minutes?: number;
    is_active?: boolean;
    display_order?: number;
    tags?: string[];
    images?: any[];
  }) {
    const response = await apiCall<{ success: boolean; data: any }>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    return response.data;
  },

  // Update service
  async update(id: string, service: Partial<{
    name: string;
    description: string;
    category: string;
    subcategory: string;
    base_price: number;
    currency: string;
    duration_minutes: number;
    is_active: boolean;
    display_order: number;
    tags: string[];
    images: any[];
  }>) {
    const response = await apiCall<{ success: boolean; data: any }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
    return response.data;
  },

  // Delete service
  async delete(id: string) {
    const response = await apiCall<{ success: boolean; message: string }>(`/services/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
};

// Appointments Management API
export const salonAppointmentsApi = {
  // Get all appointments
  async getAll(filters?: { date?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';
    
    const response = await apiCall<{ success: boolean; data: any[] }>(endpoint);
    return response.data;
  },

  // Create new appointment
  async create(appointment: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    service_id: string;
    scheduled_at: string;
    duration_minutes?: number;
    amount: number;
    currency?: string;
    notes?: string;
  }) {
    const response = await apiCall<{ success: boolean; data: any }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return response.data;
  },

  // Update appointment
  async update(id: string, appointment: Partial<{
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    service_id: string;
    scheduled_at: string;
    duration_minutes: number;
    amount: number;
    currency: string;
    notes: string;
    payment_status: string;
  }>) {
    const response = await apiCall<{ success: boolean; data: any }>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
    return response.data;
  },

  // Delete appointment
  async delete(id: string) {
    const response = await apiCall<{ success: boolean; message: string }>(`/appointments/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
};

// Dashboard Stats API
export const salonStatsApi = {
  // Get dashboard stats
  async getStats() {
    const response = await apiCall<{ success: boolean; data: any }>('/stats');
    return response.data;
  },
};

// Export all APIs
export const salonApi = {
  services: salonServicesApi,
  appointments: salonAppointmentsApi,
  stats: salonStatsApi,
};
