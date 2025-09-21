/**
 * Simple Test Page
 * Basic page to test if routing works
 */

import React from 'react';

export const SimpleTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Routing Works!
        </h1>
        <p className="text-gray-600 mb-6">
          If you can see this page, client-side routing is working correctly.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="font-semibold text-green-800">✅ Success!</h2>
            <p className="text-sm text-green-600">
              The React app is properly configured for SPA routing.
            </p>
          </div>
          <div className="flex space-x-4 justify-center">
            <a 
              href="/" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Dashboard
            </a>
            <a 
              href="/business-config" 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Try Business Config
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};