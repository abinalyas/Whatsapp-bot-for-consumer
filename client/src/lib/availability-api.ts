/**
 * Availability API client for staff availability and time slot management
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

// Availability Management API
export const availabilityApi = {
  // Get staff availability for a specific date
  async getStaffAvailability(staffId: string, date: string) {
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/${staffId}/availability`);
    return response.data;
  },

  // Update staff availability
  async updateStaffAvailability(staffId: string, availability: any[]) {
    const response = await apiCall<{ success: boolean; message: string }>(`/staff/${staffId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
    return response;
  },

  // Get available time slots for a staff member on a specific date
  async getAvailableSlots(staffId: string, date: string) {
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/${staffId}/available-slots?date=${date}`);
    return response.data;
  },

  // Get all staff availability for a date range
  async getAllStaffAvailability(startDate: string, endDate: string) {
    // This would be a new endpoint we need to create
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/availability?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Check if a specific time slot is available
  async checkSlotAvailability(staffId: string, date: string, time: string) {
    const slots = await this.getAvailableSlots(staffId, date);
    return slots.some(slot => slot.formatted_time === time);
  },

  // Get staff working hours for a specific day
  async getStaffWorkingHours(staffId: string, dayOfWeek: number) {
    const availability = await this.getStaffAvailability(staffId, '');
    return availability.find(avail => avail.day_of_week === dayOfWeek);
  },

  // Create default availability for a staff member
  async createDefaultAvailability(staffId: string, workingDays: number[] = [1, 2, 3, 4, 5]) {
    const defaultAvailability = workingDays.map(day => ({
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      break_start_time: '12:00',
      break_end_time: '13:00',
      max_appointments: 1
    }));

    return await this.updateStaffAvailability(staffId, defaultAvailability);
  },

  // Get staff schedule for a specific week
  async getStaffSchedule(staffId: string, weekStart: string) {
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/${staffId}/appointments?startDate=${weekStart}&endDate=${weekEnd}`);
    return response.data;
  },

  // Get all available staff for a specific time slot
  async getAvailableStaff(date: string, time: string, serviceId?: string) {
    // This would be a new endpoint that checks all staff availability
    const response = await apiCall<{ success: boolean; data: any[] }>(`/staff/available?date=${date}&time=${time}${serviceId ? `&serviceId=${serviceId}` : ''}`);
    return response.data;
  },

  // Bulk update staff availability
  async bulkUpdateAvailability(updates: { staffId: string; availability: any[] }[]) {
    const response = await apiCall<{ success: boolean; message: string }>('/staff/availability/bulk', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
    return response;
  }
};

// Time slot utilities
export const timeSlotUtils = {
  // Generate time slots between start and end time
  generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number = 30): string[] {
    const slots: string[] = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    let current = new Date(start);
    while (current < end) {
      slots.push(current.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }));
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    
    return slots;
  },

  // Check if a time slot conflicts with existing appointments
  hasConflict(slot: string, appointments: any[]): boolean {
    const slotTime = new Date(`2000-01-01T${slot}`);
    return appointments.some(apt => {
      const aptStart = new Date(apt.scheduled_at);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes * 60 * 1000));
      return slotTime >= aptStart && slotTime < aptEnd;
    });
  },

  // Get next available time slot
  getNextAvailableSlot(availableSlots: string[], appointments: any[]): string | null {
    for (const slot of availableSlots) {
      if (!this.hasConflict(slot, appointments)) {
        return slot;
      }
    }
    return null;
  },

  // Format time for display
  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  },

  // Convert time string to minutes from midnight
  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Convert minutes from midnight to time string
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
};

// Export all APIs
export const availability = {
  api: availabilityApi,
  utils: timeSlotUtils,
};
