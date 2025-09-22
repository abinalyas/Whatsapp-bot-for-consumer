/**
 * Bot Flow Builder Page
 * Main page for creating and managing WhatsApp bot conversation flows
 */

import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Save, Play, Download, Upload, Copy, Trash2 } from 'lucide-react';
import { BotFlowBuilder, BotFlow } from '../components/bot-flow-builder';

// Mock API functions (replace with actual API calls)
const mockApi = {
  async getBotFlow(tenantId: string, flowId: string): Promise<BotFlow | null> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: flowId,
          name: 'Sample Restaurant Bot Flow',
          description: 'A sample bot flow for restaurant bookings',
          businessType: 'restaurant',
          isActive: false,
          nodes: [
            {
              id: 'start_1',
              type: 'start',
              name: 'Start',
              position: { x: 100, y: 100 },
              configuration: {},
              connections: [
                {
                  id: 'conn_1',
                  sourceNodeId: 'start_1',
                  targetNodeId: 'message_1',
                  label: 'Begin'
                }
              ],
              metadata: {}
            },
            {
              id: 'message_1',
              type: 'message',
              name: 'Welcome Message',
              position: { x: 400, y: 100 },
              configuration: {
                messageText: 'Welcome to our restaurant! I can help you make a reservation.'
              },
              connections: [
                {
                  id: 'conn_2',
                  sourceNodeId: 'message_1',
                  targetNodeId: 'question_1',
                  label: 'Next'
                }
              ],
              metadata: {}
            },
            {
              id: 'question_1',
              type: 'question',
              name: 'Ask for Date',
              position: { x: 700, y: 100 },
              configuration: {
                questionText: 'What date would you like to make a reservation for?',
                inputType: 'date',
                variableName: 'reservation_date'
              },
              connections: [],
              metadata: {}
            }
          ],
          variables: [
            {
              name: 'reservation_date',
              type: 'date',
              description: 'The date for the reservation'
            },
            {
              name: 'party_size',
              type: 'number',
              description: 'Number of people'
            }
          ]
        });
      }, 500);
    });
  },

  async saveBotFlow(tenantId: string, flow: BotFlow): Promise<BotFlow> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Saving bot flow:', flow);
        resolve({ ...flow, id: flow.id || `flow_${Date.now()}` });
      }, 1000);
    });
  },

  async testBotFlow(tenantId: string, flow: BotFlow): Promise<{ success: boolean; message: string }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Bot flow test completed successfully!'
        });
      }, 2000);
    });
  },

  async getBotFlowTemplates(businessType: string): Promise<BotFlow[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'template_restaurant',
            name: 'Restaurant Booking Template',
            description: 'Complete flow for restaurant reservations',
            businessType: 'restaurant',
            isActive: false,
            nodes: [],
            variables: []
          },
          {
            id: 'template_salon',
            name: 'Salon Appointment Template',
            description: 'Complete flow for salon appointments',
            businessType: 'salon',
            isActive: false,
            nodes: [],
            variables: []
          }
        ]);
      }, 500);
    });
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
        const loadedFlow = await mockApi.getBotFlow(tenantId, flowId);
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
      const savedFlow = await mockApi.saveBotFlow(tenantId, updatedFlow);
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
      const result = await mockApi.testBotFlow(tenantId, flowToTest);
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
      const loadedTemplates = await mockApi.getBotFlowTemplates(businessType);
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