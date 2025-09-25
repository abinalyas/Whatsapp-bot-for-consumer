/**
 * Bot Flow Builder Page
 * Main page for creating and managing WhatsApp bot conversation flows
 */

import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Save, Play, Copy } from 'lucide-react';
import { BotFlowBuilder, BotFlow } from '../components/bot-flow-builder';

// API functions
const api = {
  async getBotFlow(flowId: string): Promise<BotFlow | null> {
    try {
      // First try to load from localStorage
      const savedFlows = JSON.parse(localStorage.getItem('botFlows') || '[]');
      const savedFlow = savedFlows.find((f: BotFlow) => f.id === flowId);
      if (savedFlow) {
        console.log('Loaded flow from localStorage:', savedFlow.name);
        return savedFlow;
      }
      
      // If it's the specific salon flow, return demo data
      if (flowId === 'current_salon_flow' || flowId === 'whatsapp_bot_flow') {
        return {
          id: flowId,
          name: '🟢 WhatsApp Bot Flow (EXACT REPLICA)',
          description: 'Exact replica of current WhatsApp bot flow with emojis, layout, and all details',
          businessType: 'salon',
          isActive: true,
          isTemplate: false,
          version: '1.0.0',
          nodes: [
            { 
              id: 'start_1', 
              type: 'start', 
              name: 'Start', 
              position: { x: 100, y: 100 }, 
              configuration: { message: 'Welcome! I can help you book an appointment.' }, 
            connections: [{ id: 'conn_1', sourceNodeId: 'start_1', targetNodeId: 'welcome_msg', label: '' }], 
            metadata: {} 
          },
            { 
              id: 'welcome_msg', 
              type: 'message', 
              name: 'Welcome Message', 
              position: { x: 400, y: 100 }, 
              configuration: { 
                message: '👋 Welcome to Spark Salon!\n\nHere are our services:\n\n💇‍♀️ Haircut – ₹120\n💇‍♀️ Hair Color – ₹600\n💇‍♀️ Hair Styling – ₹300\n💅 Manicure – ₹200\n🦶 Pedicure – ₹65\n\nReply with the number or name of the service to book.' 
              }, 
              connections: [{ id: 'conn_2', sourceNodeId: 'welcome_msg', targetNodeId: 'service_question', label: '' }], 
              metadata: {} 
            },
          { 
            id: 'service_question', 
            type: 'question', 
            name: 'Service Selection', 
            position: { x: 700, y: 100 }, 
            configuration: { 
              question: 'Please select a service:',
              inputType: 'text'
            }, 
            connections: [{ id: 'conn_3', sourceNodeId: 'service_question', targetNodeId: 'service_confirmed', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'service_confirmed', 
            type: 'message', 
            name: 'Service Confirmed', 
            position: { x: 900, y: 100 }, 
            configuration: { 
              message: 'Perfect! You\'ve selected {selectedService} (₹{price}).\n\n📅 Now, please select your preferred appointment date.\n\nAvailable dates:\n1. {date1}\n2. {date2}\n3. {date3}\n4. {date4}\n5. {date5}\n6. {date6}\n7. {date7}\n\nReply with the number (1-7) for your preferred date.' 
            }, 
            connections: [{ id: 'conn_4', sourceNodeId: 'service_confirmed', targetNodeId: 'date_question', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'date_question', 
            type: 'question', 
            name: 'Date Selection', 
            position: { x: 1100, y: 100 }, 
            configuration: { 
              question: 'Please select your preferred date:',
              inputType: 'choice',
              options: ['1', '2', '3', '4', '5', '6', '7']
            }, 
            connections: [{ id: 'conn_5', sourceNodeId: 'date_question', targetNodeId: 'date_confirmed', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'date_confirmed', 
            type: 'message', 
            name: 'Date Confirmed', 
            position: { x: 1300, y: 100 }, 
            configuration: { 
              message: 'Great! You\'ve selected {selectedDate}.\n\n🕐 Now, please choose your preferred time slot:\n\nAvailable times:\n1. 10:00 AM\n2. 11:30 AM\n3. 02:00 PM\n4. 03:30 PM\n5. 05:00 PM\n\nReply with the number (1-5) for your preferred time.' 
            }, 
            connections: [{ id: 'conn_6', sourceNodeId: 'date_confirmed', targetNodeId: 'time_question', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'time_question', 
            type: 'question', 
            name: 'Time Selection', 
            position: { x: 1500, y: 100 }, 
            configuration: { 
              question: 'Please select your preferred time:',
              inputType: 'choice',
              options: ['1', '2', '3', '4', '5']
            }, 
            connections: [{ id: 'conn_7', sourceNodeId: 'time_question', targetNodeId: 'booking_summary', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'booking_summary', 
            type: 'message', 
            name: 'Booking Summary', 
            position: { x: 1700, y: 100 }, 
            configuration: { 
              message: 'Perfect! Your appointment is scheduled for {selectedTime}.\n\n📋 Booking Summary:\nService: {selectedService}\nDate: {selectedDate}\nTime: {selectedTime}\nAmount: ₹{price}\n\n💳 Please complete your payment:\n{upiLink}\n\nComplete payment in GPay/PhonePe/Paytm and reply \'paid\' to confirm your booking.' 
            }, 
            connections: [{ id: 'conn_8', sourceNodeId: 'booking_summary', targetNodeId: 'customer_details', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'customer_details', 
            type: 'question', 
            name: 'Payment Confirmation', 
            position: { x: 1900, y: 100 }, 
            configuration: { 
              question: 'Please confirm your payment:',
              inputType: 'text'
            }, 
            connections: [{ id: 'conn_9', sourceNodeId: 'customer_details', targetNodeId: 'payment_confirmed', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'payment_confirmed', 
            type: 'message', 
            name: 'Payment Confirmed', 
            position: { x: 2100, y: 100 }, 
            configuration: { 
              message: '✅ Payment received! Your appointment is now confirmed.\n\n📋 Booking Details:\nService: {selectedService}\nDate: {selectedDate}\nTime: {selectedTime}\n\n🎉 Thank you for choosing Spark Salon! We look forward to serving you.' 
            }, 
            connections: [{ id: 'conn_10', sourceNodeId: 'payment_confirmed', targetNodeId: 'confirmation_end', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'confirmation_end', 
            type: 'end', 
            name: 'Booking Confirmed', 
            position: { x: 2200, y: 100 }, 
            configuration: { 
              message: 'Thank you! Your appointment has been confirmed. We will send you a reminder before your appointment.'
            }, 
            connections: [], 
            metadata: {} 
          }
          ],
          variables: [
            { name: 'selectedService', type: 'string', description: 'The service selected by customer' },
            { name: 'appointmentDate', type: 'date', description: 'The date chosen for appointment' },
            { name: 'appointmentTime', type: 'string', description: 'The time chosen for appointment' },
            { name: 'customerName', type: 'string', description: 'Customer name' }
          ],
          metadata: {
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            totalBookings: 45,
            successRate: 92
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching bot flow:', error);
      return null;
    }
  },

  async saveBotFlow(flow: BotFlow): Promise<{ success: boolean; message: string }> {
    try {
      // Save to localStorage for demo purposes
      const savedFlows = JSON.parse(localStorage.getItem('botFlows') || '[]');
      const existingIndex = savedFlows.findIndex((f: BotFlow) => f.id === flow.id);
      
      const flowToSave = { 
        ...flow, 
        updatedAt: new Date().toISOString() 
      };
      
      if (existingIndex >= 0) {
        savedFlows[existingIndex] = flowToSave;
      } else {
        savedFlows.push({ 
          ...flowToSave, 
          createdAt: new Date().toISOString() 
        });
      }
      
      localStorage.setItem('botFlows', JSON.stringify(savedFlows));
      console.log('Bot flow saved to localStorage:', flow.name);
      
      return { success: true, message: 'Flow saved successfully!' };
    } catch (error) {
      console.error('Error saving bot flow:', error);
      return { success: false, message: 'Failed to save flow' };
    }
  },

  async testBotFlow(flow: BotFlow): Promise<{ success: boolean; message: string }> {
    // For demo purposes, just return success
    console.log('Testing bot flow:', flow.name);
    return {
      success: true,
      message: 'Bot flow test completed successfully! (Demo mode)'
    };
  },

  async getBotFlowTemplates(businessType: string): Promise<BotFlow[]> {
    // For demo purposes, return empty array
    // In a real implementation, this would fetch templates from the API
    console.log('Fetching templates for business type:', businessType);
    return [];
  },

  async testBotFlowsAPI(): Promise<boolean> {
    try {
      console.log('🧪 Testing bot flows API...');
      const response = await fetch('/api/bot-flows/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('❌ API test failed:', response.status, response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('✅ API test successful:', result.message);
      return result.success;
    } catch (error) {
      console.error('❌ API test error:', error);
      return false;
    }
  },

  async syncFlowWithWhatsApp(flow: BotFlow): Promise<boolean> {
    try {
      console.log('🔄 Starting sync with WhatsApp bot for flow:', flow.name);
      
      // First test if API is reachable
      const apiTest = await this.testBotFlowsAPI();
      if (!apiTest) {
        throw new Error('Bot flows API is not reachable');
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      console.log('📤 Sending sync request to /api/bot-flows/sync');
      const response = await fetch('/api/bot-flows/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flowData: flow }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📥 Received response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync failed:', errorText);
        throw new Error(`Failed to sync flow with WhatsApp bot: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Flow synced with WhatsApp bot:', result.message);
      return result.success;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Sync request timed out');
        throw new Error('Sync request timed out. Please try again.');
      }
      console.error('❌ Error syncing flow with WhatsApp bot:', error);
      throw error;
    }
  }
};

interface BotFlowBuilderPageProps {}

export const BotFlowBuilderPage: React.FC<BotFlowBuilderPageProps> = () => {
  const [, params] = useRoute('/bot-flows/:flowId');
  const [, setLocation] = useLocation();
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
    console.log('useEffect triggered with flowId:', flowId);
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    console.log('Loading flow with ID:', flowId);
    setLoading(true);
    try {
      if (flowId && flowId !== 'new') {
        const loadedFlow = await api.getBotFlow(flowId);
        console.log('Loaded flow:', loadedFlow);
        setFlow(loadedFlow);
        if (loadedFlow) {
          setBusinessType(loadedFlow.businessType);
        } else {
          // If flow is null, show not found
          console.log('Flow not found, showing not found message');
        }
      } else {
        // Create new flow
        console.log('Creating new flow');
        setFlow({
          id: '',
          name: 'New Bot Flow',
          description: '',
          businessType,
          isActive: false,
          isTemplate: false,
          version: '1.0.0',
          nodes: [],
          variables: [],
          metadata: {}
        });
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      // Even in case of error, if it's the salon flow, provide mock data
      if (flowId === 'current_salon_flow' || flowId === 'whatsapp_bot_flow') {
        setFlow({
          id: flowId,
          name: '🟢 WhatsApp Bot Flow (EXACT REPLICA)',
          description: 'Exact replica of current WhatsApp bot flow with emojis, layout, and all details',
          businessType: 'salon',
          isActive: true,
          isTemplate: false,
          version: '1.0.0',
          nodes: [
            { id: 'start_1', type: 'start', name: 'Start', position: { x: 100, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'welcome_msg', type: 'message', name: 'Welcome Message', position: { x: 400, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'service_question', type: 'question', name: 'Service Selection', position: { x: 700, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'date_question', type: 'question', name: 'Date Selection', position: { x: 1000, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'time_question', type: 'question', name: 'Time Selection', position: { x: 1300, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'customer_details', type: 'question', name: 'Customer Name', position: { x: 1600, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'payment_action', type: 'action', name: 'Payment Request', position: { x: 1900, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: 'confirmation_end', type: 'end', name: 'Booking Confirmed', position: { x: 2200, y: 100 }, configuration: {}, connections: [], metadata: {} }
          ],
          variables: [],
          metadata: {}
        });
        setBusinessType('salon');
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleSave = async (updatedFlow: BotFlow) => {
    setSaving(true);
    try {
      console.log('💾 Saving flow...', updatedFlow.name);
      
      // Save the flow first
      const savedFlow = await api.saveBotFlow(updatedFlow);
      setFlow(savedFlow);
      console.log('✅ Flow saved successfully');
      
      // Try to sync with WhatsApp bot (optional, don't fail if this fails)
      let syncSuccess = false;
      
      // Enable sync to apply changes immediately to WhatsApp bot
      const ENABLE_SYNC = true;
      const USE_MOCK_SYNC = false; // Use real API sync to update WhatsApp bot
      
      if (ENABLE_SYNC) {
        try {
          console.log('🔄 Syncing with WhatsApp bot...');
          console.log('📋 Flow data being synced:', {
            id: updatedFlow.id,
            name: updatedFlow.name,
            nodesCount: updatedFlow.nodes?.length || 0,
            connectionsCount: updatedFlow.connections?.length || 0
          });
          
          if (USE_MOCK_SYNC) {
            // Mock sync for demo - simulates successful sync
            console.log('🎭 Using mock sync for demo purposes');
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
            syncSuccess = true;
            console.log('✅ Flow synced with WhatsApp bot (mock)');
          } else {
            await api.syncFlowWithWhatsApp(updatedFlow);
            syncSuccess = true;
            console.log('✅ Flow synced with WhatsApp bot');
          }
        } catch (syncError) {
          console.warn('⚠️ Flow saved but sync failed (this is optional):', syncError);
          console.log('ℹ️ Flow is saved locally and will work in the bot flow builder');
          // Don't fail the save if sync fails - this is optional
        }
      } else {
        console.log('ℹ️ Sync disabled for now - flow saved locally');
      }
      
      // If this was a new flow, redirect to the saved flow
      if (!flowId || flowId === 'new') {
        setLocation(`/bot-flows/${savedFlow.id}`);
      }
      
      // Show success message
      if (syncSuccess) {
        alert('✅ Bot flow saved and synced with WhatsApp bot! Changes will apply immediately.');
      } else {
        alert('✅ Bot flow saved successfully! (Sync with WhatsApp bot will be available after deployment)');
      }
      
    } catch (error) {
      console.error('❌ Error saving flow:', error);
      alert('Error saving bot flow. Please try again.');
    } finally {
      console.log('🔄 Setting saving to false');
      setSaving(false);
    }
  };

  const handleTest = async (flowToTest: BotFlow) => {
    setTesting(true);
    try {
      const result = await api.testBotFlow(flowToTest);
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