import { useEffect, useState } from "react";
import { 
  Search, Plus, Wrench, Globe, Code2, 
  Users, Calendar, MessageSquare, CreditCard, 
  FileText, Building2, Phone, Brain, ExternalLink
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToolStore } from "../stores/agentStore";
import CreateToolModal from "../components/tools/CreateToolModal";
import { FeatureGate } from "../components/UpgradePrompt";

const categoryIcons = {
  crm: Users,
  calendar: Calendar,
  ticketing: MessageSquare,
  hr: Building2,
  accounting: FileText,
  payment: CreditCard,
  storage: Globe,
  messaging: MessageSquare,
  call_center: Phone,
  genai: Brain,
  builtin: Code2,
  custom: Wrench,
  voice: Phone,
};

const integrationCategories = [
  { id: "crm", name: "CRM", count: 39, objects: ["company", "contact", "deal", "lead", "pipeline"] },
  { id: "calendar", name: "Calendar", count: 24, objects: ["calendar", "event", "busy", "link"] },
  { id: "hr", name: "HR & HRIS", count: 196, objects: ["employee", "group", "payslip", "timeoff"] },
  { id: "ats", name: "ATS", count: 66, objects: ["candidate", "job", "application", "interview"] },
  { id: "ticketing", name: "Ticketing", count: 7, objects: ["ticket", "customer", "note"] },
  { id: "accounting", name: "Accounting", count: 34, objects: ["invoice", "contact", "transaction"] },
  { id: "commerce", name: "Commerce", count: 25, objects: ["item", "collection", "inventory"] },
  { id: "payment", name: "Payment", count: 15, objects: ["payment", "subscription", "refund"] },
  { id: "storage", name: "Storage", count: 25, objects: ["file"] },
  { id: "messaging", name: "Messaging", count: 14, objects: ["message", "channel"] },
];

const popularIntegrations = {
  crm: [
    { id: "salesforce", name: "Salesforce" },
    { id: "hubspot", name: "HubSpot" },
    { id: "zoho", name: "Zoho CRM" },
    { id: "pipedrive", name: "Pipedrive" },
  ],
  calendar: [
    { id: "google_calendar", name: "Google Calendar" },
    { id: "outlook_calendar", name: "Outlook Calendar" },
    { id: "calendly", name: "Calendly" },
    { id: "cal_com", name: "Cal.com" },
  ],
};

function ToolsContent() {
  const { tools, builtinTools, fetchTools } = useToolStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return (
    <div data-testid="tools-page">
      {/* Header with gradient */}
      <div className="content-header px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Tools</h1>
              <p className="text-gray-500 text-sm">Connect integrations and create custom tools for your agents</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white border-gray-200">
              <Globe className="w-4 h-4 mr-2" />
              Connect Integration
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Tool
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tools and integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">All Tools</TabsTrigger>
            <TabsTrigger value="builtin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Built-in</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Integrations</TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Custom</TabsTrigger>
          </TabsList>

          {/* All Tools */}
          <TabsContent value="all" className="space-y-8 mt-6">
            {/* Built-in Tools Section */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Built-in Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {builtinTools.map((tool) => {
                  const Icon = categoryIcons[tool.category] || Wrench;
                  const iconColors = {
                    calendar: { bg: 'bg-blue-100', text: 'text-blue-600' },
                    crm: { bg: 'bg-purple-100', text: 'text-purple-600' },
                    voice: { bg: 'bg-blue-200', text: 'text-blue-700' },
                    messaging: { bg: 'bg-green-100', text: 'text-green-600' },
                    ticketing: { bg: 'bg-pink-100', text: 'text-pink-600' },
                  };
                  const colors = iconColors[tool.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                  
                  return (
                    <Card key={tool.id} className="glass-card card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <h3 className="font-medium text-gray-900">{tool.name}</h3>
                          </div>
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                            builtin
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 ml-13">{tool.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Integration Categories */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Integration Categories</h2>
                <Badge className="bg-blue-100 text-blue-700 border-0">Powered by Unified.to</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {integrationCategories.map((category) => {
                  const Icon = categoryIcons[category.id] || Globe;
                  return (
                    <Card key={category.id} className="glass-card card-hover cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                              <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                          </div>
                          <Badge className="bg-gray-100 text-gray-600 border-0">
                            {category.count}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-13">
                          {category.objects.slice(0, 4).map((obj) => (
                            <Badge key={obj} variant="outline" className="text-xs border-gray-200 text-gray-500">
                              {obj}
                            </Badge>
                          ))}
                          {category.objects.length > 4 && (
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                              +{category.objects.length - 4}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          </TabsContent>

          {/* Built-in Tab */}
          <TabsContent value="builtin" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {builtinTools.map((tool) => {
                const Icon = categoryIcons[tool.category] || Wrench;
                return (
                  <Card key={tool.id} className="glass-card card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="font-medium text-gray-900">{tool.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-200">
                          {tool.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{tool.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-8 mt-6">
            {Object.entries(popularIntegrations).map(([category, integrations]) => (
              <section key={category}>
                <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {integrations.map((integration) => (
                    <Card key={integration.id} className="glass-card card-hover cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-400">
                            {integration.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-900">{integration.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1 border-gray-200">
                            {category}
                          </Badge>
                        </div>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Connect
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}

            {/* Unified.to Attribution */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
              <span>Powered by</span>
              <a 
                href="https://unified.to" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                Unified.to
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>• 350+ integrations via single API</span>
            </div>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="mt-6">
            {tools.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Wrench className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No custom tools yet</h3>
                  <p className="text-gray-500 mb-6">Create custom HTTP tools for your agents</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Tool
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <Card key={tool.id} className="glass-card card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                          </div>
                          <h3 className="font-medium text-gray-900">{tool.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-200">
                          {tool.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{tool.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Tool Modal */}
      <CreateToolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
