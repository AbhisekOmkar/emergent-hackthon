import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, Phone, MessageSquare, TrendingUp, Clock, 
  CheckCircle, AlertCircle, Plus, ArrowRight, Mic
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAgentStore, useAnalyticsStore } from "../stores/agentStore";
import CreateAgentModal from "../components/agents/CreateAgentModal";

export default function Dashboard() {
  const { agents, fetchAgents } = useAgentStore();
  const { analytics, fetchAnalytics } = useAnalyticsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchAnalytics();
  }, [fetchAgents, fetchAnalytics]);

  const stats = [
    {
      title: "Total Agents",
      value: agents.length,
      icon: Bot,
      change: "+2 this week",
      color: "text-amber-400",
    },
    {
      title: "Total Calls",
      value: analytics?.total_calls || 0,
      icon: Phone,
      change: "This month",
      color: "text-emerald-400",
    },
    {
      title: "Success Rate",
      value: `${(analytics?.success_rate || 0).toFixed(1)}%`,
      icon: CheckCircle,
      change: "+5.2% vs last week",
      color: "text-blue-400",
    },
    {
      title: "Avg Duration",
      value: `${Math.round(analytics?.average_duration || 0)}s`,
      icon: Clock,
      change: "Per conversation",
      color: "text-purple-400",
    },
  ];

  const recentAgents = agents.slice(0, 4);

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit font-bold text-3xl text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back! Here's your agent overview.</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="glass-card stat-card"
              data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">{stat.title}</p>
                    <p className="text-3xl font-outfit font-bold text-white mt-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-zinc-800/50 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Agents */}
        <Card className="glass-card lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-outfit text-xl text-white">Your Agents</CardTitle>
            <Link to="/agents">
              <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAgents.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">No agents yet. Create your first agent!</p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}/builder`}
                    className="block"
                    data-testid={`agent-card-${agent.id}`}
                  >
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-amber-500/30">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        {agent.type === 'voice' ? (
                          <Mic className="w-6 h-6 text-amber-400" />
                        ) : agent.type === 'chat' ? (
                          <MessageSquare className="w-6 h-6 text-blue-400" />
                        ) : (
                          <Bot className="w-6 h-6 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{agent.name}</h3>
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
                        <p className="text-sm text-zinc-400 mt-0.5">{agent.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline"
                          className={
                            agent.status === 'active' ? 'status-active' :
                            agent.status === 'paused' ? 'status-paused' : 'status-draft'
                          }
                        >
                          {agent.status}
                        </Badge>
                        <p className="text-xs text-zinc-500 mt-1">
                          {agent.calls_count || 0} calls
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-outfit text-xl text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start bg-zinc-800/30 border-zinc-700 hover:border-amber-500/50 hover:bg-amber-500/10"
              onClick={() => setShowCreateModal(true)}
            >
              <Bot className="w-4 h-4 mr-3 text-amber-400" />
              Create Voice Agent
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-zinc-800/30 border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/10"
              onClick={() => setShowCreateModal(true)}
            >
              <MessageSquare className="w-4 h-4 mr-3 text-blue-400" />
              Create Chat Agent
            </Button>
            <Link to="/tools" className="block">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-zinc-800/30 border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/10"
              >
                <TrendingUp className="w-4 h-4 mr-3 text-emerald-400" />
                Configure Integrations
              </Button>
            </Link>
            <Link to="/knowledge" className="block">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-zinc-800/30 border-zinc-700 hover:border-purple-500/50 hover:bg-purple-500/10"
              >
                <AlertCircle className="w-4 h-4 mr-3 text-purple-400" />
                Upload Knowledge Base
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
