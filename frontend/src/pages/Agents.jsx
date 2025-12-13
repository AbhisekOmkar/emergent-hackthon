import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, Plus, Search, MoreVertical, 
  Mic, MessageSquare, Play, Pause, Trash2, Settings, FlaskConical, RefreshCw, Cloud, Eraser
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
  const { agents, fetchAgents, deleteAgent, deployAgent, syncing, cleanupDeletedAgents } = useAgentStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info("Syncing agents from cloud...");
    await fetchAgents(true); // Force sync with cloud
    toast.success("Agents synced successfully!");
    setRefreshing(false);
  };

  const handleCleanup = async () => {
    setCleaning(true);
    toast.info("Cleaning up deleted agents...");
    const result = await cleanupDeletedAgents();
    if (result) {
      toast.success(`Removed ${result.deleted_count} old/deleted agents`);
      await fetchAgents(false); // Refresh the list without syncing
    } else {
      toast.error("Failed to cleanup agents");
    }
    setCleaning(false);
  };

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
      case 'voice': return <Mic className="w-6 h-6 text-purple-600" />;
      case 'chat': return <MessageSquare className="w-6 h-6 text-blue-600" />;
      default: return <Bot className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getAgentIconBg = (type) => {
    switch (type) {
      case 'voice': return 'bg-purple-100';
      case 'chat': return 'bg-blue-100';
      default: return 'bg-indigo-100';
    }
  };

  return (
    <div data-testid="agents-page" className="min-h-screen">
      {/* Header with gradient */}
      <div className="content-header px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Agents</h1>
              <p className="text-gray-600 text-sm">Design, deploy, and manage intelligent voice and chat agents</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleCleanup}
                variant="outline"
                disabled={cleaning || syncing}
                className="border-gray-200 hover:bg-gray-50 h-11 rounded-lg"
                title="Remove deleted/old agents"
              >
                <Eraser className={`w-4 h-4 mr-2 ${cleaning ? 'animate-pulse' : ''}`} />
                {cleaning ? 'Cleaning...' : 'Cleanup'}
              </Button>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing || syncing}
                className="border-gray-200 hover:bg-gray-50 h-11 rounded-lg"
                title="Sync agents from cloud"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing || syncing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Sync Agents'}
              </Button>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm"
                data-testid="create-agent-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 h-10 rounded-lg shadow-sm"
                data-testid="search-agents"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={filterType === "all" ? "bg-blue-600 text-white border-0 h-10 rounded-lg font-medium" : "bg-white border-gray-200 h-10 rounded-lg hover:bg-gray-50"}
              >
                All
              </Button>
              <Button
                variant={filterType === "chat" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("chat")}
                className={filterType === "chat" ? "bg-blue-600 text-white border-0 h-10 rounded-lg font-medium" : "bg-white border-gray-200 h-10 rounded-lg hover:bg-gray-50"}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Chat
              </Button>
              <Button
                variant={filterType === "voice" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("voice")}
                className={filterType === "voice" ? "bg-purple-600 text-white border-0 h-10 rounded-lg font-medium" : "bg-white border-gray-200 h-10 rounded-lg hover:bg-gray-50"}
              >
                <Mic className="w-3.5 h-3.5 mr-1.5" />
                Voice
              </Button>
              <Button
                variant={filterType === "multi-modal" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("multi-modal")}
                className={filterType === "multi-modal" ? "bg-indigo-600 text-white border-0 h-10 rounded-lg font-medium" : "bg-white border-gray-200 h-10 rounded-lg hover:bg-gray-50"}
              >
                <Bot className="w-3.5 h-3.5 mr-1.5" />
                Multi-modal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-20 text-center">
              {!searchQuery && filterType === "all" ? (
                <div className="fade-in">
                  <div className="max-w-sm mx-auto mb-8">
                    {/* Empty State Illustration */}
                    <div className="relative mx-auto w-48 h-48">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50"></div>
                      <div className="absolute inset-4 bg-white rounded-full shadow-inner flex items-center justify-center">
                        <div className="relative">
                          <Bot className="w-16 h-16 text-blue-200" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                      <Cloud className="absolute top-2 right-8 w-6 h-6 text-blue-300 animate-pulse" />
                      <Mic className="absolute bottom-4 left-4 w-5 h-5 text-purple-300" />
                      <MessageSquare className="absolute top-8 left-2 w-5 h-5 text-blue-300" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    No agents yet
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Get started by creating your first AI agent or sync existing agents from the cloud.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button 
                      onClick={handleRefresh}
                      variant="outline"
                      disabled={refreshing}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Sync Agents
                    </Button>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Agent
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="fade-in">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No agents found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                    variant="outline"
                    className="border-gray-200 hover:bg-gray-50 rounded-lg"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent, idx) => (
              <Card 
                key={agent.id} 
                className="glass-card card-hover group slide-in"
                style={{ animationDelay: `${idx * 50}ms` }}
                data-testid={`agent-card-${agent.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${getAgentIconBg(agent.type)} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {getAgentIcon(agent.type)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-gray-200">
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/settings`} className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/test`} className="flex items-center">
                            <FlaskConical className="w-4 h-4 mr-2" />
                            Test Agent
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100" />
                        {agent.status === 'active' ? (
                          <DropdownMenuItem onClick={() => {}} className="text-yellow-600">
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Agent
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleDeploy(agent.id)} className="text-green-600">
                            <Play className="w-4 h-4 mr-2" />
                            Deploy Agent
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-gray-100" />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(agent.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={
                          agent.type === 'voice' ? 'badge-voice' :
                          agent.type === 'chat' ? 'badge-chat' : 'badge-multimodal'
                        }
                      >
                        {agent.type}
                      </Badge>
                      {agent.retell_agent_id && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <Cloud className="w-3 h-3 mr-1" />
                          Cloud
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {agent.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Badge 
                      variant="outline"
                      className={
                        agent.status === 'active' ? 'status-active' :
                        agent.status === 'paused' ? 'status-paused' : 'status-draft'
                      }
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        agent.status === 'active' ? 'bg-green-500' :
                        agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      {agent.status}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {agent.calls_count || 0} calls • {(agent.success_rate || 0).toFixed(0)}% success
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link to={`/agents/${agent.id}/settings`} className="flex-1">
                      <Button variant="outline" className="w-full border-gray-200 hover:border-blue-300 hover:bg-blue-50">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </Link>
                    <Link to={`/agents/${agent.id}/test`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Test
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
