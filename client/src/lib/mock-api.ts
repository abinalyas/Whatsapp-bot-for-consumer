/**
 * Mock API for testing business configuration UI
 * This simulates the backend API responses for development/testing
 */

// Mock data
const mockBusinessTypes = [
  {
    id: 'restaurant-1',
    name: 'Restaurant',
    description: 'Full-service restaurant with table service, takeout, and delivery options',
    category: 'restaurant',
    terminology: {
      service: 'Menu Item',
      booking: 'Order',
      customer: 'Customer',
      staff: 'Staff',
      location: 'Restaurant',
      category: 'Menu Category',
      price: 'Price',
      duration: 'Prep Time',
      status: 'Order Status',
      payment: 'Payment',
    },
    customFields: [
      {
        name: 'Dietary Restrictions',
        type: 'multiselect',
        isRequired: false,
        options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'],
        description: 'Customer dietary preferences and restrictions',
      },
      {
        name: 'Spice Level',
        type: 'select',
        isRequired: false,
        options: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
        description: 'Preferred spice level for dishes',
      },
      {
        name: 'Special Instructions',
        type: 'textarea',
        isRequired: false,
        description: 'Any special cooking instructions or requests',
      },
      {
        name: 'Table Number',
        type: 'number',
        isRequired: false,
        description: 'Table number for dine-in orders',
      },
    ],
    workflows: [
      {
        name: 'Order Processing',
        states: ['Received', 'Preparing', 'Ready', 'Delivered'],
      },
      {
        name: 'Table Reservation',
        states: ['Requested', 'Confirmed', 'Seated', 'Completed'],
      },
    ],
    metadata: {
      industry: 'Food & Beverage',
      complexity: 'medium',
      features: ['ordering', 'reservations', 'delivery'],
    },
  },
  {
    id: 'clinic-1',
    name: 'Healthcare Clinic',
    description: 'Medical clinic providing consultations, treatments, and health services',
    category: 'healthcare',
    terminology: {
      service: 'Treatment',
      booking: 'Appointment',
      customer: 'Patient',
      staff: 'Doctor',
      location: 'Clinic',
      category: 'Department',
      price: 'Fee',
      duration: 'Appointment Duration',
      status: 'Appointment Status',
      payment: 'Bill',
    },
    customFields: [
      {
        name: 'Medical History',
        type: 'textarea',
        isRequired: false,
        description: 'Brief medical history and current conditions',
      },
      {
        name: 'Insurance Provider',
        type: 'select',
        isRequired: false,
        options: ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth', 'Self-Pay'],
        description: 'Patient insurance provider',
      },
      {
        name: 'Emergency Contact',
        type: 'phone',
        isRequired: true,
        description: 'Emergency contact phone number',
      },
      {
        name: 'Preferred Doctor',
        type: 'select',
        isRequired: false,
        options: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Any Available'],
        description: 'Preferred healthcare provider',
      },
    ],
    workflows: [
      {
        name: 'Appointment Booking',
        states: ['Requested', 'Confirmed', 'In Progress', 'Completed'],
      },
      {
        name: 'Treatment Plan',
        states: ['Assessment', 'Planning', 'Treatment', 'Follow-up'],
      },
    ],
    metadata: {
      industry: 'Healthcare',
      complexity: 'high',
      features: ['appointments', 'patient-records', 'billing'],
    },
  },
  {
    id: 'retail-1',
    name: 'Retail Store',
    description: 'Physical and online retail store selling products to consumers',
    category: 'retail',
    terminology: {
      service: 'Product',
      booking: 'Order',
      customer: 'Customer',
      staff: 'Sales Associate',
      location: 'Store',
      category: 'Product Category',
      price: 'Price',
      duration: 'Delivery Time',
      status: 'Order Status',
      payment: 'Payment',
    },
    customFields: [
      {
        name: 'Size',
        type: 'select',
        isRequired: false,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        description: 'Product size selection',
      },
      {
        name: 'Color Preference',
        type: 'select',
        isRequired: false,
        options: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'],
        description: 'Preferred product color',
      },
      {
        name: 'Gift Message',
        type: 'textarea',
        isRequired: false,
        description: 'Message for gift wrapping',
      },
      {
        name: 'Loyalty Member',
        type: 'checkbox',
        isRequired: false,
        description: 'Customer is a loyalty program member',
      },
    ],
    workflows: [
      {
        name: 'Order Fulfillment',
        states: ['Placed', 'Processing', 'Shipped', 'Delivered'],
      },
      {
        name: 'Return Process',
        states: ['Requested', 'Approved', 'Received', 'Refunded'],
      },
    ],
    metadata: {
      industry: 'Retail',
      complexity: 'medium',
      features: ['inventory', 'shipping', 'returns'],
    },
  },
  {
    id: 'salon-1',
    name: 'Beauty Salon',
    description: 'Full-service beauty salon offering hair, nail, and beauty treatments',
    category: 'beauty',
    terminology: {
      service: 'Treatment',
      booking: 'Appointment',
      customer: 'Client',
      staff: 'Stylist',
      location: 'Salon',
      category: 'Service Category',
      price: 'Rate',
      duration: 'Service Duration',
      status: 'Appointment Status',
      payment: 'Payment',
    },
    customFields: [
      {
        name: 'Hair Type',
        type: 'select',
        isRequired: false,
        options: ['Straight', 'Wavy', 'Curly', 'Coily'],
        description: 'Client hair type',
      },
      {
        name: 'Allergies',
        type: 'textarea',
        isRequired: false,
        description: 'Known allergies to products or chemicals',
      },
      {
        name: 'Preferred Stylist',
        type: 'select',
        isRequired: false,
        options: ['Sarah', 'Mike', 'Jessica', 'Any Available'],
        description: 'Preferred service provider',
      },
      {
        name: 'Previous Color Treatment',
        type: 'text',
        isRequired: false,
        description: 'Details of previous hair color treatments',
      },
    ],
    workflows: [
      {
        name: 'Appointment Booking',
        states: ['Requested', 'Confirmed', 'In Service', 'Completed'],
      },
      {
        name: 'Treatment Process',
        states: ['Consultation', 'Preparation', 'Treatment', 'Styling'],
      },
    ],
    metadata: {
      industry: 'Beauty & Wellness',
      complexity: 'medium',
      features: ['appointments', 'client-profiles', 'service-tracking'],
    },
  },
];

let mockTenantConfig: any = null;

// Mock API functions
export const mockApi = {
  // Get business types
  getBusinessTypes: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return {
      success: true,
      data: mockBusinessTypes,
    };
  },

  // Get tenant configuration
  getTenantConfig: async (tenantId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!mockTenantConfig) {
      return {
        success: false,
        error: { code: 'TENANT_CONFIG_NOT_FOUND', message: 'Tenant configuration not found' },
      };
    }

    return {
      success: true,
      data: mockTenantConfig,
    };
  },

  // Create or update tenant configuration
  saveTenantConfig: async (tenantId: string, config: any) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate save delay

    if (!mockTenantConfig) {
      // Create new config
      mockTenantConfig = {
        id: `config-${Date.now()}`,
        tenantId,
        businessTypeId: config.businessTypeId,
        businessName: config.businessName || 'My Business',
        customTerminology: config.customTerminology || {},
        branding: config.branding || {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
        },
        customFields: config.customFields || [],
        settings: config.settings || {},
        isConfigured: config.isConfigured || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Update existing config
      mockTenantConfig = {
        ...mockTenantConfig,
        ...config,
        updatedAt: new Date(),
      };
    }

    return {
      success: true,
      data: mockTenantConfig,
    };
  },
};

// Override fetch for mock API
export const setupMockApi = () => {
  const originalFetch = window.fetch;

  window.fetch = async (url: string | URL, options?: RequestInit) => {
    const urlString = url.toString();

    // Mock business types endpoint
    if (urlString.includes('/api/business-config/business-types') && (!options || options.method === 'GET')) {
      const response = await mockApi.getBusinessTypes();
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mock tenant config GET endpoint
    if (urlString.includes('/api/business-config/tenant-config') && (!options || options.method === 'GET')) {
      const tenantId = 'demo-tenant-id'; // Extract from headers in real implementation
      const response = await mockApi.getTenantConfig(tenantId);
      return new Response(JSON.stringify(response), {
        status: response.success ? 200 : 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mock tenant config POST/PUT endpoint
    if (urlString.includes('/api/business-config/tenant-config') && options && ['POST', 'PUT'].includes(options.method || '')) {
      const tenantId = 'demo-tenant-id'; // Extract from headers in real implementation
      const body = options.body ? JSON.parse(options.body as string) : {};
      const response = await mockApi.saveTenantConfig(tenantId, body);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fall back to original fetch for other requests
    return originalFetch(url, options);
  };
};

// Reset mock data (useful for testing)
export const resetMockData = () => {
  mockTenantConfig = null;
};