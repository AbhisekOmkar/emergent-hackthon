import { useEffect, useState } from "react";
import { 
  Plus, Database, FileText, Upload, Trash2, Search, 
  FolderOpen, File, BookOpen, MoreVertical, Link2,
  Eye, X, CheckCircle, RefreshCw, Loader2, Globe, ExternalLink
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Knowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState(null);
  const [kbDetails, setKbDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newKB, setNewKB] = useState({ name: "", urls: "", texts: [] });
  const [newText, setNewText] = useState({ title: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sourceTab, setSourceTab] = useState("url");

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    setLoading(true);
    try {
      // Fetch from API
      const response = await axios.get(`${API}/retell/knowledge-bases`);
      setKnowledgeBases(response.data || []);
    } catch (error) {
      console.error("Failed to fetch knowledge bases:", error);
      // Fallback to local if API fails
      try {
        const localResponse = await axios.get(`${API}/knowledge`);
        setKnowledgeBases(localResponse.data || []);
      } catch (e) {
        toast.error("Failed to load knowledge bases");
      }
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API}/retell/knowledge-bases/sync`);
      toast.success("Knowledge bases synced from cloud!");
      await fetchKnowledgeBases();
    } catch (error) {
      toast.error("Failed to sync knowledge bases");
    }
    setSyncing(false);
  };

  const handleCreate = async () => {
    if (!newKB.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setLoading(true);
    try {
      const requestData = {
        knowledge_base_name: newKB.name,
      };

      // Add URLs if provided
      if (newKB.urls.trim()) {
        requestData.knowledge_base_urls = newKB.urls
          .split("\n")
          .map(url => url.trim())
          .filter(url => url.length > 0);
      }

      // Add texts if provided
      if (newKB.texts.length > 0) {
        requestData.knowledge_base_texts = newKB.texts;
      }

      const response = await axios.post(`${API}/retell/knowledge-bases`, requestData);
      
      toast.success("Knowledge base created!");
      setShowCreateModal(false);
      setNewKB({ name: "", urls: "", texts: [] });
      await fetchKnowledgeBases();
    } catch (error) {
      console.error("Create error:", error);
      const status = error.response?.status;
      if (status === 500) {
        toast.error(
          "API creation failed. Please create knowledge bases in the dashboard and use Sync.",
          { duration: 6000 }
        );
      } else {
const errorDetail = error.response?.data?.detail;
        const errorMsg = typeof errorDetail === 'string' ? errorDetail : 
          (Array.isArray(errorDetail) ? errorDetail.map(e => e.msg).join(', ') : "Failed to create knowledge base");
        toast.error(errorMsg);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (kbId) => {
    if (!window.confirm("Are you sure you want to delete this knowledge base?")) return;
    try {
      await axios.delete(`${API}/retell/knowledge-bases/${kbId}`);
      setKnowledgeBases((prev) => prev.filter((kb) => kb.knowledge_base_id !== kbId));
      toast.success("Knowledge base deleted");
    } catch (error) {
      toast.error("Failed to delete knowledge base");
    }
  };

  const handleViewDetails = async (kb) => {
    setSelectedKB(kb);
    setShowDetailsModal(true);
    try {
      const response = await axios.get(`${API}/retell/knowledge-bases/${kb.knowledge_base_id}`);
      setKbDetails(response.data);
    } catch (error) {
      toast.error("Failed to load knowledge base details");
    }
  };

  const handleAddSource = (kb) => {
    setSelectedKB(kb);
    setShowAddSourceModal(true);
    setNewText({ title: "", text: "" });
  };

  const submitAddSource = async () => {
    if (!selectedKB) return;
    
    setLoading(true);
    try {
      const requestData = {};
      
      if (sourceTab === "url" && newKB.urls.trim()) {
        requestData.knowledge_base_urls = newKB.urls
          .split("\n")
          .map(url => url.trim())
          .filter(url => url.length > 0);
      } else if (sourceTab === "text" && newText.title.trim() && newText.text.trim()) {
        requestData.knowledge_base_texts = [{
          title: newText.title,
          text: newText.text
        }];
      }

      if (Object.keys(requestData).length === 0) {
        toast.error("Please provide content to add");
        setLoading(false);
        return;
      }

      await axios.post(
        `${API}/retell/knowledge-bases/${selectedKB.knowledge_base_id}/sources`,
        requestData
      );
      
      toast.success("Source added successfully!");
      setShowAddSourceModal(false);
      setNewKB({ ...newKB, urls: "" });
      setNewText({ title: "", text: "" });
      await fetchKnowledgeBases();
    } catch (error) {
      console.error("Add source error:", error);
      const errorDetail = error.response?.data?.detail;
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : 
        (Array.isArray(errorDetail) ? errorDetail.map(e => e.msg).join(', ') : "Failed to add source");
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  const handleDeleteSource = async (kbId, sourceId) => {
    if (!window.confirm("Delete this source?")) return;
    try {
      await axios.delete(`${API}/retell/knowledge-bases/${kbId}/sources/${sourceId}`);
      toast.success("Source deleted");
      // Refresh details
      const response = await axios.get(`${API}/retell/knowledge-bases/${kbId}`);
      setKbDetails(response.data);
    } catch (error) {
      toast.error("Failed to delete source");
    }
  };

  const addTextToList = () => {
    if (!newText.title.trim() || !newText.text.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    setNewKB(prev => ({
      ...prev,
      texts: [...prev.texts, { title: newText.title, text: newText.text }]
    }));
    setNewText({ title: "", text: "" });
  };

  const removeTextFromList = (index) => {
    setNewKB(prev => ({
      ...prev,
      texts: prev.texts.filter((_, i) => i !== index)
    }));
  };

  const filteredKBs = knowledgeBases.filter(
    (kb) => {
      const name = kb.knowledge_base_name || kb.name || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }
  );

  return (
    <div data-testid="knowledge-page" className="min-h-screen">
      {/* Header */}
      <div className="content-header px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Knowledge Base</h1>
              <p className="text-gray-600 text-sm">Upload documents and data to train your agents with RAG</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSync}
                variant="outline"
                disabled={syncing}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search knowledge bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 h-10 rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{knowledgeBases.length}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Knowledge Bases</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
                <File className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {knowledgeBases.reduce((acc, kb) => {
                    const sources = kb.knowledge_base_sources || [];
                    return acc + sources.length;
                  }, 0)}
                </p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sources</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {knowledgeBases.filter(kb => {
                    const sources = kb.knowledge_base_sources || [];
                    return sources.length > 0;
                  }).length}
                </p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Bases</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Bases Grid */}
        {loading && knowledgeBases.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredKBs.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Database className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No knowledge bases yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Create a knowledge base and add content to train your agents with custom information
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Knowledge Base
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKBs.map((kb) => {
              const kbId = kb.knowledge_base_id;
              const kbName = kb.knowledge_base_name || kb.name || "Unnamed";
              const sources = kb.knowledge_base_sources || [];
              const urlCount = sources.filter(s => s.source_url).length;
              const textCount = sources.filter(s => !s.source_url).length;
              
              return (
                <Card key={kbId} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-200">
                          <DropdownMenuItem onClick={() => handleAddSource(kb)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Add Sources
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(kb)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-100" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(kbId)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{kbName}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      ID: {kbId?.slice(0, 12)}...
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {urlCount > 0 && (
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          <Globe className="w-3 h-3 mr-1" />
                          {urlCount} URLs
                        </Badge>
                      )}
                      {textCount > 0 && (
                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                          <FileText className="w-3 h-3 mr-1" />
                          {textCount} Texts
                        </Badge>
                      )}
                      {sources.length === 0 && (
                        <Badge variant="outline" className="border-gray-200 text-gray-500">
                          No sources
                      </Badge>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => handleAddSource(kb)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Create Knowledge Base
            </DialogTitle>
            <DialogDescription>
              Create a knowledge base to add custom information for your agents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Name *</Label>
              <Input
                placeholder="Product Documentation"
                value={newKB.name}
                onChange={(e) => setNewKB((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="url">Add URLs</TabsTrigger>
                <TabsTrigger value="text">Add Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
                  <Label className="text-gray-700">Website URLs (one per line)</Label>
              <Textarea
                    placeholder="https://example.com/page1&#10;https://example.com/page2"
                    value={newKB.urls}
                    onChange={(e) => setNewKB((prev) => ({ ...prev, urls: e.target.value }))}
                    className="bg-gray-50 border-gray-200 min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Enter URLs to scrape content from. The system will extract text from these pages.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Title</Label>
                    <Input
                      placeholder="FAQ Section"
                      value={newText.title}
                      onChange={(e) => setNewText((prev) => ({ ...prev, title: e.target.value }))}
                      className="bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
                    <Label className="text-gray-700">Content</Label>
                    <Textarea
                      placeholder="Enter your content here..."
                      value={newText.text}
                      onChange={(e) => setNewText((prev) => ({ ...prev, text: e.target.value }))}
                      className="bg-gray-50 border-gray-200 min-h-[120px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTextToList}
                    className="border-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to List
                  </Button>
                  
                  {newKB.texts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-gray-700">Added Texts ({newKB.texts.length})</Label>
                      {newKB.texts.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{t.title}</span>
                            <span className="text-xs text-gray-500">({t.text.length} chars)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTextFromList(i)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !newKB.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Source Modal */}
      <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Add Sources to {selectedKB?.knowledge_base_name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={sourceTab} onValueChange={setSourceTab} className="w-full">
            <TabsList className="bg-gray-100 w-full">
              <TabsTrigger value="url" className="flex-1">
                <Globe className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Text
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Website URLs (one per line)</Label>
                <Textarea
                  placeholder="https://example.com/docs&#10;https://example.com/faq"
                  value={newKB.urls}
                  onChange={(e) => setNewKB((prev) => ({ ...prev, urls: e.target.value }))}
                  className="bg-gray-50 border-gray-200 min-h-[150px] font-mono text-sm"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Title</Label>
                <Input
                  placeholder="Document Title"
                  value={newText.title}
                  onChange={(e) => setNewText((prev) => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Content</Label>
                <Textarea
                  placeholder="Enter your content here..."
                  value={newText.text}
                  onChange={(e) => setNewText((prev) => ({ ...prev, text: e.target.value }))}
                  className="bg-gray-50 border-gray-200 min-h-[150px]"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSourceModal(false)} className="border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={submitAddSource}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900 flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              {selectedKB?.knowledge_base_name}
            </DialogTitle>
          </DialogHeader>
          
          {kbDetails ? (
            <div className="space-y-6 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Knowledge Base ID</p>
                <p className="font-mono text-sm text-gray-900">{kbDetails.knowledge_base_id}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Sources ({kbDetails.knowledge_base_sources?.length || 0})
                </h4>
                
                {kbDetails.knowledge_base_sources?.length > 0 ? (
                  <div className="space-y-3">
                    {kbDetails.knowledge_base_sources.map((source, idx) => (
                      <div key={source.source_id || idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {source.source_url ? (
                              <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
                            ) : (
                              <FileText className="w-5 h-5 text-purple-500 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {source.source_url ? "URL Source" : (source.title || "Text Source")}
                              </p>
                              {source.source_url ? (
                                <a 
                                  href={source.source_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {source.source_url}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {source.content?.substring(0, 200)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSource(kbDetails.knowledge_base_id, source.source_id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
              </Button>
                        </div>
            </div>
                    ))}
                </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No sources added yet</p>
                    <Button
                      variant="outline"
                      className="mt-4 border-gray-200"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleAddSource(selectedKB);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sources
                    </Button>
              </div>
            )}
          </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)} className="border-gray-200">
              Close
            </Button>
            <Button
              onClick={() => {
                setShowDetailsModal(false);
                handleAddSource(selectedKB);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Sources
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
