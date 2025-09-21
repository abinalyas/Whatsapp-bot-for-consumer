/**
 * Business Terminology Editor Component
 * Allows users to customize business-specific terminology
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Loader2, Save, RotateCcw, Info } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

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

interface TenantConfig {
  id: string;
  tenantId: string;
  businessTypeId: string;
  businessName: string;
  customTerminology: Record<string, string>;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };
  customFields: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    options?: string[];
  }>;
  settings: Record<string, any>;
  isConfigured: boolean;
}

interface BusinessTerminologyEditorProps {
  businessType: BusinessType;
  tenantConfig: TenantConfig;
  onUpdate: (updates: Partial<TenantConfig>) => void;
  loading?: boolean;
}

const terminologyDescriptions: Record<string, string> = {
  'service': 'What you offer to customers (e.g., \"Menu Item\", \"Treatment\", \"Product\")',
  'booking': 'Customer transactions (e.g., \"Order\", \"Appointment\", \"Purchase\")',
  'customer': 'People who use your business (e.g., \"Customer\", \"Patient\", \"Client\")',
  'staff': 'Your team members (e.g., \"Staff\", \"Doctor\", \"Stylist\")',
  'location': 'Where services are provided (e.g., \"Restaurant\", \"Clinic\", \"Store\")',
  'category': 'How you group your offerings (e.g., \"Menu Category\", \"Department\", \"Service Type\")',
  'price': 'Cost terminology (e.g., \"Price\", \"Fee\", \"Rate\")',
  'duration': 'Time-related terms (e.g., \"Prep Time\", \"Appointment Duration\", \"Delivery Time\")',
  'status': 'Current state (e.g., \"Order Status\", \"Appointment Status\", \"Delivery Status\")',
  'payment': 'Payment-related terms (e.g., \"Payment\", \"Bill\", \"Invoice\")',
};

export const BusinessTerminologyEditor: React.FC<BusinessTerminologyEditorProps> = ({
  businessType,
  tenantConfig,
  onUpdate,
  loading = false,
}) => {
  const [businessName, setBusinessName] = useState(tenantConfig.businessName || '');
  const [customTerminology, setCustomTerminology] = useState<Record<string, string>>(
    tenantConfig.customTerminology || {}
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setBusinessName(tenantConfig.businessName || '');
    setCustomTerminology(tenantConfig.customTerminology || {});
    setHasChanges(false);
  }, [tenantConfig]);

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    setHasChanges(true);
  };

  const handleTerminologyChange = (key: string, value: string) => {
    setCustomTerminology(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({
      businessName,
      customTerminology,
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setBusinessName(tenantConfig.businessName || '');
    setCustomTerminology(tenantConfig.customTerminology || {});
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setCustomTerminology({ ...businessType.terminology });
    setHasChanges(true);
  };

  const getTerminologyKeys = () => {
    const allKeys = new Set([
      ...Object.keys(businessType.terminology),
      ...Object.keys(customTerminology),
    ]);
    return Array.from(allKeys).sort();
  };

  return (
    <div className=\"space-y-6\">
      <div>
        <h2 className=\"text-2xl font-bold tracking-tight\">Business Terminology</h2>
        <p className=\"text-muted-foreground\">
          Customize the language and terminology used throughout your system to match your business.
        </p>
      </div>

      {/* Business Name */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Basic information about your business
          </CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          <div className=\"space-y-2\">
            <Label htmlFor=\"businessName\">Business Name</Label>
            <Input
              id=\"businessName\"
              value={businessName}
              onChange={(e) => handleBusinessNameChange(e.target.value)}
              placeholder={`My ${businessType.name}`}
              className=\"max-w-md\"
            />
            <p className=\"text-sm text-muted-foreground\">
              This name will appear in your customer communications and interface.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terminology Customization */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <div>
              <CardTitle>Custom Terminology</CardTitle>
              <CardDescription>
                Customize terms to match your business language. Default terms are based on your business type.
              </CardDescription>
            </div>
            <Button variant=\"outline\" size=\"sm\" onClick={resetToDefaults}>
              <RotateCcw className=\"h-4 w-4 mr-2\" />
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          <Alert>
            <Info className=\"h-4 w-4\" />
            <AlertDescription>
              These terms will be used throughout your system interface, customer communications, 
              and bot conversations. Choose terms that your customers will easily understand.
            </AlertDescription>
          </Alert>

          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
            {getTerminologyKeys().map((key) => {
              const defaultValue = businessType.terminology[key] || '';
              const currentValue = customTerminology[key] || defaultValue;
              const isModified = currentValue !== defaultValue;
              
              return (
                <div key={key} className=\"space-y-2\">
                  <div className=\"flex items-center space-x-2\">
                    <Label htmlFor={key} className=\"capitalize font-medium\">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    {isModified && (
                      <Badge variant=\"secondary\" className=\"text-xs\">
                        Modified
                      </Badge>
                    )}
                  </div>
                  
                  <Input
                    id={key}
                    value={currentValue}
                    onChange={(e) => handleTerminologyChange(key, e.target.value)}
                    placeholder={defaultValue}
                  />
                  
                  {terminologyDescriptions[key] && (
                    <p className=\"text-xs text-muted-foreground\">
                      {terminologyDescriptions[key]}
                    </p>
                  )}
                  
                  {defaultValue && defaultValue !== currentValue && (
                    <p className=\"text-xs text-blue-600\">
                      Default: \"{defaultValue}\"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Terminology Preview</CardTitle>
          <CardDescription>
            See how your custom terminology will appear in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"bg-gray-50 p-4 rounded-lg space-y-3\">
            <div className=\"text-sm\">
              <strong>Sample Interface Text:</strong>
            </div>
            <div className=\"space-y-2 text-sm text-gray-700\">
              <p>• Welcome to <strong>{businessName || `My ${businessType.name}`}</strong>!</p>
              <p>• Browse our {customTerminology.category || businessType.terminology.category || 'categories'}</p>
              <p>• Select a {customTerminology.service || businessType.terminology.service || 'service'}</p>
              <p>• Create your {customTerminology.booking || businessType.terminology.booking || 'booking'}</p>
              <p>• Track your {customTerminology.status || businessType.terminology.status || 'status'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className=\"flex justify-between pt-6 border-t\">
        <Button variant=\"outline\" onClick={handleReset} disabled={!hasChanges || loading}>
          Cancel Changes
        </Button>
        
        <Button onClick={handleSave} disabled={!hasChanges || loading}>
          {loading && <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />}
          <Save className=\"mr-2 h-4 w-4\" />
          Save Terminology
        </Button>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <Alert>
          <Info className=\"h-4 w-4\" />
          <AlertDescription>
            You have unsaved changes. Click \"Save Terminology\" to apply your changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};