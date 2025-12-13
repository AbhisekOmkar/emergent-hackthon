import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, Plus, Search, Filter, MoreVertical, 
  Mic, MessageSquare, Play, Pause, Trash2, Settings, FlaskConical
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
import { useAgentStore } from "../stores/agentStore";
import CreateAgentModal from "../components/agents/CreateAgentModal";
import { toast } from "sonner";

export default function Agents() {
  const { agents, fetchAgents, deleteAgent, deployAgent } = useAgentStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || agent.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDeploy = async (agentId) => {
    const result = await deployAgent(agentId);
    if (result) {
      toast.success("Agent deployed successfully!");
    } else {
      toast.error("Failed to deploy agent");
    }
  };

  const handleDelete = async (agentId) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      const result = await deleteAgent(agentId);
      if (result) {
        toast.success("Agent deleted successfully!");
      } else {
        toast.error("Failed to delete agent");
      }
    }
  };

  const getAgentIcon = (type) => {
    switch (type) {
      case 'voice': return <Mic className="w-6 h-6 text-amber-400" />;
      case 'chat': return <MessageSquare className="w-6 h-6 text-blue-400" />;
      default: return <Bot className="w-6 h-6 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="agents-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit font-bold text-3xl text-white">Agents</h1>
          <p className="text-zinc-400 mt-1">Manage your AI agents</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold glow-amber-hover"
          data-testid="create-agent-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
            data-testid="search-agents"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "bg-amber-500 text-black" : "border-zinc-700"}
          >
            All
          </Button>
          <Button
            variant={filterType === "chat" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("chat")}
            className={filterType === "chat" ? "bg-blue-500 text-white" : "border-zinc-700"}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </Button>
          <Button
            variant={filterType === "voice" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("voice")}
            className={filterType === "voice" ? "bg-amber-500 text-black" : "border-zinc-700"}
          >
            <Mic className="w-3 h-3 mr-1" />
            Voice
          </Button>
          <Button
            variant={filterType === "multi-modal" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("multi-modal")}
            className={filterType === "multi-modal" ? "bg-purple-500 text-white" : "border-zinc-700"}
          >
            <Bot className="w-3 h-3 mr-1" />
            Multi-modal
          </Button>
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Bot className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No agents found</h3>
            <p className="text-zinc-400 mb-6">
              {searchQuery || filterType !== "all" 
                ? "Try adjusting your search or filters"
                : "Create your first AI agent to get started"}
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card 
              key={agent.id} 
              className="glass-card card-hover group"
              data-testid={`agent-card-${agent.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    {getAgentIcon(agent.type)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                      <DropdownMenuItem asChild>
                        <Link to={`/agents/${agent.id}/builder`} className="flex items-center">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Flow
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/agents/${agent.id}/test`} className="flex items-center">
                          <FlaskConical className="w-4 h-4 mr-2" />
                          Test Agent
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      {agent.status === 'active' ? (
                        <DropdownMenuItem onClick={() => {}} className="text-yellow-400">
                          <Pause className="w-4 h-4 mr-2" />
                          Pause Agent
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleDeploy(agent.id)} className="text-emerald-400">
                          <Play className="w-4 h-4 mr-2" />
                          Deploy Agent
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-outfit font-semibold text-lg text-white">{agent.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={
                        agent.type === 'voice' ? 'badge-voice' :
                        agent.type === 'chat' ? 'badge-chat' : 'badge-multimodal'
                      }
                    >
                      {agent.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {agent.description || 'No description provided'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <Badge 
                    variant="outline"
                    className={
                      agent.status === 'active' ? 'status-active' :
                      agent.status === 'paused' ? 'status-paused' : 'status-draft'
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      agent.status === 'active' ? 'bg-emerald-400' :
                      agent.status === 'paused' ? 'bg-yellow-400' : 'bg-zinc-400'
                    }`} />
                    {agent.status}
                  </Badge>
                  <div className="text-xs text-zinc-500">
                    {agent.calls_count || 0} calls • {(agent.success_rate || 0).toFixed(0)}% success
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link to={`/agents/${agent.id}/builder`} className="flex-1">
                    <Button variant="outline" className="w-full border-zinc-700 hover:border-amber-500/50">
                      Edit Flow
                    </Button>
                  </Link>
                  <Link to={`/agents/${agent.id}/test`}>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                      Test
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      <CreateAgentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
