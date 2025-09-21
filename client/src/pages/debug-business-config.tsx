/**
 * Debug Business Configuration Page
 * Simple test page for business configuration
 */

import React from 'react';
import { DebugBusinessConfig } from '@/components/debug-business-config';

export const DebugBusinessConfigPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DebugBusinessConfig />
      </div>
    </div>
  );
};

export default DebugBusinessConfigPage;