/**
 * Indian localization configuration
 * Adapts the application for the Indian market
 */

// Indian phone number patterns
export const INDIAN_PHONE_PATTERNS = {
  MOBILE: /^[6-9]\d{9}$/, // 10 digits starting with 6, 7, 8, or 9
  WITH_COUNTRY_CODE: /^91[6-9]\d{9}$/, // +91 prefix
  WITH_LEADING_ZERO: /^0[6-9]\d{9}$/, // 0 prefix
} as const;

// Indian states and cities for address forms
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
] as const;

// Major Indian cities
export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
  'Kolkata', 'Pune', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
  'Varanasi', 'Srinagar', 'Aurangabad', 'Navi Mumbai', 'Solapur'
] as const;

// Indian payment methods
export const INDIAN_PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', popular: true },
  { value: 'paytm', label: 'Paytm', popular: true },
  { value: 'phonepe', label: 'PhonePe', popular: true },
  { value: 'gpay', label: 'Google Pay', popular: true },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'cash', label: 'Cash' },
  { value: 'wallet', label: 'Digital Wallet' },
] as const;

// Indian business types for salon/spa industry
export const INDIAN_BUSINESS_TYPES = [
  'Beauty Salon',
  'Hair Salon',
  'Spa & Wellness',
  'Nail Studio',
  'Barber Shop',
  'Unisex Salon',
  'Bridal Makeup',
  'Skin Clinic',
  'Massage Center',
  'Ayurvedic Spa'
] as const;

// Indian service categories
export const INDIAN_SERVICE_CATEGORIES = [
  'Hair Care',
  'Skin Care',
  'Nail Care',
  'Massage',
  'Bridal',
  'Men\'s Grooming',
  'Ayurvedic',
  'Facial',
  'Waxing',
  'Threading'
] as const;

// Indian time zones
export const INDIAN_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)', offset: '+05:30' },
  { value: 'Asia/Kolkata', label: 'Kolkata', offset: '+05:30' },
  { value: 'Asia/Kolkata', label: 'Mumbai', offset: '+05:30' },
  { value: 'Asia/Kolkata', label: 'Delhi', offset: '+05:30' },
  { value: 'Asia/Kolkata', label: 'Bangalore', offset: '+05:30' },
  { value: 'Asia/Kolkata', label: 'Chennai', offset: '+05:30' }
] as const;

// Indian date formats
export const INDIAN_DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY', // Indian standard
  INPUT: 'YYYY-MM-DD',   // ISO format for inputs
  LONG: 'DD MMMM YYYY',  // Long format with month name
  SHORT: 'DD/MM/YY',     // Short format
} as const;

// Indian number formatting
export const INDIAN_NUMBER_FORMATTING = {
  CURRENCY: {
    style: 'currency',
    currency: 'INR',
    locale: 'en-IN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  NUMBER: {
    locale: 'en-IN',
    useGrouping: true,
  }
} as const;

// Indian business hours (common for salons)
export const INDIAN_BUSINESS_HOURS = {
  WEEKDAYS: { start: '09:00', end: '21:00' },
  SATURDAY: { start: '09:00', end: '20:00' },
  SUNDAY: { start: '10:00', end: '18:00' },
} as const;

// Indian holidays (major ones that might affect business)
export const INDIAN_HOLIDAYS = [
  'Republic Day', 'Holi', 'Good Friday', 'Eid', 'Independence Day',
  'Ganesh Chaturthi', 'Dussehra', 'Diwali', 'Guru Nanak Jayanti', 'Christmas'
] as const;

// Indian address format
export const INDIAN_ADDRESS_FORMAT = {
  FIELDS: ['addressLine1', 'addressLine2', 'landmark', 'city', 'state', 'pincode'],
  PINCODE_PATTERN: /^[1-9][0-9]{5}$/, // 6-digit pincode
  REQUIRED_FIELDS: ['addressLine1', 'city', 'state', 'pincode'],
} as const;

// Indian GST configuration
export const INDIAN_GST_CONFIG = {
  ENABLED: true,
  RATES: {
    SERVICES: 18, // 18% GST on services
    GOODS: 12,    // 12% GST on goods
    EXEMPT: 0,    // Exempt from GST
  },
  THRESHOLD: 20000000, // 2 crores threshold for GST registration
} as const;

// Utility functions for Indian localization
export const IndianLocalizationUtils = {
  /**
   * Format Indian phone number
   */
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  },

  /**
   * Validate Indian phone number
   */
  validatePhoneNumber: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return INDIAN_PHONE_PATTERNS.MOBILE.test(cleaned) ||
           INDIAN_PHONE_PATTERNS.WITH_COUNTRY_CODE.test(cleaned) ||
           INDIAN_PHONE_PATTERNS.WITH_LEADING_ZERO.test(cleaned);
  },

  /**
   * Format Indian currency
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat(
      INDIAN_NUMBER_FORMATTING.CURRENCY.locale,
      INDIAN_NUMBER_FORMATTING.CURRENCY
    ).format(amount);
  },

  /**
   * Format Indian date
   */
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Get current IST time
   */
  getISTTime: (): Date => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  },

  /**
   * Validate Indian pincode
   */
  validatePincode: (pincode: string): boolean => {
    return INDIAN_ADDRESS_FORMAT.PINCODE_PATTERN.test(pincode);
  }
};
