/**
 * Staff API client for staff management
 */

const API_BASE_URL = '/api/staff';

// Default tenant ID for Bella Salon
const DEFAULT_TENANT_ID = 'bella-salon';

// Helper function to make API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': DEFAULT_TENANT_ID,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Staff Management API
export const staffApi = {
  // Get all staff members
  async getAll() {
    const response = await apiCall<{ success: boolean; data: any[] }>('/staff');
    return response.data;
  },

  // Create new staff member
  async create(staff: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    specializations?: string[];
    working_hours?: any;
    hourly_rate?: number;
    commission_rate?: number;
    hire_date?: string;
    notes?: string;
    avatar_url?: string;
  }) {
    const response = await apiCall<{ success: boolean; data: any }>('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
    return response.data;
  },

  // Update staff member
  async update(id: string, staff: Partial<{
    name: string;
    email: string;
    phone: string;
    role: string;
    specializations: string[];
    working_hours: any;
    hourly_rate: number;
    commission_rate: number;
    is_active: boolean;
    notes: string;
    avatar_url: string;
  }>) {
    const response = await apiCall<{ success: boolean; data: any }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
    return response.data;
  },

  // Delete staff member
  async delete(id: string) {
    const response = await apiCall<{ success: boolean; message: string }>(`/staff/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Get staff availability
  async getAvailability(id: string) {
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/${id}/availability`);
    return response.data;
  },

  // Update staff availability
  async updateAvailability(id: string, availability: any[]) {
    const response = await apiCall<{ success: boolean; message: string }>(`/staff/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
    return response;
  },

  // Get staff appointments
  async getAppointments(id: string, filters?: { date?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/staff/${id}/appointments?${queryString}` : `/staff/${id}/appointments`;
    
    const response = await apiCall<{ success: boolean; data: any[] }>(endpoint);
    return response.data;
  },

  // Get available time slots
  async getAvailableSlots(id: string, date: string) {
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/${id}/available-slots?date=${date}`);
    return response.data;
  },

  // Get staff stats
  async getStats(id: string, period?: string) {
    const params = period ? `?period=${period}` : '';
    const response = await apiCall<{ success: boolean; data: any }>(`/staff/${id}/stats${params}`);
    return response.data;
  },
};
