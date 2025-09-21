/**
 * Business Terminology Editor Component
 * Allows users to customize business-specific terminology
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Save } from 'lucide-react';

interface BusinessType {
  id: string;
  name: string;
  terminology: Record<string, string>;
}

interface TenantConfig {
  customTerminology: Record<string, string>;
}

interface BusinessTerminologyEditorProps {
  businessType: BusinessType;
  tenantConfig: TenantConfig;
  onUpdate: (updates: any) => void;
  loading?: boolean;
}

export const BusinessTerminologyEditor: React.FC<BusinessTerminologyEditorProps> = ({
  businessType,
  tenantConfig,
  onUpdate,
  loading = false,
}) => {
  const [terminology, setTerminology] = useState(tenantConfig.customTerminology);

  const handleSave = () => {
    onUpdate({ customTerminology: terminology });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Terminology</CardTitle>
        <CardDescription>
          Customize the terms used in your business to match your industry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(businessType.terminology).map(([key, defaultValue]) => (
          <div key={key}>
            <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
            <Input
              id={key}
              value={terminology[key] || defaultValue}
              onChange={(e) => setTerminology({ ...terminology, [key]: e.target.value })}
              placeholder={defaultValue}
            />
          </div>
        ))}
        
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Terminology
        </Button>
      </CardContent>
    </Card>
  );
};