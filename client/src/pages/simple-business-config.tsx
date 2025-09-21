/**
 * Simple Business Configuration Page
 * Minimal working version for testing
 */

import React from 'react';
import { SimpleBusinessConfig } from '../components/simple-business-config';

export const SimpleBusinessConfigPage: React.FC = () => {
  const tenantId = 'demo-tenant-id';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SimpleBusinessConfig tenantId={tenantId} />
      </div>
    </div>
  );
};