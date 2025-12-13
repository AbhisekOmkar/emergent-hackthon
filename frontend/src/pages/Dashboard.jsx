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
      color: "text-sky-500",
    },
    {
      title: "Total Calls",
      value: analytics?.total_calls || 0,
      icon: Phone,
      change: "This month",
      color: "text-emerald-500",
    },
    {
      title: "Success Rate",
      value: `${(analytics?.success_rate || 0).toFixed(1)}%`,
      icon: CheckCircle,
      change: "+5.2% vs last week",
      color: "text-cyan-500",
    },
    {
      title: "Avg Duration",
      value: `${Math.round(analytics?.average_duration || 0)}s`,
      icon: Clock,
      change: "Per conversation",
      color: "text-indigo-500",
    },
  ];

  const recentAgents = agents.slice(0, 4);

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit font-bold text-3xl text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your agent overview.</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold glow-amber-hover"
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
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-outfit font-bold text-slate-800 mt-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-slate-100 ${stat.color}`}>
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
            <CardTitle className="font-outfit text-xl text-slate-800">Your Agents</CardTitle>
            <Link to="/agents">
              <Button variant="ghost" className="text-sky-500 hover:text-sky-600">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAgents.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No agents yet. Create your first agent!</p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
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
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-sky-50 transition-colors border border-transparent hover:border-sky-200">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
                        {agent.type === 'voice' ? (
                          <Mic className="w-6 h-6 text-cyan-500" />
                        ) : agent.type === 'chat' ? (
                          <MessageSquare className="w-6 h-6 text-sky-500" />
                        ) : (
                          <Bot className="w-6 h-6 text-indigo-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-800">{agent.name}</h3>
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
                        <p className="text-sm text-slate-500 mt-0.5">{agent.description || 'No description'}</p>
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
                        <p className="text-xs text-slate-400 mt-1">
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
            <CardTitle className="font-outfit text-xl text-slate-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start bg-slate-50 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
              onClick={() => setShowCreateModal(true)}
            >
              <Bot className="w-4 h-4 mr-3 text-sky-500" />
              Create Voice Agent
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-slate-50 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50"
              onClick={() => setShowCreateModal(true)}
            >
              <MessageSquare className="w-4 h-4 mr-3 text-cyan-500" />
              Create Chat Agent
            </Button>
            <Link to="/tools" className="block">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <TrendingUp className="w-4 h-4 mr-3 text-emerald-500" />
                Configure Integrations
              </Button>
            </Link>
            <Link to="/knowledge" className="block">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
              >
                <AlertCircle className="w-4 h-4 mr-3 text-indigo-500" />
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
