import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GitBranch, Plus, Search, MoreVertical, Play, Copy,
  Trash2, Edit3, Clock, CheckCircle, AlertCircle, Zap,
  Bot, ArrowRight, Workflow
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const mockFlows = [
  {
    id: "1",
    name: "Customer Support Flow",
    description: "Handle incoming customer inquiries with AI",
    status: "active",
    nodes_count: 8,
    agent: "Support Bot",
    last_run: "2 hours ago",
    runs: 156,
  },
  {
    id: "2",
    name: "Lead Qualification",
    description: "Qualify and route incoming leads",
    status: "active",
    nodes_count: 12,
    agent: "Sales Agent",
    last_run: "30 min ago",
    runs: 89,
  },
  {
    id: "3",
    name: "Appointment Booking",
    description: "Schedule appointments with calendar integration",
    status: "draft",
    nodes_count: 6,
    agent: null,
    last_run: null,
    runs: 0,
  },
];

export default function Flows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState(mockFlows);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: "",
    description: "",
    agent_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API}/agents`);
      setAgents(response.data);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const handleCreate = async () => {
    if (!newFlow.name.trim()) {
      toast.error("Please enter a flow name");
      return;
    }
    setLoading(true);
    
    const flow = {
      id: Date.now().toString(),
      ...newFlow,
      status: "draft",
      nodes_count: 0,
      runs: 0,
      last_run: null,
    };
    
    setFlows(prev => [...prev, flow]);
    toast.success("Flow created!");
    setShowCreateModal(false);
    setNewFlow({ name: "", description: "", agent_id: "" });
    setLoading(false);
    
    // Navigate after a short delay to ensure state updates complete
    setTimeout(() => {
      navigate(`/flows/${flow.id}/builder`);
    }, 100);
  };

  const handleDelete = (flowId) => {
    if (window.confirm("Are you sure you want to delete this flow?")) {
      setFlows(prev => prev.filter(f => f.id !== flowId));
      toast.success("Flow deleted");
    }
  };

  const handleDuplicate = (flow) => {
    const newFlowCopy = {
      ...flow,
      id: Date.now().toString(),
      name: `${flow.name} (Copy)`,
      status: "draft",
      runs: 0,
      last_run: null,
    };
    setFlows(prev => [...prev, newFlowCopy]);
    toast.success("Flow duplicated");
  };

  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (flow.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="flows-page">
      {/* Header */}
      <div className="content-header px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Flows</h1>
              <p className="text-gray-500 text-sm">Build and manage conversation flows with visual editor</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            data-testid="create-flow-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Flow
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {filteredFlows.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Workflow className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No flows found" : "Create your first flow"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Design conversation flows with our visual drag-and-drop builder"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flow
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlows.map((flow) => (
              <Card
                key={flow.id}
                className="glass-card card-hover group"
                data-testid={`flow-card-${flow.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <GitBranch className="w-6 h-6 text-indigo-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-gray-200">
                        <DropdownMenuItem asChild>
                          <Link to={`/flows/${flow.id}/builder`} className="flex items-center">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Flow
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(flow)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(flow.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {flow.description || "No description"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      <span>{flow.nodes_count} nodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{flow.runs} runs</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Badge
                      variant="outline"
                      className={
                        flow.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          flow.status === "active" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {flow.status}
                    </Badge>
                    {flow.last_run && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {flow.last_run}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link to={`/flows/${flow.id}/builder`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Create New Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Flow Name</Label>
              <Input
                placeholder="Customer Support Flow"
                value={newFlow.name}
                onChange={(e) => setNewFlow((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-gray-50 border-gray-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea
                placeholder="Describe what this flow does..."
                value={newFlow.description}
                onChange={(e) => setNewFlow((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-gray-50 border-gray-200 focus:border-blue-500 min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Assign to Agent (Optional)</Label>
              <Select
                value={newFlow.agent_id}
                onValueChange={(value) => setNewFlow((prev) => ({ ...prev, agent_id: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="none">No agent</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create & Open Editor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
