import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  Save, Play, ArrowLeft, Plus, MessageSquare, 
  GitBranch, Phone, Zap, Bot, Settings, Code
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAgentStore } from "../stores/agentStore";
import { toast } from "sonner";

// Custom node types
const nodeTypes = {
  start: StartNode,
  llm: LLMNode,
  condition: ConditionNode,
  action: ActionNode,
  end: EndNode,
};

function StartNode({ data }) {
  return (
    <div className="flow-node bg-emerald-500/20 border-emerald-500/50 min-w-[160px]">
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-white">Start</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1">{data.label || "Entry point"}</p>
    </div>
  );
}

function LLMNode({ data }) {
  return (
    <div className="flow-node bg-blue-600/20 border-blue-600/50 min-w-[180px]">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-white">LLM Response</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1">{data.label || "Generate AI response"}</p>
    </div>
  );
}

function ConditionNode({ data }) {
  return (
    <div className="flow-node bg-blue-500/20 border-blue-500/50 min-w-[160px]">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-white">Condition</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1">{data.label || "If/else branch"}</p>
    </div>
  );
}

function ActionNode({ data }) {
  return (
    <div className="flow-node bg-purple-500/20 border-purple-500/50 min-w-[160px]">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-white">Action</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1">{data.label || "Execute action"}</p>
    </div>
  );
}

function EndNode({ data }) {
  return (
    <div className="flow-node bg-red-500/20 border-red-500/50 min-w-[160px]">
      <div className="flex items-center gap-2">
        <Phone className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-white">End</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1">{data.label || "End conversation"}</p>
    </div>
  );
}

const initialNodes = [
  {
    id: "start-1",
    type: "start",
    position: { x: 250, y: 50 },
    data: { label: "Incoming call/message" },
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 250, y: 150 },
    data: { label: "Greet user" },
  },
  {
    id: "condition-1",
    type: "condition",
    position: { x: 250, y: 270 },
    data: { label: "Check intent" },
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 100, y: 400 },
    data: { label: "Book appointment" },
  },
  {
    id: "llm-2",
    type: "llm",
    position: { x: 400, y: 400 },
    data: { label: "Answer question" },
  },
  {
    id: "end-1",
    type: "end",
    position: { x: 250, y: 520 },
    data: { label: "End call" },
  },
];

const initialEdges = [
  { id: "e1-2", source: "start-1", target: "llm-1", animated: true },
  { id: "e2-3", source: "llm-1", target: "condition-1" },
  { id: "e3-4", source: "condition-1", target: "action-1", label: "booking" },
  { id: "e3-5", source: "condition-1", target: "llm-2", label: "question" },
  { id: "e4-6", source: "action-1", target: "end-1" },
  { id: "e5-6", source: "llm-2", target: "end-1" },
];

const nodeCategories = [
  { type: "start", label: "Start", icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { type: "llm", label: "LLM Response", icon: Bot, color: "text-blue-500", bg: "bg-blue-600/20" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "text-blue-400", bg: "bg-blue-500/20" },
  { type: "action", label: "Action", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/20" },
  { type: "end", label: "End Call", icon: Phone, color: "text-red-400", bg: "bg-red-500/20" },
];

function FlowCanvas() {
  const { agentId } = useParams();
  const { currentAgent, fetchAgent } = useAgentStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId, fetchAgent]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
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

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleSave = () => {
    toast.success("Flow saved successfully!");
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full relative" data-testid="agent-builder">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-[#09090b] to-transparent">
        <div className="flex items-center gap-4">
          <Link to="/agents">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-semibold text-xl text-white">
                {currentAgent?.name || "Agent Builder"}
              </h1>
              {currentAgent && (
                <Badge 
                  variant="outline"
                  className={
                    currentAgent.type === 'voice' ? 'badge-voice' :
                    currentAgent.type === 'chat' ? 'badge-chat' : 'badge-multimodal'
                  }
                >
                  {currentAgent.type}
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-400">Edit conversation flow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/agents/${agentId}/settings`}>
            <Button variant="outline" className="border-zinc-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Link to={`/agents/${agentId}/test`}>
            <Button variant="outline" className="border-zinc-700">
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          </Link>
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Flow
          </Button>
        </div>
      </div>

      {/* Node Palette */}
      <div className="absolute left-4 top-20 bottom-4 w-64 z-10">
        <Card className="glass-panel h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-900">Node Palette</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nodeCategories.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  className={`flex items-center gap-3 p-3 rounded-lg ${node.bg} border border-transparent hover:border-zinc-200 cursor-grab transition-colors`}
                >
                  <Icon className={`w-4 h-4 ${node.color}`} />
                  <span className="text-sm text-zinc-900">{node.label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#0B0F14]"
      >
        <Background variant="dots" gap={20} size={1} color="rgba(255,255,255,0.1)" />
        <Controls className="bg-zinc-900 border-zinc-800 rounded-lg" />
        <MiniMap 
          className="bg-zinc-900 border-zinc-800 rounded-lg"
          nodeColor={(n) => {
            if (n.type === "start") return "#10b981";
            if (n.type === "llm") return "#f59e0b";
            if (n.type === "condition") return "#3b82f6";
            if (n.type === "action") return "#a855f7";
            return "#ef4444";
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function AgentBuilder() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
