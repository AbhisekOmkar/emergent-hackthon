import { useEffect, useState } from "react";
import { 
  Search, Plus, Plug, Globe, ExternalLink, Check, X,
  Users, Calendar, FileText, CreditCard, MessageSquare,
  Building2, Phone, Brain, Database, Briefcase, Mail,
  ShoppingCart, Zap, Link2, RefreshCw, Settings2, ArrowRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";

const categoryIcons = {
  crm: Users,
  calendar: Calendar,
  ticketing: MessageSquare,
  hr: Building2,
  accounting: FileText,
  payment: CreditCard,
  storage: Database,
  messaging: Mail,
  call_center: Phone,
  genai: Brain,
  commerce: ShoppingCart,
  ats: Briefcase,
  tasks: Zap,
  enrichment: Globe,
};

const categoryColors = {
  crm: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
  calendar: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
  ticketing: { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-200" },
  hr: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-200" },
  accounting: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-200" },
  payment: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  storage: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-200" },
  messaging: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-200" },
  call_center: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200" },
  genai: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-200" },
  commerce: { bg: "bg-rose-50", icon: "text-rose-600", border: "border-rose-200" },
  ats: { bg: "bg-teal-50", icon: "text-teal-600", border: "border-teal-200" },
  tasks: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200" },
  enrichment: { bg: "bg-slate-50", icon: "text-slate-600", border: "border-slate-200" },
};

const integrationCategories = [
  { id: "crm", name: "CRM", count: 39, description: "Customer relationship management", objects: ["company", "contact", "deal", "lead", "pipeline"] },
  { id: "calendar", name: "Calendar", count: 24, description: "Scheduling & calendars", objects: ["calendar", "event", "busy", "link"] },
  { id: "hr", name: "HR & HRIS", count: 196, description: "Human resources systems", objects: ["employee", "group", "payslip", "timeoff"] },
  { id: "ats", name: "ATS", count: 66, description: "Applicant tracking", objects: ["candidate", "job", "application"] },
  { id: "ticketing", name: "Ticketing", count: 7, description: "Support & helpdesk", objects: ["ticket", "customer", "note"] },
  { id: "accounting", name: "Accounting", count: 34, description: "Financial management", objects: ["invoice", "contact", "transaction"] },
  { id: "commerce", name: "Commerce", count: 25, description: "E-commerce platforms", objects: ["item", "collection", "inventory"] },
  { id: "payment", name: "Payment", count: 15, description: "Payment processing", objects: ["payment", "subscription", "refund"] },
  { id: "storage", name: "Storage", count: 25, description: "File storage & sharing", objects: ["file", "folder", "share"] },
  { id: "messaging", name: "Messaging", count: 14, description: "Communication platforms", objects: ["message", "channel", "thread"] },
  { id: "genai", name: "GenAI", count: 11, description: "AI & ML services", objects: ["model", "prompt", "embedding"] },
  { id: "call_center", name: "Call Center", count: 13, description: "Telephony systems", objects: ["contact", "call", "recording"] },
];

const popularIntegrations = [
  { id: "salesforce", name: "Salesforce", category: "crm", logo: "S", connected: false },
  { id: "hubspot", name: "HubSpot", category: "crm", logo: "H", connected: true },
  { id: "google_calendar", name: "Google Calendar", category: "calendar", logo: "G", connected: true },
  { id: "slack", name: "Slack", category: "messaging", logo: "S", connected: false },
  { id: "stripe", name: "Stripe", category: "payment", logo: "S", connected: false },
  { id: "zendesk", name: "Zendesk", category: "ticketing", logo: "Z", connected: false },
  { id: "twilio", name: "Twilio", category: "call_center", logo: "T", connected: true },
  { id: "openai", name: "OpenAI", category: "genai", logo: "O", connected: true },
];

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState(
    popularIntegrations.filter(i => i.connected).map(i => i.id)
  );

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const handleConfirmConnect = () => {
    if (selectedIntegration) {
      setConnectedIntegrations(prev => [...prev, selectedIntegration.id]);
      toast.success(`Connected to ${selectedIntegration.name}`);
    }
    setShowConnectModal(false);
  };

  const handleDisconnect = (integrationId) => {
    setConnectedIntegrations(prev => prev.filter(id => id !== integrationId));
    toast.success("Integration disconnected");
  };

  const filteredCategories = integrationCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="integrations-page">
      {/* Header */}
      <div className="content-header px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Plug className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
              <p className="text-gray-500 text-sm">Connect your favorite tools and services</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Unified.to
            </Badge>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Connected Integrations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connected Integrations</h2>
            <span className="text-sm text-gray-500">{connectedIntegrations.length} active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularIntegrations
              .filter(i => connectedIntegrations.includes(i.id))
              .map((integration) => {
                const colors = categoryColors[integration.category];
                return (
                  <Card key={integration.id} className="glass-card group relative overflow-hidden">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-3 relative`}>
                        <span className={`text-xl font-bold ${colors.icon}`}>
                          {integration.logo}
                        </span>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900">{integration.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs text-gray-500 hover:text-red-500"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Settings2 className="w-3 h-3 mr-1" />
                        Manage
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            {connectedIntegrations.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No integrations connected yet
              </div>
            )}
          </div>
        </section>

        {/* Integration Categories */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category) => {
              const Icon = categoryIcons[category.id] || Globe;
              const colors = categoryColors[category.id] || categoryColors.enrichment;
              return (
                <Card 
                  key={category.id} 
                  className={`glass-card card-hover cursor-pointer group border-2 border-transparent hover:${colors.border}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 border-0">
                        {category.count}+
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {category.objects.slice(0, 3).map((obj) => (
                        <Badge key={obj} variant="outline" className="text-xs border-gray-200 text-gray-500">
                          {obj}
                        </Badge>
                      ))}
                      {category.objects.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                          +{category.objects.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Popular Integrations */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Integrations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {popularIntegrations.map((integration) => {
              const colors = categoryColors[integration.category];
              const isConnected = connectedIntegrations.includes(integration.id);
              return (
                <Card 
                  key={integration.id} 
                  className="glass-card card-hover cursor-pointer"
                  onClick={() => !isConnected && handleConnect(integration)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-2`}>
                      <span className={`text-lg font-bold ${colors.icon}`}>
                        {integration.logo}
                      </span>
                    </div>
                    <h4 className="font-medium text-xs text-gray-900">{integration.name}</h4>
                    {isConnected ? (
                      <Badge className="mt-2 bg-green-100 text-green-700 border-0 text-xs">
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                      >
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      {/* Connect Modal */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Connect {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-600 mb-4">
              You'll be redirected to authorize access to your {selectedIntegration?.name} account.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Unified.to Integration</p>
                  <p className="text-sm text-blue-700">Secure OAuth2 connection with read/write access</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectModal(false)} className="border-gray-200">
              Cancel
            </Button>
            <Button onClick={handleConfirmConnect} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link2 className="w-4 h-4 mr-2" />
              Authorize Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
