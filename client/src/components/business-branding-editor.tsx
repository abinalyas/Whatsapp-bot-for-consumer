/**
 * Business Branding Editor Component
 * Allows users to customize business branding and visual identity
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, Save, RotateCcw, Palette, Upload, Eye } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

// Types
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

interface BusinessBrandingEditorProps {
  tenantConfig: TenantConfig;
  onUpdate: (updates: Partial<TenantConfig>) => void;
  loading?: boolean;
}

const predefinedColors = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Gray', value: '#6b7280' },
];

export const BusinessBrandingEditor: React.FC<BusinessBrandingEditorProps> = ({
  tenantConfig,
  onUpdate,
  loading = false,
}) => {
  const [branding, setBranding] = useState(tenantConfig.branding);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setBranding(tenantConfig.branding);
    setHasChanges(false);
  }, [tenantConfig]);

  const handleBrandingChange = (key: keyof typeof branding, value: string) => {
    setBranding(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({ branding });
    setHasChanges(false);
  };

  const handleReset = () => {
    setBranding(tenantConfig.branding);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setBranding({
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
    });
    setHasChanges(true);
  };

  const isValidColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <div className=\"space-y-6\">
      <div>
        <h2 className=\"text-2xl font-bold tracking-tight\">Business Branding</h2>
        <p className=\"text-muted-foreground\">
          Customize your business colors, logo, and visual identity to match your brand.
        </p>
      </div>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <div>
              <CardTitle className=\"flex items-center space-x-2\">
                <Palette className=\"h-5 w-5\" />
                <span>Color Scheme</span>
              </CardTitle>
              <CardDescription>
                Choose colors that represent your brand identity
              </CardDescription>
            </div>
            <Button variant=\"outline\" size=\"sm\" onClick={resetToDefaults}>
              <RotateCcw className=\"h-4 w-4 mr-2\" />
              Reset Colors
            </Button>
          </div>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          {/* Primary Color */}
          <div className=\"space-y-4\">
            <div>
              <Label htmlFor=\"primaryColor\">Primary Color</Label>
              <p className=\"text-sm text-muted-foreground mb-3\">
                Main brand color used for buttons, links, and highlights
              </p>
            </div>
            
            <div className=\"flex items-center space-x-4\">
              <div className=\"flex items-center space-x-2\">
                <div 
                  className=\"w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm\"
                  style={{ backgroundColor: branding.primaryColor }}
                />
                <Input
                  id=\"primaryColor\"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  placeholder=\"#3b82f6\"
                  className=\"w-32 font-mono\"
                />
              </div>
              {!isValidColor(branding.primaryColor) && (
                <Badge variant=\"destructive\">Invalid color format</Badge>
              )}
            </div>

            {/* Predefined Primary Colors */}
            <div>
              <p className=\"text-sm font-medium mb-2\">Quick Colors:</p>
              <div className=\"flex flex-wrap gap-2\">
                {predefinedColors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      branding.primaryColor === color.value 
                        ? 'border-gray-900 shadow-md' 
                        : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleBrandingChange('primaryColor', color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div className=\"space-y-4\">
            <div>
              <Label htmlFor=\"secondaryColor\">Secondary Color</Label>
              <p className=\"text-sm text-muted-foreground mb-3\">
                Supporting color used for backgrounds, borders, and subtle elements
              </p>
            </div>
            
            <div className=\"flex items-center space-x-4\">
              <div className=\"flex items-center space-x-2\">
                <div 
                  className=\"w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm\"
                  style={{ backgroundColor: branding.secondaryColor }}
                />
                <Input
                  id=\"secondaryColor\"
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  placeholder=\"#64748b\"
                  className=\"w-32 font-mono\"
                />
              </div>
              {!isValidColor(branding.secondaryColor) && (
                <Badge variant=\"destructive\">Invalid color format</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo and Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Logo and Assets</CardTitle>
          <CardDescription>
            Upload your business logo and favicon (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          {/* Logo Upload */}
          <div className=\"space-y-4\">
            <div>
              <Label>Business Logo</Label>
              <p className=\"text-sm text-muted-foreground mb-3\">
                Upload your logo (PNG, JPG, or SVG recommended)
              </p>
            </div>
            
            <div className=\"border-2 border-dashed border-gray-300 rounded-lg p-8 text-center\">
              <Upload className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
              <p className=\"text-sm text-gray-600 mb-2\">Logo upload coming soon</p>
              <p className=\"text-xs text-gray-500\">
                Recommended size: 200x60px or similar aspect ratio
              </p>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className=\"space-y-4\">
            <div>
              <Label>Favicon</Label>
              <p className=\"text-sm text-muted-foreground mb-3\">
                Small icon that appears in browser tabs
              </p>
            </div>
            
            <div className=\"border-2 border-dashed border-gray-300 rounded-lg p-6 text-center\">
              <div className=\"w-8 h-8 bg-gray-200 rounded mx-auto mb-2\" />
              <p className=\"text-sm text-gray-600 mb-1\">Favicon upload coming soon</p>
              <p className=\"text-xs text-gray-500\">
                Recommended size: 32x32px or 16x16px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center space-x-2\">
            <Eye className=\"h-5 w-5\" />
            <span>Brand Preview</span>
          </CardTitle>
          <CardDescription>
            See how your branding will look in the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            {/* Sample Interface Elements */}
            <div className=\"border rounded-lg p-4 bg-white\">
              <div className=\"space-y-4\">
                {/* Header */}
                <div className=\"flex items-center justify-between pb-3 border-b\">
                  <h3 className=\"text-lg font-semibold\">{tenantConfig.businessName}</h3>
                  <div className=\"w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500\">
                    LOGO
                  </div>
                </div>

                {/* Sample Buttons */}
                <div className=\"space-y-3\">
                  <div className=\"flex items-center space-x-3\">
                    <button 
                      className=\"px-4 py-2 rounded-md text-white font-medium\"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className=\"px-4 py-2 rounded-md border font-medium\"
                      style={{ 
                        borderColor: branding.secondaryColor,
                        color: branding.secondaryColor 
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>

                  {/* Sample Card */}
                  <div 
                    className=\"p-4 rounded-lg border-l-4\"
                    style={{ 
                      borderLeftColor: branding.primaryColor,
                      backgroundColor: `${branding.primaryColor}08` 
                    }}
                  >
                    <h4 className=\"font-medium mb-1\">Sample Card</h4>
                    <p className=\"text-sm text-gray-600\">
                      This shows how your brand colors will appear in cards and highlights.
                    </p>
                  </div>

                  {/* Sample Navigation */}
                  <div className=\"flex space-x-1 p-1 bg-gray-100 rounded-lg\">
                    <div 
                      className=\"px-3 py-2 rounded-md text-white text-sm font-medium\"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Active Tab
                    </div>
                    <div className=\"px-3 py-2 text-sm text-gray-600\">
                      Inactive Tab
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Information */}
            <div className=\"grid grid-cols-2 gap-4 text-sm\">
              <div className=\"space-y-2\">
                <div className=\"font-medium\">Primary Color</div>
                <div className=\"flex items-center space-x-2\">
                  <div 
                    className=\"w-4 h-4 rounded border\"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                  <span className=\"font-mono\">{branding.primaryColor}</span>
                </div>
              </div>
              <div className=\"space-y-2\">
                <div className=\"font-medium\">Secondary Color</div>
                <div className=\"flex items-center space-x-2\">
                  <div 
                    className=\"w-4 h-4 rounded border\"
                    style={{ backgroundColor: branding.secondaryColor }}
                  />
                  <span className=\"font-mono\">{branding.secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className=\"flex justify-between pt-6 border-t\">
        <Button variant=\"outline\" onClick={handleReset} disabled={!hasChanges || loading}>
          Cancel Changes
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || loading || !isValidColor(branding.primaryColor) || !isValidColor(branding.secondaryColor)}
        >
          {loading && <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />}
          <Save className=\"mr-2 h-4 w-4\" />
          Save Branding
        </Button>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <Alert>
          <Palette className=\"h-4 w-4\" />
          <AlertDescription>
            You have unsaved branding changes. Click \"Save Branding\" to apply your changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};