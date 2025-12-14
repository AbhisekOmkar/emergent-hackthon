import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GitBranch, Plus, Search, MoreVertical, Play, Copy,
  Trash2, Edit3, Clock, CheckCircle, AlertCircle, Zap,
  Bot, ArrowRight, Workflow, RefreshCw, Brain, Sparkles, Crown
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { useSubscription } from "../context/SubscriptionContext";
import { FeatureGate, PremiumBadge } from "../components/UpgradePrompt";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function FlowsContent() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [newFlow, setNewFlow] = useState({
    name: "",
    description: "",
    model: "gpt-4.1",
    start_speaker: "agent",
    global_prompt: "",
  });

  useEffect(() => {
    fetchFlows();
    fetchModels();
  }, []);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/retell/conversation-flows`);
      setFlows(response.data || []);
    } catch (error) {
      console.error("Failed to fetch flows:", error);
      // Show empty state instead of error for new users
      setFlows([]);
    }
    setLoading(false);
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API}/retell/conversation-flow-models`);
      setAvailableModels(response.data || []);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      // Default models if API fails
      setAvailableModels([
        { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI" },
        { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI" },
        { id: "claude-4.5-sonnet", name: "Claude 4.5 Sonnet", provider: "Anthropic" },
      ]);
    }
  };

  const handleCreate = async () => {
    if (!newFlow.name.trim()) {
      toast.error("Please enter a flow name");
      return;
    }
    
    setCreating(true);
    try {
      // Create initial flow with a start node
      const initialNodes = [
        {
          id: "start",
          type: "conversation",
          name: "Start",
          instruction: {
            type: "prompt",
            text: newFlow.global_prompt || "Greet the customer and ask how you can help them today."
          },
          display_position: { x: 250, y: 100 },
          edges: []
        }
      ];

      const response = await axios.post(`${API}/retell/conversation-flows`, {
        name: newFlow.name,
        description: newFlow.description,
        model_choice: {
          type: "cascading",
          model: newFlow.model
        },
        start_speaker: newFlow.start_speaker,
        nodes: initialNodes,
        global_prompt: newFlow.global_prompt,
        start_node_id: "start",
        begin_tag_display_position: { x: 100, y: 100 }
      });

      toast.success("Conversation flow created!");
      setShowCreateModal(false);
      setNewFlow({ name: "", description: "", model: "gpt-4.1", start_speaker: "agent", global_prompt: "" });
      
      // Navigate to builder with the new flow
      const flowId = response.data.flow_id || response.data.retell_flow_id;
      navigate(`/flows/${flowId}/builder`);
      
    } catch (error) {
      console.error("Failed to create flow:", error);
      toast.error(error.response?.data?.detail || "Failed to create conversation flow");
    }
    setCreating(false);
  };

  const handleDelete = async (flowId, retellFlowId) => {
    if (!window.confirm("Are you sure you want to delete this conversation flow? This cannot be undone.")) {
      return;
    }
    
    try {
      await axios.delete(`${API}/retell/conversation-flows/${flowId}`);
      toast.success("Flow deleted successfully");
      fetchFlows();
    } catch (error) {
      console.error("Failed to delete flow:", error);
      toast.error("Failed to delete flow");
    }
  };

  const handleDuplicate = async (flow) => {
    try {
      // Get full flow data
      const response = await axios.get(`${API}/retell/conversation-flows/${flow.id}`);
      const fullFlow = response.data;
      
      // Create new flow with copied data
      await axios.post(`${API}/retell/conversation-flows`, {
        name: `${flow.name} (Copy)`,
        description: flow.description,
        model_choice: fullFlow.model_choice || { type: "cascading", model: "gpt-4.1" },
        start_speaker: fullFlow.start_speaker || "agent",
        nodes: fullFlow.nodes || [],
        global_prompt: fullFlow.global_prompt,
        start_node_id: fullFlow.start_node_id,
        tools: fullFlow.tools,
        knowledge_base_ids: fullFlow.knowledge_base_ids,
      });
      
      toast.success("Flow duplicated!");
      fetchFlows();
    } catch (error) {
      console.error("Failed to duplicate flow:", error);
      toast.error("Failed to duplicate flow");
    }
  };

  const filteredFlows = flows.filter(flow =>
    flow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (flow.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
      case "draft":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  const getModelBadge = (model) => {
    const modelInfo = availableModels.find(m => m.id === model);
    const colors = {
      "OpenAI": "bg-emerald-100 text-emerald-700",
      "Anthropic": "bg-orange-100 text-orange-700",
      "Google": "bg-blue-100 text-blue-700"
    };
    return (
      <Badge className={`${colors[modelInfo?.provider] || "bg-gray-100 text-gray-700"} text-xs`}>
        {modelInfo?.name || model}
      </Badge>
    );
  };

  return (
    <div data-testid="flows-page" className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Conversation Flows</h1>
              <p className="text-gray-600 text-sm">Build visual conversation flows for your voice agents</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchFlows}
                disabled={loading}
                className="border-gray-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm"
                data-testid="create-flow-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Flow
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 h-10 rounded-lg shadow-sm"
              data-testid="search-flows"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-gray-500">Loading conversation flows...</span>
          </div>
        ) : filteredFlows.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Workflow className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No flows found" : "Create your first conversation flow"}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Design intelligent conversation flows with nodes, conditions, and transitions. Connect them to your voice agents for powerful automated interactions."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Flow
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlows.map((flow) => (
              <Card 
                key={flow.id} 
                className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate(`/flows/${flow.id}/builder`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <GitBranch className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {flow.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {flow.nodes_count || 0} nodes
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-gray-200">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/flows/${flow.id}/builder`); }}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Flow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(flow); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); handleDelete(flow.id, flow.retell_flow_id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                    {flow.description || "No description"}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(flow.status)}
                    {flow.model && getModelBadge(flow.model)}
                    {flow.start_speaker && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">
                        {flow.start_speaker === "agent" ? "Agent starts" : "User starts"}
                      </Badge>
                    )}
                  </div>

                  {flow.version && (
                    <p className="text-xs text-gray-400 mt-3">
                      Version {flow.version}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Flow Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Create Conversation Flow</DialogTitle>
            <DialogDescription className="text-gray-500">
              Create a new conversation flow to define how your voice agent interacts with callers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Flow Name *</Label>
              <Input
                placeholder="e.g., Customer Support Flow"
                value={newFlow.name}
                onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                className="bg-white border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Description</Label>
              <Textarea
                placeholder="Describe what this flow does..."
                value={newFlow.description}
                onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                className="bg-white border-gray-200 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">LLM Model</Label>
                <Select
                  value={newFlow.model}
                  onValueChange={(value) => setNewFlow({ ...newFlow, model: value })}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {availableModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-gray-400" />
                          {model.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Who Starts</Label>
                <Select
                  value={newFlow.start_speaker}
                  onValueChange={(value) => setNewFlow({ ...newFlow, start_speaker: value })}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="agent">Agent speaks first</SelectItem>
                    <SelectItem value="user">Wait for user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Global Prompt (Optional)</Label>
              <Textarea
                placeholder="Instructions that apply to all conversation nodes..."
                value={newFlow.global_prompt}
                onChange={(e) => setNewFlow({ ...newFlow, global_prompt: e.target.value })}
                className="bg-white border-gray-200 min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                This prompt will be applied to every conversation node in the flow.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newFlow.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Flow
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
