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
    retell_api_key: "",
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
    <div className="min-h-screen bg-gray-50" data-testid="settings-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-bold text-3xl text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md"
            >
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="api-keys" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md"
            >
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Profile Information</CardTitle>
                <CardDescription className="text-gray-500">Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Name</Label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-white border-gray-200 focus:border-blue-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email</Label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                      className="bg-white border-gray-200 focus:border-blue-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Company</Label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, company: e.target.value }))}
                    className="bg-white border-gray-200 focus:border-blue-300"
                  />
                </div>
                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">API Keys</CardTitle>
                <CardDescription className="text-gray-500">Configure your service API keys</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* LLM Providers */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2">LLM Providers</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-600">OpenAI API Key</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, openai: e.target.value }))}
                        className="bg-white border-gray-200 focus:border-blue-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600">Anthropic API Key</Label>
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        value={apiKeys.anthropic}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, anthropic: e.target.value }))}
                        className="bg-white border-gray-200 focus:border-blue-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Voice Providers */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2">Voice Providers</h3>
                  <div className="space-y-2">
                    <Label className="text-gray-600">ElevenLabs API Key</Label>
                    <Input
                      type="password"
                      placeholder="xi-..."
                      value={apiKeys.elevenlabs}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, elevenlabs: e.target.value }))}
                      className="bg-white border-gray-200 focus:border-blue-300"
                    />
                  </div>
                </div>

                {/* Voice Platform */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2">Voice Platform Configuration</h3>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Voice Platform API Key</Label>
                    <Input
                      type="password"
                      placeholder="key_..."
                      value={apiKeys.retell_api_key}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, retell_api_key: e.target.value }))}
                      className="bg-white border-gray-200 focus:border-blue-300"
                    />
                    <p className="text-xs text-gray-400">Required for voice agent functionality</p>
                  </div>
                </div>

                <Button onClick={handleSaveApiKeys} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save API Keys
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Notification Preferences</CardTitle>
                <CardDescription className="text-gray-500">Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Email Alerts</p>
                    <p className="text-sm text-gray-500">Receive alerts via email</p>
                  </div>
                  <Switch
                    checked={notifications.email_alerts}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, email_alerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Call Notifications</p>
                    <p className="text-sm text-gray-500">Get notified for each call</p>
                  </div>
                  <Switch
                    checked={notifications.call_notifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, call_notifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Reports</p>
                    <p className="text-sm text-gray-500">Receive weekly analytics reports</p>
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Billing & Usage</CardTitle>
                <CardDescription className="text-gray-500">Manage your subscription and view usage</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-600">Current Plan</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">Pro Plan</p>
                    </div>
                    <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                      Upgrade
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500">Calls Used</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">1,234</p>
                    <p className="text-xs text-gray-400 mt-1">of 5,000 / month</p>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500">Agents</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
                    <p className="text-xs text-gray-400 mt-1">of 10 max</p>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500">Storage</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">2.4 GB</p>
                    <p className="text-xs text-gray-400 mt-1">of 10 GB</p>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
