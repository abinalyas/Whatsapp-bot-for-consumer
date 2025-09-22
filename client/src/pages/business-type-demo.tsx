/**
 * Business Type Demo Page
 * Shows different business configurations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils,
  Scissors,
  Stethoscope,
  Store,
  ExternalLink
} from 'lucide-react';

interface BusinessType {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  icon: React.ComponentType<any>;
}

const businessTypes: BusinessType[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    category: 'Food & Beverage',
    description: 'Food service business with table reservations and menu ordering',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Utensils
  },
  {
    id: 'salon',
    name: 'Beauty Salon',
    category: 'Beauty & Wellness',
    description: 'Beauty and wellness services with appointment booking',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: Scissors
  },
  {
    id: 'clinic',
    name: 'Medical Clinic',
    category: 'Healthcare',
    description: 'Healthcare services with patient appointments and treatment management',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Stethoscope
  },
  {
    id: 'retail',
    name: 'Retail Store',
    category: 'Retail',
    description: 'Retail business with product catalog and order management',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Store
  }
];

export const BusinessTypeDemoPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('salon');

  const handleViewCustomerPage = (businessType: string) => {
    // Open customer page with business type parameter
    window.open(`/customer?type=${businessType}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multi-Business Platform Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how our platform adapts to different business types with custom branding, 
            terminology, and service offerings. Click on any business type to see their 
            customer-facing page.
          </p>
        </div>

        {/* Business Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {businessTypes.map((businessType) => {
            const Icon = businessType.icon;
            
            return (
              <Card 
                key={businessType.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedType(businessType.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${businessType.color}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{businessType.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {businessType.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {businessType.description}
                  </CardDescription>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      What you'll see:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Custom branding and colors</li>
                      <li>• Business-specific terminology</li>
                      <li>• Relevant service offerings</li>
                      <li>• Industry-appropriate design</li>
                    </ul>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCustomerPage(businessType.id);
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View {businessType.name} Page
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How to Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="mb-3">
                  Each business type demonstrates our platform's flexibility:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click "View [Business] Page" to see the customer-facing website</li>
                  <li>Notice how the branding, colors, and terminology change</li>
                  <li>Try the booking form to see business-specific language</li>
                  <li>Compare different business types to see the adaptability</li>
                </ol>
                <p className="mt-3 text-xs text-gray-500">
                  This demonstrates how one platform can serve multiple business types 
                  with completely different customer experiences.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeDemoPage;