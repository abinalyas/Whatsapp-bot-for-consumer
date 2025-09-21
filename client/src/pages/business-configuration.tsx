/**
 * Business Configuration Page
 * Main page for business configuration setup
 */

import React from 'react';
import { BusinessConfiguration } from '../components/business-configuration';

export const BusinessConfigurationPage: React.FC = () => {
  // In a real app, you'd get this from auth context or URL params
  const tenantId = 'demo-tenant-id';

  const handleConfigurationComplete = (config: any) => {
    console.log('Configuration completed:', config);
    // You could redirect to dashboard or show success message
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"container mx-auto px-4 py-8\">
        <BusinessConfiguration
          tenantId={tenantId}
          onConfigurationComplete={handleConfigurationComplete}
        />
      </div>
    </div>
  );
};