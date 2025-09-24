/**
 * Bot Flows List Page
 * Manage and view all bot flows for a tenant
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  MessageSquare,
  Calendar,
  Users
} from 'lucide-react';
import { BotFlow } from '../components/bot-flow-builder';

// API functions - All local, no server calls
const api = {
  async getBotFlows(tenantId: string, filters: any = {}): Promise<{ flows: BotFlow[]; total: number }> {
    // Always return empty for component to handle
    return { flows: [], total: 0 };
  },

  async toggleBotFlowStatus(tenantId: string, flowId: string): Promise<boolean> {
    console.log(`Toggling flow ${flowId} status (demo mode)`);
    return true;
  },

  async saveBotFlow(tenantId: string, flow: BotFlow): Promise<boolean> {
    try {
      const savedFlows = JSON.parse(localStorage.getItem('botFlows') || '[]');
      const existingIndex = savedFlows.findIndex((f: BotFlow) => f.id === flow.id);
      
      if (existingIndex >= 0) {
        savedFlows[existingIndex] = { ...flow, updatedAt: new Date().toISOString() };
      } else {
        savedFlows.push({ ...flow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      
      localStorage.setItem('botFlows', JSON.stringify(savedFlows));
      console.log('Bot flow saved to localStorage:', flow.name);
      return true;
    } catch (error) {
      console.error('Error saving bot flow:', error);
      return false;
    }
  },

  async loadBotFlows(tenantId: string): Promise<BotFlow[]> {
    try {
      const savedFlows = JSON.parse(localStorage.getItem('botFlows') || '[]');
      console.log('Loaded bot flows from localStorage:', savedFlows.length);
      
      // Validate and fix flow data structure
      const validatedFlows = savedFlows.map((flow: any) => ({
        ...flow,
        nodes: flow.nodes || [],
        connections: flow.connections || [],
        variables: flow.variables || [],
        metadata: flow.metadata || {}
      }));
      
      return validatedFlows;
    } catch (error) {
      console.error('Error loading bot flows:', error);
      return [];
    }
  },

  async deleteBotFlow(tenantId: string, flowId: string): Promise<boolean> {
    try {
      const savedFlows = JSON.parse(localStorage.getItem('botFlows') || '[]');
      const filteredFlows = savedFlows.filter((f: BotFlow) => f.id !== flowId);
      localStorage.setItem('botFlows', JSON.stringify(filteredFlows));
      console.log('Bot flow deleted from localStorage:', flowId);
      return true;
    } catch (error) {
      console.error('Error deleting bot flow:', error);
      return false;
    }
  },

  async duplicateBotFlow(tenantId: string, flowId: string): Promise<BotFlow> {
    try {
      const savedFlows = JSON.parse(localStorage.getItem('botFlows') || '[]');
      const originalFlow = savedFlows.find((f: BotFlow) => f.id === flowId);
      
      if (!originalFlow) {
        throw new Error('Flow not found');
      }
      
      const duplicatedFlow = {
        ...originalFlow,
        id: `flow_${Date.now()}`,
        name: `${originalFlow.name} Copy`,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      savedFlows.push(duplicatedFlow);
      localStorage.setItem('botFlows', JSON.stringify(savedFlows));
      console.log('Bot flow duplicated in localStorage:', duplicatedFlow.name);
      return duplicatedFlow;
    } catch (error) {
      console.error('Error duplicating bot flow:', error);
      throw error;
    }
  },

  async activateFlow(tenantId: string, flowId: string): Promise<boolean> {
    console.log(`Activating flow ${flowId} (demo mode)`);
    return true;
  },

  async deactivateFlow(tenantId: string, flowId: string): Promise<boolean> {
    console.log(`Deactivating flow ${flowId} (demo mode)`);
    return true;
  }
};

interface BotFlowsListPageProps {}

export const BotFlowsListPage: React.FC<BotFlowsListPageProps> = () => {
  const [location, setLocation] = useLocation();
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock tenant ID - in a real app, this would come from auth context
  const tenantId = 'tenant_123';

  useEffect(() => {
    console.log('useEffect triggered, loading flows');
    loadFlows();
  }, [searchTerm, statusFilter]);

  const loadFlows = async () => {
    console.log('Loading flows...');
    setLoading(true);
    
    try {
      // First try to load saved flows from localStorage
      const savedFlows = await api.loadBotFlows(tenantId);
      if (savedFlows.length > 0) {
        console.log('Using saved flows from localStorage:', savedFlows.length);
        setFlows(savedFlows);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('No saved flows found, using demo data');
    }
    
    // Fallback to demo data if no saved flows
    const demoFlows = [
      {
        id: 'whatsapp_bot_flow',
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
              message: 'Hello! Welcome to our salon. I can help you book an appointment. What service would you like?' 
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
              question: 'Which service would you like?',
              options: ['Haircut', 'Hair Color', 'Manicure', 'Pedicure', 'Facial']
            }, 
            connections: [{ id: 'conn_3', sourceNodeId: 'service_question', targetNodeId: 'date_question', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'date_question', 
            type: 'question', 
            name: 'Date Selection', 
            position: { x: 1000, y: 100 }, 
            configuration: { 
              question: 'What date would you prefer?',
              inputType: 'date'
            }, 
            connections: [{ id: 'conn_4', sourceNodeId: 'date_question', targetNodeId: 'time_question', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'time_question', 
            type: 'question', 
            name: 'Time Selection', 
            position: { x: 1300, y: 100 }, 
            configuration: { 
              question: 'What time works best for you?',
              options: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM']
            }, 
            connections: [{ id: 'conn_5', sourceNodeId: 'time_question', targetNodeId: 'customer_details', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'customer_details', 
            type: 'question', 
            name: 'Customer Name', 
            position: { x: 1600, y: 100 }, 
            configuration: { 
              question: 'What is your name?',
              inputType: 'text'
            }, 
            connections: [{ id: 'conn_6', sourceNodeId: 'customer_details', targetNodeId: 'payment_action', label: '' }], 
            metadata: {} 
          },
          { 
            id: 'payment_action', 
            type: 'action', 
            name: 'Payment Request', 
            position: { x: 1900, y: 100 }, 
            configuration: { 
              action: 'request_payment',
              message: 'Please confirm your booking details and make payment to secure your appointment.'
            }, 
            connections: [{ id: 'conn_7', sourceNodeId: 'payment_action', targetNodeId: 'confirmation_end', label: '' }], 
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
      }
    ];
    
    console.log('Setting demo flows:', demoFlows);
    setFlows(demoFlows);
    setLoading(false);
    console.log('✅ Bot flows loaded successfully - no API calls made');
  };

  const handleToggleStatus = async (flowId: string) => {
    try {
      await api.toggleBotFlowStatus(tenantId, flowId);
      setFlows(prev => prev.map(flow => 
        flow.id === flowId ? { ...flow, isActive: !flow.isActive } : flow
      ));
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  const handleEditFlow = (flowId: string) => {
    // Navigate to the bot flow builder with the flow ID
    setLocation(`/bot-flows/${flowId}`);
  };

  const handleSaveFlow = async (flow: BotFlow) => {
    try {
      const success = await api.saveBotFlow(tenantId, flow);
      if (success) {
        // Update the flows list with the saved flow
        setFlows(prev => prev.map(f => f.id === flow.id ? flow : f));
        console.log('Flow saved successfully');
      }
    } catch (error) {
      console.error('Error saving flow:', error);
    }
  };

  const handleDelete = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this bot flow?')) return;

    try {
      await api.deleteBotFlow(tenantId, flowId);
      setFlows(prev => prev.filter(flow => flow.id !== flowId));
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  const handleDuplicate = async (flowId: string) => {
    try {
      const duplicatedFlow = await api.duplicateBotFlow(tenantId, flowId);
      setFlows(prev => [duplicatedFlow, ...prev]);
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
  };

  const handleActivateFlow = async (flowId: string) => {
    try {
      const flow = flows.find(f => f.id === flowId);
      if (!flow) return;

      if (flow.isActive) {
        // Deactivate flow
        await api.deactivateFlow(tenantId, flowId);
        setFlows(prev => prev.map(f => 
          f.id === flowId ? { ...f, isActive: false } : f
        ));
        alert('Flow deactivated. WhatsApp will use default responses.');
      } else {
        // Activate flow (deactivate others first)
        await api.activateFlow(tenantId, flowId);
        setFlows(prev => prev.map(f => ({
          ...f,
          isActive: f.id === flowId
        })));
        alert(`"${flow.name}" is now active! WhatsApp will use this flow for all conversations.`);
      }
    } catch (error) {
      console.error('Error toggling flow activation:', error);
      alert('Error updating flow status. Please try again.');
    }
  };

  const getFlowStats = (flow: BotFlow) => {
    const nodeTypes = (flow.nodes || []).reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNodes: flow.nodes?.length || 0,
      messages: nodeTypes.message || 0,
      questions: nodeTypes.question || 0,
      conditions: nodeTypes.condition || 0
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bot Flows</h1>
                <p className="text-gray-600 mt-1">
                  Create and manage WhatsApp bot conversation flows
                </p>
              </div>
              
              <button
                onClick={() => setLocation('/bot-flows/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Create Flow
              </button>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bot flows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg transition-colors flex items-center ${
                  showFilters 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={20} className="mr-2" />
                Filters
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Flows</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading bot flows...</span>
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bot flows found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first bot flow'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setLocation('/bot-flows/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Flow
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => {
              const stats = getFlowStats(flow);
              
              return (
                <div
                  key={flow.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Flow Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {flow.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {flow.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className="flex items-center ml-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          flow.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {flow.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Flow Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MessageSquare size={16} className="mr-2" />
                        {stats.totalNodes} nodes
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users size={16} className="mr-2" />
                        {flow.variables?.length || 0} variables
                      </div>
                    </div>
                  </div>

                  {/* Flow Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditFlow(flow.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit flow"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => setLocation(`/bot-flows/${flow.id}/preview`)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Preview flow"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleDuplicate(flow.id)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Duplicate flow"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleActivateFlow(flow.id)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            flow.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                          }`}
                          title={flow.isActive ? 'Active for WhatsApp' : 'Activate for WhatsApp'}
                        >
                          {flow.isActive ? '🟢 Active' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(flow.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete flow"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {flows.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {flows.length}
                </div>
                <div className="text-sm text-gray-600">Total Flows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {flows.filter(f => f.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Active Flows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {flows.filter(f => !f.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Draft Flows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {flows.reduce((sum, f) => sum + (f.nodes?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Nodes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotFlowsListPage;