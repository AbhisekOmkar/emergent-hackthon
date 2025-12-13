import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, Phone, MessageSquare, TrendingUp, Clock, 
  CheckCircle, AlertCircle, Plus, ArrowRight, Mic,
  Users, Zap, Activity, LayoutDashboard, Sparkles
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
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Calls",
      value: analytics?.total_calls || 0,
      icon: Phone,
      change: "This month",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Success Rate",
      value: `${(analytics?.success_rate || 0).toFixed(1)}%`,
      icon: CheckCircle,
      change: "+5.2% vs last week",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Avg Duration",
      value: `${Math.round(analytics?.average_duration || 0)}s`,
      icon: Clock,
      change: "Per conversation",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  const recentAgents = agents.slice(0, 4);

  return (
    <div data-testid="dashboard" className="min-h-screen">
      {/* Hero Section with Image */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-black/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        <div className="px-8 py-10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">AI Agent Platform</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
                    Welcome to <span className="gradient-text">Intelliax</span>
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Build, deploy, and manage intelligent AI agents that automate your workflows and enhance productivity.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm hover:shadow-md transition-all"
                    data-testid="create-agent-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                  </Button>
                  <Link to="/agents">
                    <Button 
                      variant="outline"
                      className="border-gray-200 hover:bg-gray-50 font-medium px-6 h-11 rounded-lg"
                    >
                      View All Agents
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-black/10">
                  <img 
                    src="https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=800&h=600&fit=crop" 
                    alt="AI Dashboard" 
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className="stat-card group cursor-pointer"
                data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </p>
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
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Your Agents</CardTitle>
              <Link to="/agents">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {recentAgents.length === 0 ? (
                <div className="text-center py-16 fade-in">
                  <div className="empty-state-image max-w-sm mx-auto mb-6">
                    <img 
                      src="https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600&h=400&fit=crop" 
                      alt="AI Brain" 
                      className="w-full h-64 object-cover rounded-xl opacity-70"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by creating your first AI agent. Build intelligent assistants for voice, chat, or multi-modal interactions.</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAgents.map((agent, idx) => (
                    <Link
                      key={agent.id}
                      to={`/agents/${agent.id}/builder`}
                      className="block slide-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      data-testid={`agent-card-${agent.id}`}
                    >
                      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                          agent.type === 'voice' ? 'bg-purple-50' :
                          agent.type === 'chat' ? 'bg-blue-50' : 'bg-indigo-50'
                        }`}>
                          {agent.type === 'voice' ? (
                            <Mic className="w-5 h-5 text-purple-600" />
                          ) : agent.type === 'chat' ? (
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Bot className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{agent.name}</h3>
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
                          <p className="text-xs text-gray-500 truncate">{agent.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline"
                            className={
                              agent.status === 'active' ? 'status-active' :
                              agent.status === 'paused' ? 'status-paused' : 'status-draft'
                            }
                          >
                            {agent.status}
                          </Badge>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-900">
                              {agent.calls_count || 0}
                            </p>
                            <p className="text-[10px] text-gray-400">calls</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <CardHeader className="border-b border-black/5 pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3 bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-all group"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                  <Mic className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-gray-900">Create Voice Agent</p>
                  <p className="text-xs text-gray-500">Build phone AI assistant</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3 bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-gray-900">Create Chat Agent</p>
                  <p className="text-xs text-gray-500">Build messaging bot</p>
                </div>
              </Button>
              <Link to="/tools" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 group-hover:bg-emerald-100 transition-colors">
                    <Zap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-gray-900">Configure Tools</p>
                    <p className="text-xs text-gray-500">Add custom actions</p>
                  </div>
                </Button>
              </Link>
              <Link to="/knowledge" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 bg-white border-gray-200 hover:bg-amber-50 hover:border-amber-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mr-3 group-hover:bg-amber-100 transition-colors">
                    <Activity className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-gray-900">Upload Knowledge</p>
                    <p className="text-xs text-gray-500">Train your agents</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}

function LayoutDashboard(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
