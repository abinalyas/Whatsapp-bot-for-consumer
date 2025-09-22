/**
 * Test Routing Page
 * Simple page to test if routing is working
 */

import React from 'react';
import { useLocation } from 'wouter';

export const TestRoutingPage: React.FC = () => {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Routing Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Location</h2>
          <p className="text-gray-600">Current path: <code className="bg-gray-100 px-2 py-1 rounded">{location}</code></p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
          <div className="space-y-2">
            <button
              onClick={() => setLocation('/bot-flows')}
              className="block w-full text-left px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded"
            >
              Go to Bot Flows
            </button>
            <button
              onClick={() => setLocation('/bot-flows/new')}
              className="block w-full text-left px-4 py-2 bg-green-100 hover:bg-green-200 rounded"
            >
              Go to New Bot Flow
            </button>
            <button
              onClick={() => setLocation('/bot-flows/test-flow-123')}
              className="block w-full text-left px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded"
            >
              Go to Test Flow
            </button>
            <button
              onClick={() => setLocation('/')}
              className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Go to Home
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Route Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Expected Routes:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><code>/bot-flows</code> → Bot Flows List Page</li>
              <li><code>/bot-flows/new</code> → New Bot Flow Builder</li>
              <li><code>/bot-flows/:flowId</code> → Edit Bot Flow Builder</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRoutingPage;