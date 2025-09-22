/**
 * Bot Flow Builder Page
 * Main page for creating and managing WhatsApp bot conversation flows
 */

import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Save, Play, Download, Upload, Copy, Trash2 } from 'lucide-react';
import { BotFlowBuilder, BotFlow } from '../components/bot-flow-builder';

// API functions
const api = {
  async getBotFlow(tenantId: string, flowId: string): Promise<BotFlow | null> {
    try {
      const response = await fetch(`/api/bot-flows/${flowId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bot flow');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching bot flow:', error);
      return null;
    }
  },

  async saveBotFlow(tenantId: string, flow: BotFlow): Promise<BotFlow> {
    try {
      const method = flow.id ? 'PUT' : 'POST';
      const url = flow.id ? `/api/bot-flows/${flow.id}` : '/api/bot-flows';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flow),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save bot flow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving bot flow:', error);
      throw error;
    }
  },

  async testBotFlow(tenantId: string, flow: BotFlow): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/bot-flows/${flow.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flow),
      });
      
      if (!response.ok) {
        throw new Error('Failed to test bot flow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error testing bot flow:', error);
      return {
        success: false,
        message: 'Error testing bot flow. Please try again.'
      };
    }
  },

  async getBotFlowTemplates(businessType: string): Promise<BotFlow[]> {
    try {
      const response = await fetch(`/api/bot-flows?businessType=${businessType}&templates=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }
};

interface BotFlowBuilderPageProps {}

export const BotFlowBuilderPage: React.FC<BotFlowBuilderPageProps> = () => {
  const [match, params] = useRoute('/bot-flows/:flowId');
  const [location, setLocation] = useLocation();
  const flowId = params?.flowId;
  
  const [flow, setFlow] = useState<BotFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<BotFlow[]>([]);
  const [businessType, setBusinessType] = useState('restaurant');

  // Mock tenant ID (replace with actual tenant context)
  const tenantId = 'tenant_123';

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    setLoading(true);
    try {
      if (flowId && flowId !== 'new') {
        const loadedFlow = await api.getBotFlow(tenantId, flowId);
        setFlow(loadedFlow);
        if (loadedFlow) {
          setBusinessType(loadedFlow.businessType);
        }
      } else {
        // Create new flow
        setFlow({
          id: '',
          name: 'New Bot Flow',
          description: '',
          businessType,
          isActive: false,
          nodes: [],
          variables: []
        });
      }
    } catch (error) {
      console.error('Error loading flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedFlow: BotFlow) => {
    setSaving(true);
    try {
      const savedFlow = await api.saveBotFlow(tenantId, updatedFlow);
      setFlow(savedFlow);
      
      // If this was a new flow, redirect to the saved flow
      if (!flowId || flowId === 'new') {
        setLocation(`/bot-flows/${savedFlow.id}`);
      }
      
      // Show success message
      alert('Bot flow saved successfully!');
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error saving bot flow. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (flowToTest: BotFlow) => {
    setTesting(true);
    try {
      const result = await api.testBotFlow(tenantId, flowToTest);
      alert(result.message);
    } catch (error) {
      console.error('Error testing flow:', error);
      alert('Error testing bot flow. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await api.getBotFlowTemplates(businessType);
      setTemplates(loadedTemplates);
      setShowTemplates(true);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createFromTemplate = (template: BotFlow) => {
    const newFlow: BotFlow = {
      ...template,
      id: '',
      name: `${template.name} Copy`,
      isActive: false
    };
    setFlow(newFlow);
    setShowTemplates(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bot flow...</p>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bot flow not found</p>
          <button
            onClick={() => setLocation('/bot-flows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Bot Flows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation('/bot-flows')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Bot Flows
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {flow.name || 'Untitled Flow'}
              </h1>
              <p className="text-sm text-gray-600">
                {flow.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadTemplates}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Copy size={16} className="inline mr-2" />
              Templates
            </button>

            <button
              onClick={() => handleTest(flow)}
              disabled={testing}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Play size={16} className="inline mr-2" />
              {testing ? 'Testing...' : 'Test Flow'}
            </button>

            <button
              onClick={() => handleSave(flow)}
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={16} className="inline mr-2" />
              {saving ? 'Saving...' : 'Save Flow'}
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                flow.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {flow.isActive ? 'Active' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Flow Builder */}
      <div className="flex-1">
        <BotFlowBuilder
          tenantId={tenantId}
          businessType={businessType}
          initialFlow={flow}
          onSave={handleSave}
          onTest={handleTest}
        />
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Bot Flow Templates
                </h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer"
                    onClick={() => createFromTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>Business Type: {template.businessType}</span>
                          <span>{template.nodes.length} nodes</span>
                        </div>
                      </div>
                      <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No templates available for {businessType} business type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotFlowBuilderPage;