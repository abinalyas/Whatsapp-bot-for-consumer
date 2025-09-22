/**
 * Bot Flows List Page
 * Manage and view all bot flows for a tenant
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Mock API functions
const mockApi = {
  async getBotFlows(tenantId: string, filters: any = {}): Promise<{ flows: BotFlow[]; total: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockFlows: BotFlow[] = [
          {
            id: 'flow_1',
            name: 'Restaurant Booking Flow',
            description: 'Complete flow for restaurant table reservations',
            businessType: 'restaurant',
            isActive: true,
            nodes: [
              { id: '1', type: 'start', name: 'Start', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
              { id: '2', type: 'message', name: 'Welcome', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
              { id: '3', type: 'question', name: 'Date', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
              { id: '4', type: 'end', name: 'End', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} }
            ],
            variables: []
          },
          {
            id: 'flow_2',
            name: 'Customer Support Flow',
            description: 'Handle customer inquiries and support requests',
            businessType: 'restaurant',
            isActive: false,
            nodes: [
              { id: '1', type: 'start', name: 'Start', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
              { id: '2', type: 'question', name: 'Issue Type', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
              { id: '3', type: 'condition', name: 'Route', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} }
            ],
            variables: []
          },
          {
            id: 'flow_3',
            name: 'Menu Inquiry Flow',
            description: 'Help customers browse menu and get information',
            businessType: 'restaurant',
            isActive: true,
            nodes: [
              { id: '1', type: 'start', name: 'Start', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
              { id: '2', type: 'message', name: 'Menu Options', position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} }
            ],
            variables: []
          }
        ];

        const filteredFlows = mockFlows.filter(flow => {
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return flow.name.toLowerCase().includes(searchLower) || 
                   flow.description?.toLowerCase().includes(searchLower);
          }
          if (filters.status === 'active') return flow.isActive;
          if (filters.status === 'inactive') return !flow.isActive;
          return true;
        });

        resolve({
          flows: filteredFlows,
          total: filteredFlows.length
        });
      }, 500);
    });
  },

  async toggleBotFlowStatus(tenantId: string, flowId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Toggling flow ${flowId} status`);
        resolve(true);
      }, 500);
    });
  },

  async deleteBotFlow(tenantId: string, flowId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Deleting flow ${flowId}`);
        resolve(true);
      }, 500);
    });
  },

  async duplicateBotFlow(tenantId: string, flowId: string): Promise<BotFlow> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `flow_${Date.now()}`,
          name: 'Copy of Flow',
          description: 'Duplicated flow',
          businessType: 'restaurant',
          isActive: false,
          nodes: [],
          variables: []
        });
      }, 500);
    });
  }
};

interface BotFlowsListPageProps {}

export const BotFlowsListPage: React.FC<BotFlowsListPageProps> = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock tenant ID
  const tenantId = 'tenant_123';

  useEffect(() => {
    loadFlows();
  }, [searchTerm, statusFilter]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const result = await mockApi.getBotFlows(tenantId, {
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setFlows(result.flows);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (flowId: string) => {
    try {
      await mockApi.toggleBotFlowStatus(tenantId, flowId);
      setFlows(prev => prev.map(flow => 
        flow.id === flowId ? { ...flow, isActive: !flow.isActive } : flow
      ));
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  const handleDelete = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this bot flow?')) return;

    try {
      await mockApi.deleteBotFlow(tenantId, flowId);
      setFlows(prev => prev.filter(flow => flow.id !== flowId));
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  const handleDuplicate = async (flowId: string) => {
    try {
      const duplicatedFlow = await mockApi.duplicateBotFlow(tenantId, flowId);
      setFlows(prev => [duplicatedFlow, ...prev]);
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
  };

  const getFlowStats = (flow: BotFlow) => {
    const nodeTypes = flow.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNodes: flow.nodes.length,
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
                onClick={() => navigate('/bot-flows/new')}
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
                onClick={() => navigate('/bot-flows/new')}
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
                        {flow.variables.length} variables
                      </div>
                    </div>
                  </div>

                  {/* Flow Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/bot-flows/${flow.id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit flow"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/bot-flows/${flow.id}/preview`)}
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
                          onClick={() => handleToggleStatus(flow.id)}
                          className={`p-2 rounded transition-colors ${
                            flow.isActive
                              ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          }`}
                          title={flow.isActive ? 'Deactivate flow' : 'Activate flow'}
                        >
                          {flow.isActive ? <Pause size={16} /> : <Play size={16} />}
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
                  {flows.reduce((sum, f) => sum + f.nodes.length, 0)}
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