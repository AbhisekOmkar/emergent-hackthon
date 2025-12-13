import { useState } from "react";
import { User, Bell, Shield, CreditCard, Key, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";

export default function Settings() {
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john@example.com",
    company: "Acme Inc",
  });

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    elevenlabs: "",
    livekit_url: "",
    livekit_api_key: "",
    livekit_api_secret: "",
  });

  const [notifications, setNotifications] = useState({
    email_alerts: true,
    call_notifications: true,
    weekly_reports: false,
  });

  const handleSaveProfile = () => {
    toast.success("Profile saved successfully!");
  };

  const handleSaveApiKeys = () => {
    toast.success("API keys saved successfully!");
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="font-outfit font-bold text-3xl text-zinc-900">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-zinc-900">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-zinc-900">Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Name</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Company</Label>
                <Input
                  value={profileData.company}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, company: e.target.value }))}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                />
              </div>
              <Button onClick={handleSaveProfile} className="bg-amber-500 hover:bg-amber-600 text-black">
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-zinc-900">API Keys</CardTitle>
              <CardDescription>Configure your service API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* LLM Providers */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-300">LLM Providers</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">OpenAI API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, openai: e.target.value }))}
                      className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Anthropic API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-ant-..."
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, anthropic: e.target.value }))}
                      className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Voice Providers */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-300">Voice Providers</h3>
                <div className="space-y-2">
                  <Label className="text-zinc-400">ElevenLabs API Key</Label>
                  <Input
                    type="password"
                    placeholder="xi-..."
                    value={apiKeys.elevenlabs}
                    onChange={(e) => setApiKeys((prev) => ({ ...prev, elevenlabs: e.target.value }))}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* LiveKit */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-300">LiveKit Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">LiveKit URL</Label>
                    <Input
                      placeholder="wss://your-livekit-server.com"
                      value={apiKeys.livekit_url}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, livekit_url: e.target.value }))}
                      className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">API Key</Label>
                      <Input
                        type="password"
                        placeholder="API Key"
                        value={apiKeys.livekit_api_key}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, livekit_api_key: e.target.value }))}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400">API Secret</Label>
                      <Input
                        type="password"
                        placeholder="API Secret"
                        value={apiKeys.livekit_api_secret}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, livekit_api_secret: e.target.value }))}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveApiKeys} className="bg-amber-500 hover:bg-amber-600 text-black">
                <Save className="w-4 h-4 mr-2" />
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-zinc-900">Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">Email Alerts</p>
                  <p className="text-sm text-zinc-400">Receive alerts via email</p>
                </div>
                <Switch
                  checked={notifications.email_alerts}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, email_alerts: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">Call Notifications</p>
                  <p className="text-sm text-zinc-400">Get notified for each call</p>
                </div>
                <Switch
                  checked={notifications.call_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, call_notifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">Weekly Reports</p>
                  <p className="text-sm text-zinc-400">Receive weekly analytics reports</p>
                </div>
                <Switch
                  checked={notifications.weekly_reports}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, weekly_reports: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-zinc-900">Billing & Usage</CardTitle>
              <CardDescription>Manage your subscription and view usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">Current Plan</p>
                    <p className="text-2xl font-outfit font-bold text-amber-400">Pro Plan</p>
                  </div>
                  <Button variant="outline" className="border-amber-500 text-amber-400">
                    Upgrade
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/30">
                  <p className="text-sm text-zinc-400">Calls Used</p>
                  <p className="text-2xl font-outfit font-bold text-zinc-900">1,234</p>
                  <p className="text-xs text-zinc-500">of 5,000 / month</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/30">
                  <p className="text-sm text-zinc-400">Agents</p>
                  <p className="text-2xl font-outfit font-bold text-zinc-900">5</p>
                  <p className="text-xs text-zinc-500">of 10 max</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/30">
                  <p className="text-sm text-zinc-400">Storage</p>
                  <p className="text-2xl font-outfit font-bold text-zinc-900">2.4 GB</p>
                  <p className="text-xs text-zinc-500">of 10 GB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
