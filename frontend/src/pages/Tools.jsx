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

export default function Tools() {
  const { tools, builtinTools, fetchTools } = useToolStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return (
    <div className="space-y-6" data-testid="tools-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit font-bold text-3xl text-slate-800">Tools</h1>
          <p className="text-slate-500 mt-1">Connect integrations and create custom tools for your agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200">
            <Globe className="w-4 h-4 mr-2" />
            Connect Integration
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Tool
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search tools and integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200 focus:border-sky-400"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all">All Tools</TabsTrigger>
          <TabsTrigger value="builtin">Built-in</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {/* All Tools */}
        <TabsContent value="all" className="space-y-8">
          {/* Built-in Tools Section */}
          <section>
            <h2 className="text-xl font-outfit font-semibold text-slate-800 mb-4">Built-in Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {builtinTools.map((tool) => {
                const Icon = categoryIcons[tool.category] || Wrench;
                return (
                  <Card key={tool.id} className="glass-card card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-sky-100">
                            <Icon className="w-4 h-4 text-sky-500" />
                          </div>
                          <h3 className="font-medium text-slate-800">{tool.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs border-slate-200">
                          builtin
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{tool.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Integration Categories */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-outfit font-semibold text-slate-800">Integration Categories</h2>
              <Badge variant="secondary" className="bg-slate-100">Powered by Unified.to</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {integrationCategories.map((category) => {
                const Icon = categoryIcons[category.id] || Globe;
                return (
                  <Card key={category.id} className="glass-card card-hover cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-sky-100 transition-colors">
                            <Icon className="w-4 h-4 text-slate-500 group-hover:text-sky-500 transition-colors" />
                          </div>
                          <h3 className="font-medium text-slate-800">{category.name}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-slate-100">
                          {category.count}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {category.objects.slice(0, 4).map((obj) => (
                          <Badge key={obj} variant="outline" className="text-xs border-slate-200">
                            {obj}
                          </Badge>
                        ))}
                        {category.objects.length > 4 && (
                          <Badge variant="outline" className="text-xs border-slate-200">
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
        <TabsContent value="builtin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builtinTools.map((tool) => {
              const Icon = categoryIcons[tool.category] || Wrench;
              return (
                <Card key={tool.id} className="glass-card card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-sky-100">
                          <Icon className="w-4 h-4 text-sky-500" />
                        </div>
                        <h3 className="font-medium text-slate-800">{tool.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs border-slate-200">
                        {tool.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{tool.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-8">
          {Object.entries(popularIntegrations).map(([category, integrations]) => (
            <section key={category}>
              <h3 className="text-lg font-outfit font-semibold text-slate-800 capitalize mb-4">{category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {integrations.map((integration) => (
                  <Card key={integration.id} className="glass-card card-hover cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-400">
                          {integration.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-slate-800">{integration.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1 border-slate-200">
                          {category}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="w-full border-slate-200">
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {/* Unified.to Attribution */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 pt-4">
            <span>Powered by</span>
            <a 
              href="https://unified.to" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sky-500 hover:underline"
            >
              Unified.to
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>• 350+ integrations via single API</span>
          </div>
        </TabsContent>

        {/* Custom Tab */}
        <TabsContent value="custom">
          {tools.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No custom tools yet</h3>
                <p className="text-slate-500 mb-6">Create custom HTTP tools for your agents</p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
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
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-100">
                          <Code2 className="w-4 h-4 text-indigo-500" />
                        </div>
                        <h3 className="font-medium text-slate-800">{tool.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs border-slate-200">
                        {tool.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{tool.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Tool Modal */}
      <CreateToolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
