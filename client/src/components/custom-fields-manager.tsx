/**
 * Custom Fields Manager Component
 * Allows users to manage custom fields for their business
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Loader2, Save, Plus, Trash2, Edit3, Info } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

// Types
interface CustomField {
  name: string;
  type: string;
  isRequired: boolean;
  options?: string[];
  description?: string;
  defaultValue?: any;
}

interface BusinessType {
  id: string;
  name: string;
  description: string;
  category: string;
  terminology: Record<string, string>;
  customFields: CustomField[];
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
  customFields: CustomField[];
  settings: Record<string, any>;
  isConfigured: boolean;
}

interface CustomFieldsManagerProps {
  businessType: BusinessType;
  tenantConfig: TenantConfig;
  onUpdate: (updates: Partial<TenantConfig>) => void;
  loading?: boolean;
}

const fieldTypes = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text input' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'email', label: 'Email', description: 'Email address input' },
  { value: 'phone', label: 'Phone', description: 'Phone number input' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'select', label: 'Dropdown', description: 'Single selection from options' },
  { value: 'multiselect', label: 'Multi-Select', description: 'Multiple selections from options' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false toggle' },
  { value: 'radio', label: 'Radio Buttons', description: 'Single selection from radio options' },
  { value: 'file', label: 'File Upload', description: 'File attachment' },
  { value: 'url', label: 'URL', description: 'Website link input' },
];

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  businessType,
  tenantConfig,
  onUpdate,
  loading = false,
}) => {
  const [customFields, setCustomFields] = useState<CustomField[]>(tenantConfig.customFields || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setCustomFields(tenantConfig.customFields || []);
    setHasChanges(false);
  }, [tenantConfig]);

  const handleSave = () => {
    onUpdate({ customFields });
    setHasChanges(false);
  };

  const handleReset = () => {
    setCustomFields(tenantConfig.customFields || []);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setCustomFields([...businessType.customFields]);
    setHasChanges(true);
  };

  const addField = (field: CustomField) => {
    setCustomFields(prev => [...prev, field]);
    setHasChanges(true);
    setIsDialogOpen(false);
    setEditingField(null);
  };

  const updateField = (index: number, field: CustomField) => {
    setCustomFields(prev => prev.map((f, i) => i === index ? field : f));
    setHasChanges(true);
    setIsDialogOpen(false);
    setEditingField(null);
  };

  const removeField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const openEditDialog = (field?: CustomField, index?: number) => {
    setEditingField(field || null);
    setIsDialogOpen(true);
  };

  const getFieldTypeLabel = (type: string) => {
    return fieldTypes.find(ft => ft.value === type)?.label || type;
  };

  const isDefaultField = (field: CustomField) => {
    return businessType.customFields.some(bf => bf.name === field.name);
  };

  return (
    <div className=\"space-y-6\">
      <div>
        <h2 className=\"text-2xl font-bold tracking-tight\">Custom Fields</h2>
        <p className=\"text-muted-foreground\">
          Manage custom fields to collect additional information specific to your business needs.
        </p>
      </div>

      {/* Current Fields */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <div>
              <CardTitle>Current Fields</CardTitle>
              <CardDescription>
                Fields that will be available for data collection
              </CardDescription>
            </div>
            <div className=\"flex space-x-2\">
              <Button variant=\"outline\" size=\"sm\" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size=\"sm\" onClick={() => openEditDialog()}>
                    <Plus className=\"h-4 w-4 mr-2\" />
                    Add Field
                  </Button>
                </DialogTrigger>
                <CustomFieldDialog
                  field={editingField}
                  onSave={(field) => {
                    if (editingField) {
                      const index = customFields.findIndex(f => f.name === editingField.name);
                      updateField(index, field);
                    } else {
                      addField(field);
                    }
                  }}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingField(null);
                  }}
                />
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <div className=\"text-center py-8\">
              <Info className=\"h-12 w-12 text-muted-foreground mx-auto mb-4\" />
              <h3 className=\"text-lg font-medium text-muted-foreground mb-2\">No Custom Fields</h3>
              <p className=\"text-sm text-muted-foreground mb-4\">
                Add custom fields to collect additional information from your customers.
              </p>
              <Button onClick={() => openEditDialog()}>
                <Plus className=\"h-4 w-4 mr-2\" />
                Add Your First Field
              </Button>
            </div>
          ) : (
            <div className=\"space-y-4\">
              {customFields.map((field, index) => (
                <div key={index} className=\"flex items-center justify-between p-4 border rounded-lg\">
                  <div className=\"flex-1\">
                    <div className=\"flex items-center space-x-3 mb-2\">
                      <h4 className=\"font-medium\">{field.name}</h4>
                      <Badge variant=\"secondary\">{getFieldTypeLabel(field.type)}</Badge>
                      {field.isRequired && (
                        <Badge variant=\"destructive\" className=\"text-xs\">Required</Badge>
                      )}
                      {isDefaultField(field) && (
                        <Badge variant=\"outline\" className=\"text-xs\">Default</Badge>
                      )}
                    </div>
                    {field.description && (
                      <p className=\"text-sm text-muted-foreground mb-2\">{field.description}</p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className=\"flex flex-wrap gap-1\">
                        {field.options.slice(0, 3).map((option, optIndex) => (
                          <Badge key={optIndex} variant=\"outline\" className=\"text-xs\">
                            {option}
                          </Badge>
                        ))}
                        {field.options.length > 3 && (
                          <Badge variant=\"outline\" className=\"text-xs\">
                            +{field.options.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => {
                        setEditingField(field);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit3 className=\"h-4 w-4\" />
                    </Button>
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => removeField(index)}
                      className=\"text-red-600 hover:text-red-700\"
                    >
                      <Trash2 className=\"h-4 w-4\" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Fields from Business Type */}
      {businessType.customFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Default Fields for {businessType.name}</CardTitle>
            <CardDescription>
              These fields are recommended for your business type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              {businessType.customFields.map((field, index) => {
                const isAdded = customFields.some(cf => cf.name === field.name);
                return (
                  <div key={index} className=\"p-3 border rounded-lg\">
                    <div className=\"flex items-center justify-between mb-2\">
                      <h4 className=\"font-medium\">{field.name}</h4>
                      <div className=\"flex items-center space-x-2\">
                        <Badge variant=\"secondary\" className=\"text-xs\">
                          {getFieldTypeLabel(field.type)}
                        </Badge>
                        {field.isRequired && (
                          <Badge variant=\"destructive\" className=\"text-xs\">Required</Badge>
                        )}
                      </div>
                    </div>
                    {field.description && (
                      <p className=\"text-sm text-muted-foreground mb-2\">{field.description}</p>
                    )}
                    <div className=\"flex justify-between items-center\">
                      <div className=\"text-xs text-muted-foreground\">
                        Recommended for {businessType.name.toLowerCase()}
                      </div>
                      {!isAdded && (
                        <Button
                          size=\"sm\"
                          variant=\"outline\"
                          onClick={() => addField(field)}
                        >
                          <Plus className=\"h-3 w-3 mr-1\" />
                          Add
                        </Button>
                      )}
                      {isAdded && (
                        <Badge variant=\"default\" className=\"text-xs\">Added</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className=\"flex justify-between pt-6 border-t\">
        <Button variant=\"outline\" onClick={handleReset} disabled={!hasChanges || loading}>
          Cancel Changes
        </Button>
        
        <Button onClick={handleSave} disabled={!hasChanges || loading}>
          {loading && <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />}
          <Save className=\"mr-2 h-4 w-4\" />
          Save Custom Fields
        </Button>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <Alert>
          <Info className=\"h-4 w-4\" />
          <AlertDescription>
            You have unsaved changes to custom fields. Click \"Save Custom Fields\" to apply your changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Custom Field Dialog Component
interface CustomFieldDialogProps {
  field: CustomField | null;
  onSave: (field: CustomField) => void;
  onCancel: () => void;
}

const CustomFieldDialog: React.FC<CustomFieldDialogProps> = ({ field, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CustomField>({
    name: '',
    type: 'text',
    isRequired: false,
    options: [],
    description: '',
    defaultValue: '',
  });

  const [optionsText, setOptionsText] = useState('');

  useEffect(() => {
    if (field) {
      setFormData(field);
      setOptionsText(field.options?.join('\\n') || '');
    } else {
      setFormData({
        name: '',
        type: 'text',
        isRequired: false,
        options: [],
        description: '',
        defaultValue: '',
      });
      setOptionsText('');
    }
  }, [field]);

  const handleSave = () => {
    const options = optionsText
      .split('\\n')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    const fieldData: CustomField = {
      ...formData,
      options: ['select', 'multiselect', 'radio'].includes(formData.type) ? options : undefined,
    };

    onSave(fieldData);
  };

  const needsOptions = ['select', 'multiselect', 'radio'].includes(formData.type);

  return (
    <DialogContent className=\"max-w-md\">
      <DialogHeader>
        <DialogTitle>{field ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
        <DialogDescription>
          Configure the custom field properties
        </DialogDescription>
      </DialogHeader>
      
      <div className=\"space-y-4\">
        <div className=\"space-y-2\">
          <Label htmlFor=\"fieldName\">Field Name</Label>
          <Input
            id=\"fieldName\"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder=\"e.g., Special Instructions\"
          />
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"fieldType\">Field Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className=\"font-medium\">{type.label}</div>
                    <div className=\"text-xs text-muted-foreground\">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"fieldDescription\">Description (Optional)</Label>
          <Input
            id=\"fieldDescription\"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder=\"Help text for users\"
          />
        </div>

        {needsOptions && (
          <div className=\"space-y-2\">
            <Label htmlFor=\"fieldOptions\">Options</Label>
            <textarea
              id=\"fieldOptions\"
              className=\"w-full p-2 border rounded-md text-sm\"
              rows={4}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder=\"Enter each option on a new line\"
            />
            <p className=\"text-xs text-muted-foreground\">
              Enter each option on a separate line
            </p>
          </div>
        )}

        <div className=\"flex items-center space-x-2\">
          <Switch
            id=\"fieldRequired\"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
          />
          <Label htmlFor=\"fieldRequired\">Required field</Label>
        </div>

        <div className=\"flex justify-end space-x-2 pt-4\">
          <Button variant=\"outline\" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim() || (needsOptions && optionsText.trim().length === 0)}
          >
            {field ? 'Update Field' : 'Add Field'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};