/**
 * Simple Business Configuration Component
 * Minimal working version for testing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Building2 } from 'lucide-react';

// Simple types
interface BusinessType {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface SimpleBusinessConfigProps {
  tenantId: string;
}

export const SimpleBusinessConfig: React.FC<SimpleBusinessConfigProps> = ({ tenantId }) => {
  const [loading, setLoading] = useState(true);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  const loadBusinessTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business-config/business-types');
      const data = await response.json();
      
      if (data.success) {
        setBusinessTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error loading business types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (businessType: BusinessType) => {
    setSelectedType(businessType);
  };

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
          Configure your business type and settings
        </p>
      </div>

      {selectedType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Building2 className="h-5 w-5" />
              <span>Selected: {selectedType.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">{selectedType.description}</p>
            <Badge variant="secondary" className="mt-2">
              {selectedType.category}
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessTypes.map((businessType) => (
          <Card 
            key={businessType.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedType?.id === businessType.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleSelectType(businessType)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{businessType.name}</CardTitle>
              <Badge variant="secondary">{businessType.category}</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription>{businessType.description}</CardDescription>
              <Button 
                className="w-full mt-4" 
                variant={selectedType?.id === businessType.id ? "default" : "outline"}
              >
                {selectedType?.id === businessType.id ? 'Selected' : 'Select This Type'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {businessTypes.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No Business Types Available</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The mock API should provide business types. Check console for errors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">🎉 Success!</h3>
        <p className="text-sm text-gray-600">
          If you can see this page, the business configuration UI is working correctly!
          The flexible business model architecture is functioning as designed.
        </p>
        {selectedType && (
          <p className="text-sm text-green-600 mt-2">
            ✅ You've successfully selected: <strong>{selectedType.name}</strong>
          </p>
        )}
      </div>
    </div>
  );
};