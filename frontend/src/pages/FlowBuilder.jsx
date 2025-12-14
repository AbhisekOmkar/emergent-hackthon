import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Bot, MessageSquare, Phone, Mic, Volume2, Brain, Zap,
  GitBranch, Clock, Database, Globe, Mail, Users, Calendar,
  Save, Play, Undo, Redo, ZoomIn, ZoomOut, Maximize2,
  Plus, Trash2, Copy, Settings, ChevronLeft, Search,
  Sparkles, ArrowRight, CheckCircle, XCircle, HelpCircle,
  RefreshCw, X, PhoneOff, UserCheck, AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../components/ui/sheet";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Retell Conversation Flow Node Types
const retellNodeTypes = [
  { 
    id: "conversation", 
    name: "Conversation", 
    icon: MessageSquare, 
    color: "bg-indigo-500",
    description: "Agent speaks and listens to user"
  },
  { 
    id: "function", 
    name: "Function Call", 
    icon: Globe, 
    color: "bg-cyan-500",
    description: "Call external API or tool"
  },
  { 
    id: "logic", 
    name: "Logic Branch", 
    icon: GitBranch, 
    color: "bg-amber-500",
    description: "Branch based on conditions"
  },
  { 
    id: "transfer_call", 
    name: "Transfer Call", 
    icon: Phone, 
    color: "bg-blue-500",
    description: "Transfer to another number"
  },
  { 
    id: "end_call", 
    name: "End Call", 
    icon: PhoneOff, 
    color: "bg-red-500",
    description: "End the conversation"
  },
  { 
    id: "press_digit", 
    name: "Press Digit", 
    icon: Phone, 
    color: "bg-purple-500",
    description: "Press DTMF digit"
  },
];

// Custom Node Component for Retell Flow
const ConversationNode = ({ data, selected }) => {
  const nodeType = retellNodeTypes.find(n => n.id === data.retellType) || retellNodeTypes[0];
  const Icon = nodeType.icon;
  
  return (
    <div className={`relative bg-white rounded-xl border-2 transition-all min-w-[220px] ${
      selected ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-lg ${nodeType.color} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{data.name || nodeType.name}</div>
            <div className="text-xs text-gray-500">{nodeType.name}</div>
          </div>
        </div>
        
        {data.instruction?.text && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-2 line-clamp-2">
            {data.instruction.text}
          </div>
        )}
        
        {data.edges && data.edges.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{data.edges.length} transition(s)</span>
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
    </div>
  );
};

// Start Node Component
const StartNode = ({ data, selected }) => {
  return (
    <div className={`relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl border-2 transition-all min-w-[180px] ${
      selected ? 'border-emerald-300 shadow-lg' : 'border-transparent'
    }`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-white">Start</div>
            <div className="text-xs text-white/70">Flow begins here</div>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-white !w-3 !h-3" />
    </div>
  );
};

const nodeTypes = {
  conversationNode: ConversationNode,
  startNode: StartNode,
};

export default function FlowBuilder() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [flowData, setFlowData] = useState(null);
  const [flowName, setFlowName] = useState("New Flow");
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  // Load flow data
  useEffect(() => {
    if (flowId) {
      loadFlow();
    } else {
      // New flow - set defaults
      setIsLoading(false);
      const startNode = {
        id: "start",
        type: "startNode",
        position: { x: 250, y: 50 },
        data: { name: "Start", retellType: "start" },
      };
      setNodes([startNode]);
    }
  }, [flowId]);

  const loadFlow = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/retell/conversation-flows/${flowId}`);
      const flow = response.data;
      
      setFlowData(flow);
      setFlowName(flow.name || "Untitled Flow");
      setGlobalPrompt(flow.global_prompt || "");
      
      // Convert Retell nodes to React Flow nodes
      const reactFlowNodes = [];
      const reactFlowEdges = [];
      
      // Add start indicator
      const startNodeId = flow.start_node_id || (flow.nodes && flow.nodes[0]?.id);
      
      // Process nodes
      if (flow.nodes && flow.nodes.length > 0) {
        flow.nodes.forEach((node, index) => {
          const position = node.display_position || { x: 250, y: 100 + index * 150 };
          
          reactFlowNodes.push({
            id: node.id,
            type: "conversationNode",
            position: { x: position.x, y: position.y },
            data: {
              name: node.name || node.id,
              retellType: node.type,
              instruction: node.instruction,
              edges: node.edges || [],
              nodeData: node,
            },
          });
          
          // Convert edges to React Flow format
          if (node.edges) {
            node.edges.forEach((edge, edgeIndex) => {
              if (edge.destination_node_id) {
                reactFlowEdges.push({
                  id: `${node.id}-${edge.destination_node_id}-${edgeIndex}`,
                  source: node.id,
                  target: edge.destination_node_id,
                  type: "smoothstep",
                  animated: true,
                  markerEnd: { type: MarkerType.ArrowClosed },
                  style: { stroke: "#6366f1", strokeWidth: 2 },
                  label: edge.transition_condition?.prompt?.substring(0, 30) || "",
                  labelStyle: { fontSize: 10, fill: "#6b7280" },
                });
              }
            });
          }
        });
      }
      
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      
    } catch (error) {
      console.error("Failed to load flow:", error);
      toast.error("Failed to load conversation flow");
    }
    setIsLoading(false);
  };

  const onConnect = useCallback(
    (params) => {
      // Create new edge
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#6366f1", strokeWidth: 2 },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Update source node's edges
      setNodes((nds) => nds.map((node) => {
        if (node.id === params.source) {
          const currentEdges = node.data.edges || [];
          return {
            ...node,
            data: {
              ...node.data,
              edges: [
                ...currentEdges,
                {
                  id: `edge_${Date.now()}`,
                  destination_node_id: params.target,
                  transition_condition: {
                    type: "prompt",
                    prompt: "Continue to next step"
                  }
                }
              ]
            }
          };
        }
        return node;
      }));
      
      toast.success("Transition created");
    },
    [setEdges, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/retellflow");
      if (!type) return;

      const nodeTypeInfo = retellNodeTypes.find(n => n.id === type);
      if (!nodeTypeInfo) return;

      const position = reactFlowWrapper.current.getBoundingClientRect();
      const newPosition = {
        x: event.clientX - position.left - 110,
        y: event.clientY - position.top - 50,
      };

      const newNodeId = `${type}_${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: "conversationNode",
        position: newPosition,
        data: {
          name: nodeTypeInfo.name,
          retellType: type,
          instruction: type === "conversation" ? {
            type: "prompt",
            text: "Enter your conversation prompt here..."
          } : null,
          edges: [],
          nodeData: {
            id: newNodeId,
            type: type,
            instruction: type === "conversation" ? {
              type: "prompt",
              text: "Enter your conversation prompt here..."
            } : null,
            display_position: newPosition,
          }
        },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added ${nodeTypeInfo.name} node`);
    },
    [setNodes]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/retellflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setEditingNode({
      ...node.data,
      id: node.id,
    });
    setShowNodeEditor(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert React Flow nodes back to Retell format
      const retellNodes = nodes.map(node => ({
        id: node.id,
        type: node.data.retellType || "conversation",
        name: node.data.name,
        instruction: node.data.instruction,
        edges: node.data.edges || [],
        display_position: { x: node.position.x, y: node.position.y },
      }));

      const startNodeId = nodes[0]?.id || "start";

      if (flowId && flowData?.retell_flow_id) {
        // Update existing flow
        await axios.put(`${API}/retell/conversation-flows/${flowId}`, {
          name: flowName,
          nodes: retellNodes,
          global_prompt: globalPrompt,
          start_node_id: startNodeId,
        });
        toast.success("Flow saved successfully!");
      } else {
        // Create new flow
        const response = await axios.post(`${API}/retell/conversation-flows`, {
          name: flowName,
          model_choice: { type: "cascading", model: "gpt-4.1" },
          start_speaker: "agent",
          nodes: retellNodes,
          global_prompt: globalPrompt,
          start_node_id: startNodeId,
        });
        toast.success("Flow created successfully!");
        navigate(`/flows/${response.data.flow_id}/builder`, { replace: true });
      }
    } catch (error) {
      console.error("Failed to save flow:", error);
      toast.error(error.response?.data?.detail || "Failed to save flow");
    }
    setIsSaving(false);
  };

  const handleUpdateNode = () => {
    if (!editingNode) return;
    
    setNodes((nds) => nds.map((node) => {
      if (node.id === editingNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            name: editingNode.name,
            instruction: editingNode.instruction,
            edges: editingNode.edges,
          }
        };
      }
      return node;
    }));
    
    setShowNodeEditor(false);
    toast.success("Node updated");
  };

  const handleDeleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setShowNodeEditor(false);
    toast.success("Node deleted");
  };

  const filteredNodeTypes = retellNodeTypes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600">Loading conversation flow...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50" data-testid="flow-builder-page">
      {/* Left Sidebar - Node Palette */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <Link to="/flows" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Flows</span>
          </Link>
          <Input
            placeholder="Flow name"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="bg-gray-50 border-gray-200 font-semibold text-gray-900"
          />
        </div>

        {/* Node Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Node Types */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Node Types
          </h3>
          <div className="space-y-2">
            {filteredNodeTypes.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <div
                  key={nodeType.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, nodeType.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-grab hover:border-indigo-300 hover:shadow-sm transition-all active:cursor-grabbing"
                >
                  <div className={`w-9 h-9 rounded-lg ${nodeType.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{nodeType.name}</div>
                    <div className="text-xs text-gray-500 truncate">{nodeType.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Prompt */}
        <div className="p-4 border-t border-gray-100">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Global Prompt
          </Label>
          <Textarea
            placeholder="Instructions for all nodes..."
            value={globalPrompt}
            onChange={(e) => setGlobalPrompt(e.target.value)}
            className="mt-2 bg-gray-50 border-gray-200 text-sm min-h-[80px]"
          />
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {nodes.length} nodes
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
              {edges.length} transitions
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFlow}
              disabled={isLoading}
              className="border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Flow
                </>
              )}
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
          >
            <Controls className="!bg-white !border-gray-200 !shadow-lg" />
            <MiniMap 
              className="!bg-white !border-gray-200 !shadow-lg"
              nodeColor={(node) => {
                const nodeType = retellNodeTypes.find(n => n.id === node.data?.retellType);
                return nodeType ? nodeType.color.replace("bg-", "#").replace("-500", "") : "#6366f1";
              }}
            />
            <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
            
            <Panel position="bottom-center" className="mb-4">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center gap-3">
                <span className="text-sm text-gray-500">Drag nodes from the sidebar to add them to your flow</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Editor Sheet */}
      <Sheet open={showNodeEditor} onOpenChange={setShowNodeEditor}>
        <SheetContent className="w-[400px] bg-white border-l border-gray-200">
          <SheetHeader>
            <SheetTitle className="text-gray-900">Edit Node</SheetTitle>
            <SheetDescription className="text-gray-500">
              Configure the node properties and transitions
            </SheetDescription>
          </SheetHeader>
          
          {editingNode && (
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Node Name</Label>
                <Input
                  value={editingNode.name || ""}
                  onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  className="bg-white border-gray-200"
                />
              </div>

              {editingNode.retellType === "conversation" && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Instruction Prompt</Label>
                  <Textarea
                    value={editingNode.instruction?.text || ""}
                    onChange={(e) => setEditingNode({
                      ...editingNode,
                      instruction: { type: "prompt", text: e.target.value }
                    })}
                    className="bg-white border-gray-200 min-h-[150px]"
                    placeholder="What should the agent say or do at this step?"
                  />
                </div>
              )}

              {/* Transitions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700">Transitions</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newEdge = {
                        id: `edge_${Date.now()}`,
                        destination_node_id: "",
                        transition_condition: { type: "prompt", prompt: "" }
                      };
                      setEditingNode({
                        ...editingNode,
                        edges: [...(editingNode.edges || []), newEdge]
                      });
                    }}
                    className="border-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {editingNode.edges?.map((edge, index) => (
                  <div key={edge.id || index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Transition {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNode({
                            ...editingNode,
                            edges: editingNode.edges.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Condition: e.g., 'User wants to book an appointment'"
                      value={edge.transition_condition?.prompt || ""}
                      onChange={(e) => {
                        const newEdges = [...editingNode.edges];
                        newEdges[index] = {
                          ...edge,
                          transition_condition: { type: "prompt", prompt: e.target.value }
                        };
                        setEditingNode({ ...editingNode, edges: newEdges });
                      }}
                      className="bg-white border-gray-200 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteNode(editingNode.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={handleUpdateNode}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
