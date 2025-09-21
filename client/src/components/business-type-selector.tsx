/**
 * Business Type Selector Component
 * Allows users to select from predefined business types
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Store, Stethoscope, Utensils, Scissors, ShoppingBag, Calendar, Check } from 'lucide-react';

// Types
interface BusinessType {
  id: string;
  name: string;
  description: string;
  category: string;
  terminology: Record<string, string>;
  customFields: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    options?: string[];
  }>;
  workflows: Array<{
    name: string;
    states: string[];
  }>;
  metadata: Record<string, any>;
}

interface BusinessTypeSelectorProps {
  businessTypes: BusinessType[];
  selectedBusinessType: BusinessType | null;
  onSelect: (businessType: BusinessType) => void;
  loading?: boolean;
}

const getBusinessTypeIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'restaurant':
    case 'food':
      return Utensils;
    case 'healthcare':
    case 'clinic':
      return Stethoscope;
    case 'retail':
    case 'store':
      return Store;
    case 'salon':
    case 'beauty':
      return Scissors;
    case 'ecommerce':
      return ShoppingBag;
    case 'services':
      return Calendar;
    default:
      return Store;
  }
};

const getBusinessTypeColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'restaurant':
    case 'food':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'healthcare':
    case 'clinic':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'retail':
    case 'store':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'salon':
    case 'beauty':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'ecommerce':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'services':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({
  businessTypes,
  selectedBusinessType,
  onSelect,
  loading = false,
}) => {
  if (businessTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Business Types Available</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please contact support to set up business types for your organization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Business Type</h2>
        <p className="text-muted-foreground">
          Select the business type that best matches your organization. This will configure terminology, 
          workflows, and features specific to your industry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessTypes.map((businessType) => {
          const Icon = getBusinessTypeIcon(businessType.category);
          const isSelected = selectedBusinessType?.id === businessType.id;
          
          return (
            <Card 
              key={businessType.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => !loading && onSelect(businessType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getBusinessTypeColor(businessType.category)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{businessType.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {businessType.category}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 bg-blue-500 rounded-full">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm leading-relaxed">
                  {businessType.description}
                </CardDescription>

                {/* Key Features */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Features:</h4>
                  <div className="space-y-1">
                    {businessType.workflows.slice(0, 2).map((workflow, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                        {workflow.name} ({workflow.states.length} states)
                      </div>
                    ))}
                    {businessType.customFields.slice(0, 2).map((field, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                        {field.name} field ({field.type})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terminology Preview */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Terminology:</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(businessType.terminology).slice(0, 3).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {value}
                      </Badge>
                    ))}
                    {Object.keys(businessType.terminology).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(businessType.terminology).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant={isSelected ? "default" : "outline"}
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(businessType);
                  }}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSelected ? 'Selected' : 'Select This Type'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Business Type Details */}
      {selectedBusinessType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Check className="h-5 w-5" />
              <span>Selected: {selectedBusinessType.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Available Workflows:</h4>
                <div className="space-y-1">
                  {selectedBusinessType.workflows.map((workflow, index) => (
                    <div key={index} className="text-sm text-blue-800">
                      • {workflow.name} ({workflow.states.join(' → ')})
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Custom Fields:</h4>
                <div className="space-y-1">
                  {selectedBusinessType.customFields.map((field, index) => (
                    <div key={index} className="text-sm text-blue-800">
                      • {field.name} ({field.type}){field.isRequired && ' *'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Business Terminology:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedBusinessType.terminology).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="bg-blue-100 text-blue-800">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};