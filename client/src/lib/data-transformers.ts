/**
 * Data transformation utilities to standardize property names and types
 * between API responses and UI components
 */

// ===== API Response Types (from backend) =====
export interface ApiService {
  id: string;
  name: string;
  description?: string;
  price: number;           // integer from DB
  isActive: boolean;       // boolean from DB
  icon?: string;
  category?: string;
  createdAt: string;       // ISO string
  updatedAt: string;       // ISO string
}

export interface ApiBooking {
  id: string;
  conversationId?: string;
  serviceId?: string;
  phoneNumber?: string;
  customerName?: string | null;
  customer_name?: string | null;    // From salon API
  customer_phone?: string | null;   // From salon API
  customer_email?: string | null;   // From salon API
  service_name?: string | null;     // From salon API
  service_category?: string | null; // From salon API
  staff_id?: string | null;         // From salon API
  amount: number;          // integer from DB
  status: string;
  payment_status?: string | null;   // From salon API
  paymentMethod?: string | null;
  payment_method?: string | null;   // From salon API
  paymentReference?: string | null;
  appointmentDate?: string | null;  // ISO string or null
  appointmentTime?: string | null;  // "11:30 AM" format or null
  scheduled_at?: string | null;     // ISO string from salon API
  duration_minutes?: number | null; // From salon API
  currency?: string | null;         // From salon API
  notes?: string | null;
  createdAt?: string;       // ISO string
  updatedAt?: string;       // ISO string
  created_at?: string;      // From salon API
  updated_at?: string;      // From salon API
}

// ===== UI Component Types (what components expect) =====
export interface UIService {
  id: string;
  name: string;
  description?: string;
  base_price: number;      // UI expects base_price
  is_active: boolean;      // UI expects is_active
  icon?: string;
  category?: string;
  duration_minutes?: number; // UI expects duration_minutes (default 60)
  currency?: string;       // UI expects currency (default INR)
  addOns?: string[];       // UI expects addOns array
  createdAt?: string;
  updatedAt?: string;
}

export interface UIBooking {
  id: string;
  conversationId?: string;
  serviceId?: string;
  phoneNumber?: string;
  customer_name?: string;  // UI expects customer_name
  amount: number;
  status: string;
  paymentMethod?: string;
  paymentReference?: string;
  scheduled_at?: string;   // UI expects scheduled_at (ISO string)
  appointmentTime?: string; // UI expects appointmentTime
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Additional UI-specific fields
  service?: string;        // service name for display
  staff?: string;          // staff name for display
  duration?: number;       // duration in minutes for display
  time?: string;           // formatted time for display
  // Salon API specific fields
  service_name?: string;
  service_category?: string;
  staff_id?: string;
  customer_phone?: string;
  customer_email?: string;
  duration_minutes?: number;
  currency?: string;
  payment_status?: string;
  payment_method?: string;
}

// ===== Transformation Functions =====

/**
 * Transform API service to UI service format
 */
export function transformApiServiceToUI(apiService: ApiService): UIService {
  return {
    id: apiService.id,
    name: apiService.name,
    description: apiService.description,
    base_price: apiService.price,           // price -> base_price
    is_active: apiService.isActive,         // isActive -> is_active
    icon: apiService.icon,
    category: apiService.category,
    duration_minutes: 60,                   // default duration
    currency: 'INR',                        // default currency for India
    addOns: [],                             // default empty addOns
    createdAt: apiService.createdAt,
    updatedAt: apiService.updatedAt,
  };
}

/**
 * Transform UI service to API service format
 */
export function transformUIServiceToAPI(uiService: Partial<UIService>): Partial<ApiService> {
  return {
    id: uiService.id,
    name: uiService.name,
    description: uiService.description,
    base_price: uiService.base_price,       // Keep base_price as base_price
    is_active: uiService.is_active,         // Keep is_active as is_active
    icon: uiService.icon,
    category: uiService.category,
    subcategory: uiService.subcategory,
    currency: uiService.currency || 'USD',
    duration_minutes: uiService.duration_minutes,
    display_order: uiService.display_order || 0,
    tags: uiService.tags || [],
    images: uiService.images || []
  };
}

/**
 * Transform API booking to UI booking format
 */
export function transformApiBookingToUI(apiBooking: ApiBooking): UIBooking {
  // Format appointment date/time for UI
  let scheduled_at: string | undefined;
  let time: string | undefined;
  
  // Check for scheduled_at field (from salon API) or appointmentDate (from other APIs)
  if (apiBooking.scheduled_at) {
    scheduled_at = apiBooking.scheduled_at;
    // Extract time from the scheduled_at datetime
    const date = new Date(apiBooking.scheduled_at);
    time = date.toLocaleTimeString('en-IN', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  } else if (apiBooking.appointmentDate) {
    scheduled_at = apiBooking.appointmentDate;
    // Extract time from appointmentTime if available
    time = apiBooking.appointmentTime || undefined;
  }

  return {
    id: apiBooking.id,
    conversationId: apiBooking.conversationId,
    serviceId: apiBooking.serviceId,
    phoneNumber: apiBooking.phoneNumber || apiBooking.customer_phone,
    customer_name: apiBooking.customer_name || apiBooking.customerName || undefined,  // Handle both formats
    amount: apiBooking.amount,
    status: apiBooking.payment_status || apiBooking.status,  // Handle both formats
    paymentMethod: apiBooking.payment_method || apiBooking.paymentMethod || undefined,
    paymentReference: apiBooking.paymentReference || undefined,
    scheduled_at: scheduled_at,              // appointmentDate -> scheduled_at
    appointmentTime: apiBooking.appointmentTime || undefined,
    notes: apiBooking.notes || undefined,
    createdAt: apiBooking.created_at || apiBooking.createdAt,
    updatedAt: apiBooking.updated_at || apiBooking.updatedAt,
    // Additional UI fields - include salon API fields
    service: apiBooking.service_name,        // Use service_name from salon API
    staff: undefined,                        // will be populated by staff lookup
    duration: apiBooking.duration_minutes || 60,  // Use duration_minutes from salon API
    time: time,                             // formatted time
    // Include all salon API fields for calendar display
    service_name: apiBooking.service_name,
    service_category: apiBooking.service_category,
    staff_id: apiBooking.staff_id,
    customer_phone: apiBooking.customer_phone,
    customer_email: apiBooking.customer_email,
    duration_minutes: apiBooking.duration_minutes,
    currency: apiBooking.currency,
    payment_status: apiBooking.payment_status,
    payment_method: apiBooking.payment_method,
  };
}

/**
 * Transform UI booking to API booking format
 */
export function transformUIBookingToAPI(uiBooking: Partial<UIBooking>): Partial<ApiBooking> {
  return {
    id: uiBooking.id,
    conversationId: uiBooking.conversationId,
    serviceId: uiBooking.serviceId,
    phoneNumber: uiBooking.phoneNumber,
    customerName: uiBooking.customer_name,   // customer_name -> customerName
    amount: uiBooking.amount,
    status: uiBooking.status,
    paymentMethod: uiBooking.paymentMethod,
    paymentReference: uiBooking.paymentReference,
    appointmentDate: uiBooking.scheduled_at, // scheduled_at -> appointmentDate
    appointmentTime: uiBooking.appointmentTime,
    notes: uiBooking.notes,
  };
}

// ===== Type Guards =====

/**
 * Check if an object is an API service
 */
export function isApiService(obj: any): obj is ApiService {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.isActive === 'boolean';
}

/**
 * Check if an object is an API booking
 */
export function isApiBooking(obj: any): obj is ApiBooking {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.status === 'string';
}

// ===== Utility Functions =====

/**
 * Transform array of API services to UI services
 */
export function transformApiServicesToUI(apiServices: ApiService[]): UIService[] {
  return apiServices.map(transformApiServiceToUI);
}

/**
 * Transform array of API bookings to UI bookings
 */
export function transformApiBookingsToUI(apiBookings: ApiBooking[]): UIBooking[] {
  return apiBookings.map(transformApiBookingToUI);
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    // For INR, amount is already in rupees (not paise)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  // For other currencies, convert from cents
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  // If already formatted (e.g., "11:30 AM"), return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  // If ISO string, extract time portion
  if (timeString.includes('T')) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }
  
  // If HH:MM format, convert to 12-hour
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format Indian phone number for display
 */
export function formatIndianPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.length === 10) {
    // Format as: 98765 43210
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // Format as: +91 98765 43210
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Format as: 098765 43210
    return `${cleaned.slice(0, 6)} ${cleaned.slice(6)}`;
  }
  
  return phoneNumber; // Return original if format is not recognized
}

/**
 * Validate Indian phone number
 */
export function validateIndianPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
  if (cleaned.length === 10) {
    return /^[6-9]\d{9}$/.test(cleaned);
  }
  
  // With country code +91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(cleaned);
  }
  
  // With leading 0
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return /^0[6-9]\d{9}$/.test(cleaned);
  }
  
  return false;
}
