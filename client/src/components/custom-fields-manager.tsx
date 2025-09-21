/**
 * Custom Fields Manager Component
 * Allows users to manage custom fields for their business
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, Save, Plus, Trash2, Settings } from 'lucide-react';

interface BusinessType {
  customFields: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    options?: string[];
  }>;
}

interface TenantConfig {
  customFields: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    options?: string[];
  }>;
}

interface CustomFieldsManagerProps {
  businessType: BusinessType;
  tenantConfig: TenantConfig;
  onUpdate: (updates: any) => void;
  loading?: boolean;
}

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  businessType,
  tenantConfig,
  onUpdate,
  loading = false,
}) => {
  const [customFields, setCustomFields] = useState(tenantConfig.customFields);

  const handleSave = () => {
    onUpdate({ customFields });
  };

  const addField = () => {
    setCustomFields([
      ...customFields,
      { name: '', type: 'text', isRequired: false }
    ]);
  };

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: any) => {
    setCustomFields(customFields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Custom Fields</span>
        </CardTitle>
        <CardDescription>
          Manage custom fields for collecting additional information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Default Fields from Business Type:</h4>
          <div className="space-y-2">
            {businessType.customFields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="font-medium">{field.name}</span>
                  <Badge variant="outline" className="ml-2">{field.type}</Badge>
                  {field.isRequired && <Badge variant="secondary" className="ml-1">Required</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Custom Fields:</h4>
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
          
          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                <div className="flex-1">
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                  />
                </div>
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value })}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={field.isRequired}
                    onChange={(e) => updateField(index, { isRequired: e.target.checked })}
                  />
                  <span className="text-sm">Required</span>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Custom Fields
        </Button>
      </CardContent>
    </Card>
  );
};