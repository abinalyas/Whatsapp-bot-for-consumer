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
  conversationId: string;
  serviceId: string;
  phoneNumber: string;
  customerName?: string | null;
  amount: number;          // integer from DB
  status: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  appointmentDate?: string | null;  // ISO string or null
  appointmentTime?: string | null;  // "11:30 AM" format or null
  notes?: string | null;
  createdAt: string;       // ISO string
  updatedAt: string;       // ISO string
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
    price: uiService.base_price,            // base_price -> price
    isActive: uiService.is_active,          // is_active -> isActive
    icon: uiService.icon,
    category: uiService.category,
  };
}

/**
 * Transform API booking to UI booking format
 */
export function transformApiBookingToUI(apiBooking: ApiBooking): UIBooking {
  // Format appointment date/time for UI
  let scheduled_at: string | undefined;
  let time: string | undefined;
  
  if (apiBooking.appointmentDate) {
    scheduled_at = apiBooking.appointmentDate;
    // Extract time from appointmentTime if available
    time = apiBooking.appointmentTime || undefined;
  }

  return {
    id: apiBooking.id,
    conversationId: apiBooking.conversationId,
    serviceId: apiBooking.serviceId,
    phoneNumber: apiBooking.phoneNumber,
    customer_name: apiBooking.customerName || undefined,  // customerName -> customer_name
    amount: apiBooking.amount,
    status: apiBooking.status,
    paymentMethod: apiBooking.paymentMethod || undefined,
    paymentReference: apiBooking.paymentReference || undefined,
    scheduled_at: scheduled_at,              // appointmentDate -> scheduled_at
    appointmentTime: apiBooking.appointmentTime || undefined,
    notes: apiBooking.notes || undefined,
    createdAt: apiBooking.createdAt,
    updatedAt: apiBooking.updatedAt,
    // Additional UI fields
    service: undefined,                      // will be populated by service lookup
    staff: undefined,                        // will be populated by staff lookup
    duration: 60,                           // default duration
    time: time,                             // formatted time
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
