/**
 * Business Configuration Component
 * Main dashboard for configuring business type and settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Building2, Settings, Palette, Users } from 'lucide-react';
import { BusinessTypeSelector } from './business-type-selector';
import { BusinessTerminologyEditor } from './business-terminology-editor';
import { BusinessBrandingEditor } from './business-branding-editor';
import { CustomFieldsManager } from './custom-fields-manager';

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

interface BusinessConfigurationProps {
  tenantId: string;
  onConfigurationComplete?: (config: TenantConfig) => void;
}

export const BusinessConfiguration: React.FC<BusinessConfigurationProps> = ({
  tenantId,
  onConfigurationComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  
  const [activeTab, setActiveTab] = useState('business-type');

  // Load initial data
  useEffect(() => {
    loadBusinessConfiguration();
  }, [tenantId]);

  const loadBusinessConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data for demo - expanded with more business types
      const mockBusinessTypes = [
        {
          id: '1',
          name: 'Restaurant',
          description: 'Food service business with table reservations and orders',
          category: 'Food & Beverage',
          terminology: {
            offering: 'Menu Item',
            transaction: 'Order',
            customer: 'Diner',
            booking: 'Reservation'
          },
          customFields: [
            { name: 'Dietary Restrictions', type: 'text', isRequired: false },
            { name: 'Party Size', type: 'number', isRequired: true }
          ],
          workflows: [
            { name: 'Order Processing', states: ['pending', 'confirmed', 'preparing', 'ready', 'delivered'] }
          ],
          metadata: { hasInventory: true, requiresScheduling: true }
        },
        {
          id: '2',
          name: 'Beauty Salon',
          description: 'Beauty and wellness services with appointment booking',
          category: 'Beauty & Wellness',
          terminology: {
            offering: 'Service',
            transaction: 'Appointment',
            customer: 'Client',
            booking: 'Appointment'
          },
          customFields: [
            { name: 'Hair Type', type: 'select', isRequired: false, options: ['Straight', 'Wavy', 'Curly', 'Coily'] },
            { name: 'Allergies', type: 'text', isRequired: false }
          ],
          workflows: [
            { name: 'Appointment Flow', states: ['booked', 'confirmed', 'in_progress', 'completed', 'no_show'] }
          ],
          metadata: { hasInventory: false, requiresScheduling: true }
        },
        {
          id: '3',
          name: 'Medical Clinic',
          description: 'Healthcare services with patient appointments and medical records',
          category: 'Healthcare',
          terminology: {
            offering: 'Service',
            transaction: 'Appointment',
            customer: 'Patient',
            booking: 'Appointment'
          },
          customFields: [
            { name: 'Insurance Provider', type: 'text', isRequired: false },
            { name: 'Medical History', type: 'text', isRequired: false }
          ],
          workflows: [
            { name: 'Patient Flow', states: ['scheduled', 'checked_in', 'in_consultation', 'completed', 'no_show'] }
          ],
          metadata: { hasInventory: false, requiresScheduling: true }
        },
        {
          id: '4',
          name: 'Retail Store',
          description: 'Product sales with inventory management and customer orders',
          category: 'Retail',
          terminology: {
            offering: 'Product',
            transaction: 'Order',
            customer: 'Customer',
            booking: 'Order'
          },
          customFields: [
            { name: 'Size', type: 'select', isRequired: false, options: ['XS', 'S', 'M', 'L', 'XL'] },
            { name: 'Color Preference', type: 'text', isRequired: false }
          ],
          workflows: [
            { name: 'Order Processing', states: ['pending', 'confirmed', 'shipped', 'delivered', 'returned'] }
          ],
          metadata: { hasInventory: true, requiresScheduling: false }
        }
      ];

      console.log('Loading business types:', mockBusinessTypes.length);
      setBusinessTypes(mockBusinessTypes);

      // Mock tenant config - start with no selection
      const mockTenantConfig = {
        id: '1',
        tenantId: tenantId,
        businessTypeId: '',
        businessName: 'My Business',
        customTerminology: {},
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b'
        },
        customFields: [],
        settings: {},
        isConfigured: false
      };

      setTenantConfig(mockTenantConfig);
      setSelectedBusinessType(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessTypeSelect = async (businessType: BusinessType) => {
    try {
      setSaving(true);
      setError(null);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedConfig = {
        ...tenantConfig!,
        businessTypeId: businessType.id,
        businessName: `My ${businessType.name}`,
        customTerminology: { ...businessType.terminology },
        customFields: [...businessType.customFields],
        settings: {
          ...businessType.metadata,
          ...tenantConfig?.settings,
        },
      };

      setTenantConfig(updatedConfig);
      setSelectedBusinessType(businessType);
      setSuccess(`Business type set to ${businessType.name}`);
      
      // Move to next tab
      setActiveTab('terminology');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business type');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigurationUpdate = async (updates: Partial<TenantConfig>) => {
    try {
      setSaving(true);
      setError(null);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedConfig = { ...tenantConfig!, ...updates };
      setTenantConfig(updatedConfig);
      setSuccess('Configuration updated successfully');

      if (onConfigurationComplete && updatedConfig.isConfigured) {
        onConfigurationComplete(updatedConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const getConfigurationProgress = () => {
    if (!tenantConfig) return 0;
    
    let progress = 0;
    const steps = 4;
    
    if (tenantConfig.businessTypeId) progress += 25;
    if (tenantConfig.businessName && Object.keys(tenantConfig.customTerminology).length > 0) progress += 25;
    if (tenantConfig.branding.primaryColor) progress += 25;
    if (tenantConfig.customFields.length > 0) progress += 25;
    
    return progress;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading business configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Configuration</h1>
          <p className="text-muted-foreground">
            Configure your business type, terminology, and settings
          </p>
        </div>
        
        {tenantConfig && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Progress: {getConfigurationProgress()}%
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getConfigurationProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Configuration Summary */}
      {tenantConfig && selectedBusinessType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Current Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Business Type</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">{selectedBusinessType.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedBusinessType.category}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Business Name</div>
                <div className="mt-1 font-medium">{tenantConfig.businessName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">
                  <Badge variant={tenantConfig.isConfigured ? "default" : "secondary"}>
                    {tenantConfig.isConfigured ? "Configured" : "In Progress"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business-type" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Business Type</span>
          </TabsTrigger>
          <TabsTrigger value="terminology" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Terminology</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Custom Fields</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-type" className="space-y-6">
          <BusinessTypeSelector
            businessTypes={businessTypes}
            selectedBusinessType={selectedBusinessType}
            onSelect={handleBusinessTypeSelect}
            loading={saving}
          />
        </TabsContent>

        <TabsContent value="terminology" className="space-y-6">
          {selectedBusinessType && tenantConfig && (
            <BusinessTerminologyEditor
              businessType={selectedBusinessType}
              tenantConfig={tenantConfig}
              onUpdate={handleConfigurationUpdate}
              loading={saving}
            />
          )}
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          {tenantConfig && (
            <BusinessBrandingEditor
              tenantConfig={tenantConfig}
              onUpdate={handleConfigurationUpdate}
              loading={saving}
            />
          )}
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          {selectedBusinessType && tenantConfig && (
            <CustomFieldsManager
              businessType={selectedBusinessType}
              tenantConfig={tenantConfig}
              onUpdate={handleConfigurationUpdate}
              loading={saving}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {tenantConfig && (
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={loadBusinessConfiguration}>
            Refresh Configuration
          </Button>
          
          <div className="space-x-2">
            {!tenantConfig.isConfigured && getConfigurationProgress() >= 75 && (
              <Button
                onClick={() => handleConfigurationUpdate({ isConfigured: true })}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Configuration
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};