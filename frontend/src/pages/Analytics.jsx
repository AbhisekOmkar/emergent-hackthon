import { useEffect, useState } from "react";
import { 
  BarChart3, TrendingUp, Clock, CheckCircle, 
  Phone, ArrowUp, ArrowDown, Plus, RefreshCw, DollarSign,
  Smile, Meh, Frown, Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAnalyticsStore, useAgentStore } from "../stores/agentStore";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FeatureGate } from "../components/UpgradePrompt";

function AnalyticsContent() {
  const { analytics, chartData, recentCalls, insights, fetchAnalytics, fetchInsights, createInsight, loading } = useAnalyticsStore();
  const { agents, fetchAgents } = useAgentStore();
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [newInsight, setNewInsight] = useState({
    name: "",
    description: "",
    agent_id: "all",
    improvement_direction: "increase",
    prompt: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnalytics(selectedDays);
    fetchInsights();
    fetchAgents();
  }, [fetchAnalytics, fetchInsights, fetchAgents, selectedDays]);

  const handleRefresh = () => {
    toast.info("Refreshing analytics...");
    fetchAnalytics(selectedDays);
  };

  const handleCreateInsight = async () => {
    if (!newInsight.name.trim() || !newInsight.prompt.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    const result = await createInsight(newInsight);
    if (result) {
      toast.success("Insight created!");
      setShowInsightModal(false);
      setNewInsight({
        name: "",
        description: "",
        agent_id: "all",
        improvement_direction: "increase",
        prompt: "",
      });
    } else {
      toast.error("Failed to create insight");
    }
    setSaving(false);
  };

  // Use real data from API or fallback to empty
  const callsChartData = chartData?.calls_data || [];
  const durationChartData = chartData?.duration_data || [];

  // Sentiment data for pie chart
  const sentimentData = analytics?.sentiment_distribution ? [
    { name: "Positive", value: analytics.sentiment_distribution.positive, color: "#10b981" },
    { name: "Neutral", value: analytics.sentiment_distribution.neutral, color: "#6b7280" },
    { name: "Negative", value: analytics.sentiment_distribution.negative, color: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  const stats = [
    {
      title: "Total Calls",
      value: analytics?.total_calls || 0,
      subtext: `Last ${selectedDays} days`,
      icon: Phone,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Success Rate",
      value: `${(analytics?.success_rate || 0).toFixed(1)}%`,
      subtext: `${analytics?.successful_calls || 0} successful`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Avg Duration",
      value: `${Math.round(analytics?.average_duration || 0)}s`,
      subtext: "Per call",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Calls Today",
      value: analytics?.calls_today || 0,
      subtext: "Today's activity",
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  // Add cost stat if available
  if (analytics?.total_cost > 0) {
    stats.push({
      title: "Total Cost",
      value: `$${analytics.total_cost.toFixed(2)}`,
      subtext: `Last ${selectedDays} days`,
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="analytics-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Monitor your agent performance with real-time data</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={String(selectedDays)} onValueChange={(v) => setSelectedDays(Number(v))}>
              <SelectTrigger className="w-[140px] bg-white border-gray-200">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={loading}
              className="border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowInsightModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Insight
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(stats.length, 5)} gap-6`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calls Chart */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900">Calls Overview</CardTitle>
              <CardDescription className="text-gray-500">Total calls vs successful calls</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px]">
                {callsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={callsChartData}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="calls"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorCalls)"
                        name="Total Calls"
                      />
                      <Area
                        type="monotone"
                        dataKey="success"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorSuccess)"
                        name="Successful"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No call data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration Chart */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900">Average Duration</CardTitle>
              <CardDescription className="text-gray-500">Call duration in seconds</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px]">
                {durationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={durationChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value) => [`${value}s`, "Duration"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6" }}
                        name="Duration (s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No duration data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment & Recent Calls Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Chart */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900">User Sentiment</CardTitle>
              <CardDescription className="text-gray-500">How users feel about calls</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {sentimentData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {sentimentData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-gray-600">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Smile className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No sentiment data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Calls */}
          <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900">Recent Calls</CardTitle>
              <CardDescription className="text-gray-500">Latest call activity</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {recentCalls && recentCalls.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {recentCalls.map((call, idx) => (
                    <div key={call.call_id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          call.status === 'ended' ? 'bg-green-500' : 
                          call.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {call.status === 'ended' ? 'Completed' : call.status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {call.timestamp ? new Date(call.timestamp).toLocaleString() : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {call.sentiment && (
                          <Badge variant="outline" className={
                            call.sentiment === 'Positive' ? 'text-green-600 border-green-200' :
                            call.sentiment === 'Negative' ? 'text-red-600 border-red-200' :
                            'text-gray-600 border-gray-200'
                          }>
                            {call.sentiment === 'Positive' ? <Smile className="w-3 h-3 mr-1" /> :
                             call.sentiment === 'Negative' ? <Frown className="w-3 h-3 mr-1" /> :
                             <Meh className="w-3 h-3 mr-1" />}
                            {call.sentiment}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-600">{call.duration_seconds}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent calls</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Insights</CardTitle>
                <CardDescription className="text-gray-500">AI-powered analysis of your agents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No insights configured yet</p>
                <Button
                  onClick={() => setShowInsightModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Insight
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{insight.name}</h4>
                      <Badge
                        variant="outline"
                        className={
                          insight.improvement_direction === "increase"
                            ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                            : "text-red-600 border-red-200 bg-red-50"
                        }
                      >
                        {insight.improvement_direction}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        {insight.pass_rate}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {insight.simulations_passed}/{insight.simulations_passed + insight.simulations_failed} passed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Insight Modal */}
      <Dialog open={showInsightModal} onOpenChange={setShowInsightModal}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Create Insight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Name</Label>
                <Input
                  placeholder="Customer Satisfaction"
                  value={newInsight.name}
                  onChange={(e) => setNewInsight((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-white border-gray-200 focus:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Description</Label>
                <Input
                  placeholder="Track customer satisfaction rate"
                  value={newInsight.description}
                  onChange={(e) => setNewInsight((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-white border-gray-200 focus:border-blue-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Agent</Label>
                <Select
                  value={newInsight.agent_id}
                  onValueChange={(value) => setNewInsight((prev) => ({ ...prev, agent_id: value }))}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all">All agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Improvement Direction</Label>
                <Select
                  value={newInsight.improvement_direction}
                  onValueChange={(value) =>
                    setNewInsight((prev) => ({ ...prev, improvement_direction: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="increase">Increase</SelectItem>
                    <SelectItem value="decrease">Decrease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">What do you want to know from the insight?</Label>
              <Textarea
                placeholder="Analyze if the agent successfully resolved the customer's issue..."
                value={newInsight.prompt}
                onChange={(e) => setNewInsight((prev) => ({ ...prev, prompt: e.target.value }))}
                className="bg-white border-gray-200 focus:border-blue-300 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInsightModal(false)} className="text-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleCreateInsight}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Creating..." : "Create insight"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Analytics() {
  return (
    <FeatureGate feature="Analytics Dashboard">
      <AnalyticsContent />
    </FeatureGate>
  );
}
