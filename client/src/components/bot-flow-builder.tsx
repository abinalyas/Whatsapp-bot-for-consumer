/**
 * Visual Bot Flow Builder Component
 * Drag-and-drop interface for creating WhatsApp bot conversation flows
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Plus, 
  Save, 
  Play, 
  Trash2, 
  Settings, 
  MessageSquare, 
  HelpCircle, 
  GitBranch, 
  Zap, 
  Link,
  Eye
} from 'lucide-react';

// ===== TYPES =====

export interface BotFlowNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action' | 'integration' | 'end';
  name: string;
  description?: string;
  position: { x: number; y: number };
  configuration: BotFlowNodeConfiguration;
  connections: BotFlowConnection[];
  metadata: Record<string, any>;
}

export interface BotFlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
  label?: string;
}

export interface BotFlowNodeConfiguration {
  messageText?: string;
  messageType?: 'text' | 'image' | 'document' | 'template';
  questionText?: string;
  inputType?: 'text' | 'number' | 'choice' | 'date' | 'phone' | 'email';
  choices?: Array<{ value: string; label: string }>;
  variableName?: string;
  conditions?: Array<{
    variable: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
  actionType?: 'create_transaction' | 'update_transaction' | 'send_notification' | 'call_webhook';
  actionParameters?: Record<string, any>;
}

export interface BotFlow {
  id: string;
  name: string;
  description?: string;
  businessType: string;
  isActive: boolean;
  nodes: BotFlowNode[];
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    defaultValue?: any;
    description?: string;
  }>;
}

// ===== NODE TYPE DEFINITIONS =====

const NODE_TYPES = {
  start: {
    icon: Play,
    color: 'bg-green-500',
    label: 'Start',
    description: 'Entry point for the conversation'
  },
  message: {
    icon: MessageSquare,
    color: 'bg-blue-500',
    label: 'Message',
    description: 'Send a message to the user'
  },
  question: {
    icon: HelpCircle,
    color: 'bg-purple-500',
    label: 'Question',
    description: 'Ask user for input'
  },
  condition: {
    icon: GitBranch,
    color: 'bg-yellow-500',
    label: 'Condition',
    description: 'Branch based on conditions'
  },
  action: {
    icon: Zap,
    color: 'bg-orange-500',
    label: 'Action',
    description: 'Perform an action'
  },
  integration: {
    icon: Link,
    color: 'bg-indigo-500',
    label: 'Integration',
    description: 'Connect to external service'
  },
  end: {
    icon: Eye,
    color: 'bg-red-500',
    label: 'End',
    description: 'End the conversation'
  }
};

// ===== MAIN COMPONENT =====

interface BotFlowBuilderProps {
  tenantId: string;
  businessType: string;
  initialFlow?: BotFlow;
  onSave?: (flow: BotFlow) => void;
  onTest?: (flow: BotFlow) => void;
}

export const BotFlowBuilder: React.FC<BotFlowBuilderProps> = ({
  businessType,
  initialFlow,
  onSave,
  onTest
}) => {
  const [flow, setFlow] = useState<BotFlow>(initialFlow || {
    id: '',
    name: 'New Bot Flow',
    description: '',
    businessType,
    isActive: false,
    nodes: [],
    variables: []
  });

  const [selectedNode, setSelectedNode] = useState<BotFlowNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<{source: string, target: string} | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ===== NODE MANAGEMENT =====

  const addNode = useCallback((type: keyof typeof NODE_TYPES, position?: { x: number; y: number }) => {
    const newNode: BotFlowNode = {
      id: `node_${Date.now()}`,
      type,
      name: `${NODE_TYPES[type].label} ${flow.nodes.length + 1}`,
      position: position || { x: 200, y: 200 },
      configuration: {},
      connections: [],
      metadata: {}
    };

    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    setSelectedNode(newNode);
  }, [flow.nodes.length]);

  const updateNode = useCallback((nodeId: string, updates: Partial<BotFlowNode>) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedNode]);

  const deleteNode = useCallback((nodeId: string) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          connections: node.connections.filter(conn => conn.targetNodeId !== nodeId)
        }))
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // ===== CONNECTION MANAGEMENT =====

  const startConnection = useCallback((nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
  }, []);

  const completeConnection = useCallback((targetNodeId: string) => {
    console.log('Completing connection:', { connectionStart, targetNodeId });
    
    if (!connectionStart) {
      console.log('No connection start node selected');
      return;
    }
    
    if (connectionStart === targetNodeId) {
      console.log('Cannot connect node to itself');
      return;
    }

    const newConnection: BotFlowConnection = {
      id: `conn_${Date.now()}`,
      sourceNodeId: connectionStart,
      targetNodeId,
      label: 'Next'
    };

    console.log('Creating new connection:', newConnection);

    setFlow(prev => {
      // Check if this connection already exists
      const sourceNode = prev.nodes.find(n => n.id === connectionStart);
      if (sourceNode) {
        const connectionExists = sourceNode.connections.some(
          conn => conn.targetNodeId === targetNodeId
        );
        
        if (connectionExists) {
          console.log('Connection already exists between these nodes');
          return prev;
        }
      }

      const updatedNodes = prev.nodes.map(node => 
        node.id === connectionStart 
          ? { ...node, connections: [...node.connections, newConnection] }
          : node
      );
      
      console.log('Updated nodes:', updatedNodes);
      
      return {
        ...prev,
        nodes: updatedNodes
      };
    });
    
    // Show success feedback
    setConnectionSuccess({source: connectionStart, target: targetNodeId});
    setTimeout(() => setConnectionSuccess(null), 2000);
    
    console.log('Connection created successfully');

    setIsConnecting(false);
    setConnectionStart(null);
  }, [connectionStart]);

  const deleteConnection = useCallback((sourceNodeId: string, connectionId: string) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === sourceNodeId 
          ? { ...node, connections: node.connections.filter(conn => conn.id !== connectionId) }
          : node
      )
    }));
  }, []);

  // ===== DRAG AND DROP =====

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (isConnecting) {
      console.log('Mouse down in connecting mode, completing connection to:', nodeId);
      completeConnection(nodeId);
      return;
    }

    const node = flow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsDragging(true);
    setSelectedNode(node);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - node.position.x * zoom - pan.x,
        y: e.clientY - rect.top - node.position.y * zoom - pan.y
      });
    }
  }, [flow.nodes, isConnecting, completeConnection, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // 考虑到可能存在的滚动条和CSS变换，直接计算相对于画布的位置
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const newPosition = {
      x: (canvasX - dragOffset.x - pan.x) / zoom,
      y: (canvasY - dragOffset.y - pan.y) / zoom
    };

    updateNode(selectedNode.id, { position: newPosition });
  }, [isDragging, selectedNode, dragOffset, updateNode, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ===== CANVAS EVENTS =====

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
      }
    }
  }, [isConnecting]);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const position = {
        x: (canvasX - pan.x) / zoom,
        y: (canvasY - pan.y) / zoom
      };
      
      addNode('message', position);
    }
  }, [addNode, zoom, pan]);

  // ===== SAVE AND TEST =====

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(flow);
    }
  }, [flow, onSave]);

  const handleTest = useCallback(() => {
    if (onTest) {
      onTest(flow);
    }
  }, [flow, onTest]);

  // ===== RENDER CONNECTIONS =====

  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    flow.nodes.forEach(node => {
      node.connections.forEach(connection => {
        const targetNode = flow.nodes.find(n => n.id === connection.targetNodeId);
        if (!targetNode) return;

        // Calculate connection points (right side of source to left side of target)
        const startX = node.position.x + 200; // Right edge of source node (200px is node width)
        const startY = node.position.y + 30;  // Middle of source node (~30px from top)
        const endX = targetNode.position.x;   // Left edge of target node
        const endY = targetNode.position.y + 30; // Middle of target node (~30px from top)

        // Apply zoom and pan transformations
        const transformedStartX = startX * zoom + pan.x;
        const transformedStartY = startY * zoom + pan.y;
        const transformedEndX = endX * zoom + pan.x;
        const transformedEndY = endY * zoom + pan.y;

        // Create a curved path with better control points
        const dx = Math.abs(transformedEndX - transformedStartX);
        const controlX1 = transformedStartX + Math.max(50, dx * 0.3);
        const controlY1 = transformedStartY;
        const controlX2 = transformedEndX - Math.max(50, dx * 0.3);
        const controlY2 = transformedEndY;

        const midX = (transformedStartX + transformedEndX) / 2;
        const midY = (transformedStartY + transformedEndY) / 2;

        connections.push(
          <g key={connection.id} style={{ pointerEvents: 'auto' }}>
            <path
              d={`M ${transformedStartX} ${transformedStartY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${transformedEndX} ${transformedEndY}`}
              stroke="#6b7280"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              style={{ pointerEvents: 'auto' }}
            />
            {connection.label && (
              <text
                x={midX}
                y={midY - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                style={{ 
                  pointerEvents: 'auto',
                  background: 'white',
                  paintOrder: 'stroke',
                  strokeWidth: '2px',
                  strokeLinejoin: 'round'
                }}
              >
                {connection.label}
              </text>
            )}
            <circle
              cx={midX}
              cy={midY}
              r="8"
              fill="white"
              stroke="#ef4444"
              strokeWidth="2"
              style={{ 
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
              className="hover:fill-red-50"
              onClick={(e) => {
                e.stopPropagation();
                deleteConnection(node.id, connection.id);
              }}
            />
            <text
              x={midX}
              y={midY + 1}
              textAnchor="middle"
              className="text-xs fill-red-500"
              style={{ pointerEvents: 'none' }}
            >
              ×
            </text>
          </g>
        );
      });
    });

    return connections;
  };

  // ===== RENDER NODES =====

  const renderNode = (node: BotFlowNode) => {
    const nodeType = NODE_TYPES[node.type];
    const Icon = nodeType.icon;
    const isSelected = selectedNode?.id === node.id;
    const isConnectionSource = isConnecting && connectionStart === node.id;
    const isConnectionTarget = isConnecting && connectionStart !== node.id && connectionStart !== null;

    return (
      <div
        key={node.id}
        className={`absolute bg-white rounded-lg shadow-lg border-2 cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 shadow-xl' : 
          isConnectionSource ? 'border-blue-500 shadow-lg ring-2 ring-blue-300' :
          isConnectionTarget ? 'border-green-500 shadow-md animate-pulse' :
          isConnecting ? 'border-gray-300' :
          'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          left: node.position.x * zoom + pan.x,
          top: node.position.y * zoom + pan.y,
          width: 200 * zoom,
          transform: `scale(1)`,
          zIndex: 2
        }}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Node clicked:', node.id, 'isConnecting:', isConnecting, 'connectionStart:', connectionStart);
          
          if (isConnecting && connectionStart && connectionStart !== node.id) {
            console.log('Completing connection via click');
            completeConnection(node.id);
          } else {
            setSelectedNode(node);
          }
        }}
      >
        {/* Node Header */}
        <div className={`${nodeType.color} text-white p-2 rounded-t-lg flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <Icon size={16} />
            <span className="text-sm font-medium">{nodeType.label}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              className={`text-white hover:text-gray-200 p-1 transition-colors ${
                isConnecting && connectionStart === node.id 
                  ? 'text-green-300 animate-pulse ring-2 ring-green-300 rounded' 
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Starting connection from node:', node.id);
                // 添加视觉反馈：点击后按钮会显示为绿色并脉冲动画
                startConnection(node.id);
              }}
              title={isConnecting && connectionStart === node.id ? "Click on target node to complete connection" : "Create connection"}
            >
              <Link 
                size={12} 
                className={isConnecting && connectionStart === node.id ? 'animate-spin' : ''}
              />
            </button>
            <button
              className="text-white hover:text-gray-200 p-1"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              title="Delete node"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Node Content */}
        <div className="p-3">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {node.name}
          </div>
          {node.description && (
            <div className="text-xs text-gray-600 mb-2">
              {node.description}
            </div>
          )}
          
          {/* Node-specific content preview */}
          {node.type === 'message' && node.configuration.messageText && (
            <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
              "{node.configuration.messageText.substring(0, 50)}..."
            </div>
          )}
          
          {node.type === 'question' && node.configuration.questionText && (
            <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
              "{node.configuration.questionText.substring(0, 50)}..."
            </div>
          )}

          {node.connections.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              {node.connections.length} connection{node.connections.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Ensure SVG elements are visible and interactive in all environments */
        svg {
          overflow: visible !important;
        }
        
        svg path {
          pointer-events: auto !important;
        }
        
        svg text {
          pointer-events: auto !important;
          user-select: none;
        }
        
        svg circle {
          pointer-events: auto !important;
        }
      `}</style>

      {/* Node Palette */}
      {showNodePalette && (
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Node Types</h3>
            <button
              onClick={() => setShowNodePalette(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(NODE_TYPES).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => addNode(type as keyof typeof NODE_TYPES)}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className={`${config.color} text-white p-2 rounded`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {config.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      {config.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={flow.name}
              onChange={(e) => setFlow(prev => ({ ...prev, name: e.target.value }))}
              className="text-lg font-semibold bg-transparent border-none outline-none"
              placeholder="Flow Name"
            />
            <span className="text-sm text-gray-500">
              {flow.nodes.length} nodes
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNodePalette(!showNodePalette)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Plus size={16} className="inline mr-1" />
              Nodes
            </button>
            
            <button
              onClick={handleTest}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
            >
              <Play size={16} className="inline mr-1" />
              Test
            </button>
            
            <button
              onClick={handleSave}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
            >
              <Save size={16} className="inline mr-1" />
              Save
            </button>

            <button
              onClick={() => setShowProperties(!showProperties)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="flex-1 relative overflow-hidden"
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative'
          }}
        >
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-crosshair"
            style={{ 
              width: '100%', 
              height: '100%',
              position: 'relative'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`
              }}
            />

            {/* SVG for connections */}
            <svg
              ref={svgRef}
              className="absolute inset-0"
              style={{ 
                zIndex: 1,
                width: '100%',
                height: '100%',
                minWidth: '100%',
                minHeight: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                overflow: 'visible'
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6b7280"
                  />
                </marker>
              </defs>
              {renderConnections()}
            </svg>

            {/* Nodes */}
            <div 
              className="absolute inset-0" 
              style={{ 
                zIndex: 2,
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              {flow.nodes.map(renderNode)}
            </div>

            {/* Connection indicator */}
            {isConnecting && (
              <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-4 py-3 rounded-lg text-sm shadow-lg border border-blue-200 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="font-medium">Creating connection...</div>
                    <div className="text-blue-700">
                      {connectionStart 
                        ? `Click on target node to connect from "${flow.nodes.find(n => n.id === connectionStart)?.name || 'selected node'}"` 
                        : "Click on target node to complete"}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsConnecting(false);
                      setConnectionStart(null);
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-900 font-medium underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Connection success indicator */}
            {connectionSuccess && (
              <div className="absolute top-20 left-4 bg-green-100 text-green-800 px-4 py-3 rounded-lg text-sm shadow-lg border border-green-200 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Connection created!</div>
                    <div className="text-green-700">Successfully connected nodes</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {showProperties && selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          onClose={() => setShowProperties(false)}
        />
      )}
    </div>
  );
};

// ===== NODE PROPERTIES PANEL =====

interface NodePropertiesPanelProps {
  node: BotFlowNode;
  onUpdate: (updates: Partial<BotFlowNode>) => void;
  onClose: () => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  onUpdate,
  onClose
}) => {
  const updateConfiguration = (updates: Partial<BotFlowNodeConfiguration>) => {
    onUpdate({
      configuration: {
        ...node.configuration,
        ...updates
      }
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic Properties */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={node.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        </div>

        {/* Node-specific configuration */}
        {node.type === 'message' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Text
            </label>
            <textarea
              value={node.configuration.messageText || ''}
              onChange={(e) => updateConfiguration({ messageText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter the message to send..."
            />
          </div>
        )}

        {node.type === 'question' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <textarea
                value={node.configuration.questionText || ''}
                onChange={(e) => updateConfiguration({ questionText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter the question to ask..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variable Name
              </label>
              <input
                type="text"
                value={node.configuration.variableName || ''}
                onChange={(e) => updateConfiguration({ variableName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="variable_name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input Type
              </label>
              <select
                value={node.configuration.inputType || 'text'}
                onChange={(e) => updateConfiguration({ inputType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="choice">Multiple Choice</option>
                <option value="date">Date</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
            </div>

            {node.configuration.inputType === 'choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choices
                </label>
                <div className="space-y-2">
                  {(node.configuration.choices || []).map((choice, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={choice.label}
                        onChange={(e) => {
                          const newChoices = [...(node.configuration.choices || [])];
                          newChoices[index] = { ...choice, label: e.target.value, value: e.target.value };
                          updateConfiguration({ choices: newChoices });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Choice text"
                      />
                      <button
                        onClick={() => {
                          const newChoices = (node.configuration.choices || []).filter((_, i) => i !== index);
                          updateConfiguration({ choices: newChoices });
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newChoices = [...(node.configuration.choices || []), { value: '', label: '' }];
                      updateConfiguration({ choices: newChoices });
                    }}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Choice
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {node.type === 'action' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={node.configuration.actionType || ''}
                onChange={(e) => updateConfiguration({ actionType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select action...</option>
                <option value="create_transaction">Create Transaction</option>
                <option value="update_transaction">Update Transaction</option>
                <option value="send_notification">Send Notification</option>
                <option value="call_webhook">Call Webhook</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BotFlowBuilder;