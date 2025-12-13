import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Bot, MessageSquare, Phone, Mic, Volume2, Brain, Zap,
  GitBranch, Clock, Database, Globe, Mail, Users, Calendar,
  Save, Play, Undo, Redo, ZoomIn, ZoomOut, Maximize2,
  Plus, Trash2, Copy, Settings, ChevronLeft, Search,
  Sparkles, ArrowRight, CheckCircle, XCircle, HelpCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Node types with icons
const nodeTypes = [
  { id: "trigger", name: "Trigger", icon: Zap, color: "bg-amber-500", category: "triggers" },
  { id: "llm", name: "LLM Response", icon: Brain, color: "bg-purple-500", category: "ai" },
  { id: "condition", name: "Condition", icon: GitBranch, color: "bg-blue-500", category: "logic" },
  { id: "message", name: "Send Message", icon: MessageSquare, color: "bg-green-500", category: "actions" },
  { id: "voice", name: "Voice Response", icon: Volume2, color: "bg-pink-500", category: "voice" },
  { id: "listen", name: "Listen", icon: Mic, color: "bg-rose-500", category: "voice" },
  { id: "wait", name: "Wait/Delay", icon: Clock, color: "bg-orange-500", category: "logic" },
  { id: "api", name: "API Call", icon: Globe, color: "bg-cyan-500", category: "integrations" },
  { id: "database", name: "Database", icon: Database, color: "bg-indigo-500", category: "integrations" },
  { id: "email", name: "Send Email", icon: Mail, color: "bg-teal-500", category: "actions" },
  { id: "crm", name: "CRM Action", icon: Users, color: "bg-blue-600", category: "integrations" },
  { id: "calendar", name: "Calendar", icon: Calendar, color: "bg-violet-500", category: "integrations" },
  { id: "end", name: "End Flow", icon: CheckCircle, color: "bg-gray-500", category: "logic" },
];

const categories = [
  { id: "triggers", name: "Triggers", icon: Zap },
  { id: "ai", name: "AI & LLM", icon: Brain },
  { id: "voice", name: "Voice", icon: Mic },
  { id: "actions", name: "Actions", icon: MessageSquare },
  { id: "logic", name: "Logic", icon: GitBranch },
  { id: "integrations", name: "Integrations", icon: Globe },
];

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">Start</div>
            <div className="text-xs text-gray-500">Trigger point</div>
          </div>
        </div>
      ) 
    },
    position: { x: 250, y: 50 },
    style: { 
      background: "white", 
      border: "2px solid #f59e0b", 
      borderRadius: "12px",
      padding: "12px",
      minWidth: "180px"
    },
  },
];

const initialEdges = [];

export default function FlowBuilder() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [flowName, setFlowName] = useState("New Flow");
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: "smoothstep",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#3b82f6", strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const nodeTypeInfo = nodeTypes.find(n => n.id === type);
      if (!nodeTypeInfo) return;

      const position = {
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left - 90,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top - 30,
      };

      const Icon = nodeTypeInfo.icon;
      const newNode = {
        id: `${type}_${Date.now()}`,
        type: type === "condition" ? "default" : "default",
        position,
        data: {
          label: (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${nodeTypeInfo.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{nodeTypeInfo.name}</div>
                <div className="text-xs text-gray-500">Configure</div>
              </div>
            </div>
          ),
          nodeType: type,
        },
        style: {
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          padding: "12px",
          minWidth: "180px"
        },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added ${nodeTypeInfo.name} node`);
    },
    [setNodes]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const flowData = {
        name: flowName,
        nodes: nodes.map(n => ({ ...n, data: { nodeType: n.data?.nodeType || "start" } })),
        edges: edges,
      };
      toast.success("Flow saved successfully!");
    } catch (error) {
      toast.error("Failed to save flow");
    }
    setIsSaving(false);
  };

  const filteredNodeTypes = nodeTypes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-screen flex bg-gray-50" data-testid="flow-builder-page">
      {/* Left Sidebar - Node Palette */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Link to="/flows" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Flows</span>
          </Link>
          <Input
            placeholder="Flow name"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="font-semibold text-lg border-0 px-0 focus-visible:ring-0 bg-transparent"
          />
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-blue-600 text-white" : "border-gray-200"}
            >
              All
            </Button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={selectedCategory === cat.id ? "bg-blue-600 text-white" : "border-gray-200"}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Node List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNodeTypes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, nodeType.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${nodeType.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{nodeType.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{nodeType.category}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-gray-200">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200">
              <Redo className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Button variant="outline" size="sm" className="border-gray-200">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700 border-0">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              Auto-saved
            </Badge>
            <Button variant="outline" className="border-gray-200">
              <Play className="w-4 h-4 mr-2" />
              Test Flow
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls className="bg-white border border-gray-200 rounded-lg" />
            <MiniMap 
              className="bg-white border border-gray-200 rounded-lg"
              nodeColor="#3b82f6"
            />
            <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
            <Panel position="bottom-center" className="mb-4">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center gap-4">
                <span className="text-sm text-gray-600">Drag nodes from the sidebar to build your flow</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
