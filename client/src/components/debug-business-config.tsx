/**
 * Debug Business Configuration Component
 * Simple version to test the business type loading
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Store } from 'lucide-react';

// Types
interface BusinessType {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const DebugBusinessConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockTypes = [
        {
          id: '1',
          name: 'Restaurant',
          description: 'Food service business with table reservations and orders',
          category: 'Food & Beverage',
        },
        {
          id: '2',
          name: 'Beauty Salon',
          description: 'Beauty and wellness services with appointment booking',
          category: 'Beauty & Wellness',
        },
        {
          id: '3',
          name: 'Medical Clinic',
          description: 'Healthcare services with patient appointments',
          category: 'Healthcare',
        },
        {
          id: '4',
          name: 'Retail Store',
          description: 'Product sales with inventory management',
          category: 'Retail',
        },
      ];
      
      console.log('Setting business types:', mockTypes);
      setBusinessTypes(mockTypes);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading business types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Configuration</h1>
        <p className="text-muted-foreground">
          Choose your business type to get started
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        Debug: Found {businessTypes.length} business types
      </div>

      {businessTypes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No Business Types Available</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The mock API should provide business types. Check console for errors.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businessTypes.map((businessType) => (
            <Card 
              key={businessType.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedType?.id === businessType.id ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => setSelectedType(businessType)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{businessType.name}</CardTitle>
                <Badge variant="secondary">{businessType.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {businessType.description}
                </p>
                <Button 
                  className="w-full" 
                  variant={selectedType?.id === businessType.id ? "default" : "outline"}
                >
                  {selectedType?.id === businessType.id ? 'Selected' : 'Select This Type'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              ✅ Selected: {selectedType.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">
              You've selected {selectedType.name} as your business type. 
              This will configure the system for {selectedType.category.toLowerCase()} operations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};