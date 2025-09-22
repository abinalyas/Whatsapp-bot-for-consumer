/**
 * Business Configuration API
 * Provides business configuration data for customer-facing pages
 */

export interface BusinessConfig {
  id: string;
  businessName: string;
  businessType: {
    id: string;
    name: string;
    category: string;
    terminology: Record<string, string>;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  offerings: Array<{
    id: string;
    name: string;
    description: string;
    basePrice: number;
    duration?: number;
    category: string;
    isActive: boolean;
    variants?: Array<{
      id: string;
      name: string;
      priceModifier: number;
    }>;
  }>;
}

// Mock business configurations for different business types
const businessConfigs: Record<string, BusinessConfig> = {
  'restaurant': {
    id: 'demo-restaurant-001',
    businessName: 'Spark Restaurant',
    businessType: {
      id: '1',
      name: 'Restaurant',
      category: 'Food & Beverage',
      terminology: {
        offering: 'Menu Item',
        transaction: 'Order',
        customer: 'Diner',
        booking: 'Reservation'
      }
    },
    branding: {
      primaryColor: '#f97316',
      secondaryColor: '#64748b'
    },
    contact: {
      phone: '+1 (555) 123-4567',
      email: 'hello@sparkrestaurant.com',
      address: '123 Food Street, Restaurant City, RC 12345'
    },
    offerings: [
      {
        id: '1',
        name: 'Grilled Chicken',
        description: 'Perfectly grilled chicken with herbs and spices',
        basePrice: 18,
        category: 'Main Course',
        isActive: true,
        variants: [
          { id: '1a', name: 'Regular', priceModifier: 0 },
          { id: '1b', name: 'Large', priceModifier: 5 }
        ]
      },
      {
        id: '2',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with caesar dressing',
        basePrice: 12,
        category: 'Salads',
        isActive: true
      },
      {
        id: '3',
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon and parmesan',
        basePrice: 16,
        category: 'Pasta',
        isActive: true
      }
    ]
  },
  'clinic': {
    id: 'demo-clinic-001',
    businessName: 'Spark Medical Clinic',
    businessType: {
      id: '3',
      name: 'Medical Clinic',
      category: 'Healthcare',
      terminology: {
        offering: 'Treatment',
        transaction: 'Appointment',
        customer: 'Patient',
        booking: 'Appointment'
      }
    },
    branding: {
      primaryColor: '#10b981',
      secondaryColor: '#64748b'
    },
    contact: {
      phone: '+1 (555) 123-4567',
      email: 'appointments@sparkclinic.com',
      address: '123 Health Street, Medical City, MC 12345'
    },
    offerings: [
      {
        id: '1',
        name: 'General Consultation',
        description: 'Comprehensive health checkup with our doctors',
        basePrice: 85,
        duration: 30,
        category: 'Consultation',
        isActive: true
      },
      {
        id: '2',
        name: 'Blood Test',
        description: 'Complete blood count and analysis',
        basePrice: 45,
        duration: 15,
        category: 'Laboratory',
        isActive: true
      },
      {
        id: '3',
        name: 'X-Ray',
        description: 'Digital X-ray imaging service',
        basePrice: 65,
        duration: 20,
        category: 'Imaging',
        isActive: true
      }
    ]
  },
  'retail': {
    id: 'demo-retail-001',
    businessName: 'Spark Retail Store',
    businessType: {
      id: '4',
      name: 'Retail Store',
      category: 'Retail',
      terminology: {
        offering: 'Product',
        transaction: 'Order',
        customer: 'Customer',
        booking: 'Order'
      }
    },
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b'
    },
    contact: {
      phone: '+1 (555) 123-4567',
      email: 'orders@sparkretail.com',
      address: '123 Shopping Street, Retail City, RC 12345'
    },
    offerings: [
      {
        id: '1',
        name: 'Premium T-Shirt',
        description: 'High-quality cotton t-shirt in various colors',
        basePrice: 25,
        category: 'Clothing',
        isActive: true,
        variants: [
          { id: '1a', name: 'Small', priceModifier: 0 },
          { id: '1b', name: 'Medium', priceModifier: 0 },
          { id: '1c', name: 'Large', priceModifier: 2 },
          { id: '1d', name: 'XL', priceModifier: 4 }
        ]
      },
      {
        id: '2',
        name: 'Wireless Headphones',
        description: 'Bluetooth wireless headphones with noise cancellation',
        basePrice: 89,
        category: 'Electronics',
        isActive: true
      },
      {
        id: '3',
        name: 'Coffee Mug',
        description: 'Ceramic coffee mug with custom design',
        basePrice: 15,
        category: 'Home & Kitchen',
        isActive: true
      }
    ]
  },
  'salon': {
    id: 'demo-salon-001',
    businessName: 'Spark Beauty Salon',
    businessType: {
      id: '2',
      name: 'Beauty Salon',
      category: 'Beauty & Wellness',
      terminology: {
        offering: 'Service',
        transaction: 'Appointment',
        customer: 'Client',
        booking: 'Appointment'
      }
    },
    branding: {
      primaryColor: '#ec4899',
      secondaryColor: '#64748b'
    },
    contact: {
      phone: '+1 (555) 123-4567',
      email: 'hello@sparkbeauty.com',
      address: '123 Beauty Street, Salon City, SC 12345'
    },
    offerings: [
      {
        id: '1',
        name: 'Haircut & Style',
        description: 'Professional haircut with styling and finishing',
        basePrice: 45,
        duration: 60,
        category: 'Hair Services',
        isActive: true,
        variants: [
          { id: '1a', name: 'Short Hair', priceModifier: 0 },
          { id: '1b', name: 'Long Hair', priceModifier: 15 }
        ]
      },
      {
        id: '2',
        name: 'Hair Color',
        description: 'Full hair coloring service with consultation',
        basePrice: 120,
        duration: 180,
        category: 'Hair Services',
        isActive: true,
        variants: [
          { id: '2a', name: 'Single Color', priceModifier: 0 },
          { id: '2b', name: 'Highlights', priceModifier: 30 },
          { id: '2c', name: 'Full Color + Highlights', priceModifier: 60 }
        ]
      },
      {
        id: '3',
        name: 'Manicure',
        description: 'Professional nail care and polish application',
        basePrice: 25,
        duration: 45,
        category: 'Nail Services',
        isActive: true
      },
      {
        id: '4',
        name: 'Facial Treatment',
        description: 'Relaxing facial with cleansing and moisturizing',
        basePrice: 65,
        duration: 75,
        category: 'Skin Care',
        isActive: true
      }
    ]
  }
};

export function getBusinessConfig(businessType?: string): BusinessConfig {
  // Default to salon if no business type specified
  const type = businessType || 'salon';
  return businessConfigs[type] || businessConfigs['salon'];
}

export function getAllBusinessTypes(): string[] {
  return Object.keys(businessConfigs);
}