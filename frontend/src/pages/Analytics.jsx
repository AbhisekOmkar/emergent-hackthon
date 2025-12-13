import { useEffect, useState } from "react";
import { 
  BarChart3, TrendingUp, Clock, CheckCircle, 
  Phone, ArrowUp, ArrowDown, Plus
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
} from "recharts";

// Mock data for charts
const callsData = [
  { name: "Mon", calls: 45, success: 42 },
  { name: "Tue", calls: 52, success: 48 },
  { name: "Wed", calls: 61, success: 57 },
  { name: "Thu", calls: 48, success: 45 },
  { name: "Fri", calls: 55, success: 51 },
  { name: "Sat", calls: 32, success: 30 },
  { name: "Sun", calls: 28, success: 26 },
];

const durationData = [
  { name: "Mon", duration: 120 },
  { name: "Tue", duration: 145 },
  { name: "Wed", duration: 132 },
  { name: "Thu", duration: 158 },
  { name: "Fri", duration: 142 },
  { name: "Sat", duration: 98 },
  { name: "Sun", duration: 88 },
];

export default function Analytics() {
  const { analytics, insights, fetchAnalytics, fetchInsights, createInsight } = useAnalyticsStore();
  const { agents, fetchAgents } = useAgentStore();
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [newInsight, setNewInsight] = useState({
    name: "",
    description: "",
    agent_id: "all",
    improvement_direction: "increase",
    prompt: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
    fetchAgents();
  }, [fetchAnalytics, fetchInsights, fetchAgents]);

  const handleCreateInsight = async () => {
    if (!newInsight.name.trim() || !newInsight.prompt.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
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
    setLoading(false);
  };

  const stats = [
    {
      title: "Total Calls",
      value: analytics?.total_calls || 0,
      change: "+12%",
      trend: "up",
      icon: Phone,
      color: "text-blue-400",
    },
    {
      title: "Success Rate",
      value: `${(analytics?.success_rate || 0).toFixed(1)}%`,
      change: "+5.2%",
      trend: "up",
      icon: CheckCircle,
      color: "text-emerald-400",
    },
    {
      title: "Avg Duration",
      value: `${Math.round(analytics?.average_duration || 0)}s`,
      change: "-8%",
      trend: "down",
      icon: Clock,
      color: "text-amber-400",
    },
    {
      title: "Calls Today",
      value: analytics?.calls_today || 0,
      change: "+3",
      trend: "up",
      icon: TrendingUp,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans font-bold text-3xl text-zinc-900">Analytics</h1>
          <p className="text-zinc-400 mt-1">Monitor your agent performance</p>
        </div>
        <Button
          onClick={() => setShowInsightModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Insight
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">{stat.title}</p>
                    <p className="text-3xl font-sans font-bold text-zinc-900 mt-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === "up" ? (
                        <ArrowUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className={`text-xs ${
                          stat.trend === "up" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-zinc-500">vs last week</span>
                    </div>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-zinc-900">Calls Overview</CardTitle>
            <CardDescription>Total calls vs successful calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callsData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorSuccess)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Duration Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-zinc-900">Average Duration</CardTitle>
            <CardDescription>Call duration in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={durationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: "#a855f7" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-sans text-lg text-zinc-900">Insights</CardTitle>
              <CardDescription>AI-powered analysis of your agents</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No insights configured yet</p>
              <Button
                onClick={() => setShowInsightModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black"
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
                  className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-zinc-900">{insight.name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        insight.improvement_direction === "increase"
                          ? "text-emerald-400 border-emerald-500/30"
                          : "text-red-400 border-red-500/30"
                      }
                    >
                      {insight.improvement_direction}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-sans font-bold text-zinc-900">
                      {insight.pass_rate}%
                    </span>
                    <span className="text-xs text-zinc-500">
                      {insight.simulations_passed}/{insight.simulations_passed + insight.simulations_failed} passed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Insight Modal */}
      <Dialog open={showInsightModal} onOpenChange={setShowInsightModal}>
        <DialogContent className="bg-[#0F0F12] border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-sans text-xl text-zinc-900">Create Insight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Name</Label>
                <Input
                  placeholder="Customer Satisfaction"
                  value={newInsight.name}
                  onChange={(e) => setNewInsight((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Input
                  placeholder="Track customer satisfaction rate"
                  value={newInsight.description}
                  onChange={(e) => setNewInsight((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Agent</Label>
                <Select
                  value={newInsight.agent_id}
                  onValueChange={(value) => setNewInsight((prev) => ({ ...prev, agent_id: value }))}
                >
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
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
                <Label className="text-zinc-300">Improvement Direction</Label>
                <Select
                  value={newInsight.improvement_direction}
                  onValueChange={(value) =>
                    setNewInsight((prev) => ({ ...prev, improvement_direction: value }))
                  }
                >
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="increase">Increase</SelectItem>
                    <SelectItem value="decrease">Decrease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">What do you want to know from the insight?</Label>
              <Textarea
                placeholder="Analyze if the agent successfully resolved the customer's issue..."
                value={newInsight.prompt}
                onChange={(e) => setNewInsight((prev) => ({ ...prev, prompt: e.target.value }))}
                className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInsightModal(false)} className="text-zinc-400">
              Cancel
            </Button>
            <Button
              onClick={handleCreateInsight}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? "Creating..." : "Create insight"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
