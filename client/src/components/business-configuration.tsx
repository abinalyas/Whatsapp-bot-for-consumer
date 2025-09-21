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

      // Load business types
      const businessTypesResponse = await fetch('/api/business-config/business-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantId,
        },
      });

      if (!businessTypesResponse.ok) {
        throw new Error('Failed to load business types');
      }

      const businessTypesData = await businessTypesResponse.json();
      setBusinessTypes(businessTypesData.data || []);

      // Load tenant configuration
      const tenantConfigResponse = await fetch('/api/business-config/tenant-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantId,
        },
      });

      if (tenantConfigResponse.ok) {
        const tenantConfigData = await tenantConfigResponse.json();
        const config = tenantConfigData.data;
        setTenantConfig(config);

        // Find and set the selected business type
        if (config?.businessTypeId) {
          const businessType = businessTypesData.data?.find(
            (bt: BusinessType) => bt.id === config.businessTypeId
          );
          setSelectedBusinessType(businessType || null);
        }
      }
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

      const configData = {
        businessTypeId: businessType.id,
        businessName: tenantConfig?.businessName || `My ${businessType.name}`,
        customTerminology: { ...businessType.terminology },
        branding: tenantConfig?.branding || {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
        },
        customFields: [...businessType.customFields],
        settings: {
          ...businessType.metadata,
          ...tenantConfig?.settings,
        },
      };

      const response = await fetch('/api/business-config/tenant-config', {
        method: tenantConfig ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error('Failed to save business type selection');
      }

      const result = await response.json();
      setTenantConfig(result.data);
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

      const response = await fetch('/api/business-config/tenant-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      const result = await response.json();
      setTenantConfig(result.data);
      setSuccess('Configuration updated successfully');

      if (onConfigurationComplete && result.data.isConfigured) {
        onConfigurationComplete(result.data);
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
      <div className=\"flex items-center justify-center h-64\">
        <Loader2 className=\"h-8 w-8 animate-spin\" />
        <span className=\"ml-2\">Loading business configuration...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold tracking-tight\">Business Configuration</h1>
          <p className=\"text-muted-foreground\">
            Configure your business type, terminology, and settings
          </p>
        </div>
        
        {tenantConfig && (
          <div className=\"flex items-center space-x-4\">
            <div className=\"text-sm text-muted-foreground\">
              Progress: {getConfigurationProgress()}%
            </div>
            <div className=\"w-32 bg-gray-200 rounded-full h-2\">
              <div 
                className=\"bg-blue-600 h-2 rounded-full transition-all duration-300\"
                style={{ width: `${getConfigurationProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant=\"destructive\">
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
            <CardTitle className=\"flex items-center space-x-2\">
              <Building2 className=\"h-5 w-5\" />
              <span>Current Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
              <div>
                <div className=\"text-sm font-medium text-muted-foreground\">Business Type</div>
                <div className=\"flex items-center space-x-2 mt-1\">
                  <Badge variant=\"secondary\">{selectedBusinessType.name}</Badge>
                  <span className=\"text-sm text-muted-foreground\">
                    {selectedBusinessType.category}
                  </span>
                </div>
              </div>
              <div>
                <div className=\"text-sm font-medium text-muted-foreground\">Business Name</div>
                <div className=\"mt-1 font-medium\">{tenantConfig.businessName}</div>
              </div>
              <div>
                <div className=\"text-sm font-medium text-muted-foreground\">Status</div>
                <div className=\"mt-1\">
                  <Badge variant={tenantConfig.isConfigured ? \"default\" : \"secondary\"}>
                    {tenantConfig.isConfigured ? \"Configured\" : \"In Progress\"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className=\"space-y-6\">
        <TabsList className=\"grid w-full grid-cols-4\">
          <TabsTrigger value=\"business-type\" className=\"flex items-center space-x-2\">
            <Building2 className=\"h-4 w-4\" />
            <span>Business Type</span>
          </TabsTrigger>
          <TabsTrigger value=\"terminology\" className=\"flex items-center space-x-2\">
            <Settings className=\"h-4 w-4\" />
            <span>Terminology</span>
          </TabsTrigger>
          <TabsTrigger value=\"branding\" className=\"flex items-center space-x-2\">
            <Palette className=\"h-4 w-4\" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value=\"fields\" className=\"flex items-center space-x-2\">
            <Users className=\"h-4 w-4\" />
            <span>Custom Fields</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value=\"business-type\" className=\"space-y-6\">
          <BusinessTypeSelector
            businessTypes={businessTypes}
            selectedBusinessType={selectedBusinessType}
            onSelect={handleBusinessTypeSelect}
            loading={saving}
          />
        </TabsContent>

        <TabsContent value=\"terminology\" className=\"space-y-6\">
          {selectedBusinessType && tenantConfig && (
            <BusinessTerminologyEditor
              businessType={selectedBusinessType}
              tenantConfig={tenantConfig}
              onUpdate={handleConfigurationUpdate}
              loading={saving}
            />
          )}
        </TabsContent>

        <TabsContent value=\"branding\" className=\"space-y-6\">
          {tenantConfig && (
            <BusinessBrandingEditor
              tenantConfig={tenantConfig}
              onUpdate={handleConfigurationUpdate}
              loading={saving}
            />
          )}
        </TabsContent>

        <TabsContent value=\"fields\" className=\"space-y-6\">
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
        <div className=\"flex justify-between pt-6 border-t\">
          <Button variant=\"outline\" onClick={loadBusinessConfiguration}>
            Refresh Configuration
          </Button>
          
          <div className=\"space-x-2\">
            {!tenantConfig.isConfigured && getConfigurationProgress() >= 75 && (
              <Button
                onClick={() => handleConfigurationUpdate({ isConfigured: true })}
                disabled={saving}
              >
                {saving && <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />}
                Complete Configuration
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};