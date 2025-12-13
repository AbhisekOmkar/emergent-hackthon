import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, Phone, MessageSquare, TrendingUp, Clock, 
  CheckCircle, AlertCircle, Plus, ArrowRight, Mic,
  Users, Zap, Activity
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
    <div data-testid="dashboard">
      {/* Header with gradient */}
      <div className="content-header px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm">Welcome back! Here's your agent overview.</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            data-testid="create-agent-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className="glass-card"
                data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-semibold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No agents yet. Create your first agent!</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
                      <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          agent.type === 'voice' ? 'bg-purple-100' :
                          agent.type === 'chat' ? 'bg-blue-100' : 'bg-indigo-100'
                        }`}>
                          {agent.type === 'voice' ? (
                            <Mic className="w-6 h-6 text-purple-600" />
                          ) : agent.type === 'chat' ? (
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Bot className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{agent.name}</h3>
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
                          <p className="text-sm text-gray-500 mt-0.5">{agent.description || 'No description'}</p>
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
                          <p className="text-xs text-gray-400 mt-1">
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
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                  <Mic className="w-4 h-4 text-purple-600" />
                </div>
                Create Voice Agent
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                Create Chat Agent
              </Button>
              <Link to="/tools" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border-gray-200 hover:bg-green-50 hover:border-green-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  Configure Integrations
                </Button>
              </Link>
              <Link to="/knowledge" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border-gray-200 hover:bg-orange-50 hover:border-orange-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  Upload Knowledge Base
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
