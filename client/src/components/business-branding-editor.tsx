/**
 * Business Branding Editor Component
 * Allows users to customize business branding and colors
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Save, Palette } from 'lucide-react';

interface TenantConfig {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };
}

interface BusinessBrandingEditorProps {
  tenantConfig: TenantConfig;
  onUpdate: (updates: any) => void;
  loading?: boolean;
}

export const BusinessBrandingEditor: React.FC<BusinessBrandingEditorProps> = ({
  tenantConfig,
  onUpdate,
  loading = false,
}) => {
  const [branding, setBranding] = useState(tenantConfig.branding);

  const handleSave = () => {
    onUpdate({ branding });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Business Branding</span>
        </CardTitle>
        <CardDescription>
          Customize your business colors and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                placeholder="#3b82f6"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="secondaryColor"
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                placeholder="#64748b"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg" style={{ backgroundColor: branding.primaryColor + '20' }}>
          <h3 className="font-medium" style={{ color: branding.primaryColor }}>
            Preview
          </h3>
          <p className="text-sm" style={{ color: branding.secondaryColor }}>
            This is how your branding colors will look in the interface.
          </p>
        </div>
        
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );
};