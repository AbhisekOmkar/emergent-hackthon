import { useEffect, useState } from "react";
import { 
  Plus, Database, FileText, Upload, Trash2, Search, 
  FolderOpen, File, FileType, BookOpen, MoreVertical,
  Eye, Download, X, CheckCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const typeIcons = {
  documents: FileText,
  website: BookOpen,
  api: Database,
};

const typeColors = {
  documents: { bg: "bg-blue-100", icon: "text-blue-600", border: "border-blue-200" },
  website: { bg: "bg-purple-100", icon: "text-purple-600", border: "border-purple-200" },
  api: { bg: "bg-green-100", icon: "text-green-600", border: "border-green-200" },
};

export default function Knowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newKB, setNewKB] = useState({ name: "", description: "", type: "documents" });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await axios.get(`${API}/knowledge`);
      setKnowledgeBases(response.data);
    } catch (error) {
      console.error("Failed to fetch knowledge bases:", error);
    }
  };

  const handleCreate = async () => {
    if (!newKB.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/knowledge`, newKB);
      setKnowledgeBases((prev) => [...prev, response.data]);
      toast.success("Knowledge base created!");
      setShowCreateModal(false);
      setNewKB({ name: "", description: "", type: "documents" });
    } catch (error) {
      toast.error("Failed to create knowledge base");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this knowledge base?")) return;
    try {
      await axios.delete(`${API}/knowledge/${id}`);
      setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== id));
      toast.success("Knowledge base deleted");
    } catch (error) {
      toast.error("Failed to delete knowledge base");
    }
  };

  const handleUpload = (kb) => {
    setSelectedKB(kb);
    setShowUploadModal(true);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Simulate upload
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          toast.success("File uploaded successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const filteredKBs = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kb.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="knowledge-page" className="min-h-screen">
      {/* Header */}
      <div className="content-header px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Knowledge Base</h1>
              <p className="text-gray-600 text-sm">Upload documents and data to train your agents</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-11 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </Button>
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
          <Card className="stat-card">
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
          <Card className="stat-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
                <File className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {knowledgeBases.reduce((acc, kb) => acc + (kb.documents_count || 0), 0)}
                </p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {knowledgeBases.filter(kb => (kb.documents_count || 0) > 0).length}
                </p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Bases</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Bases Grid */}
        {filteredKBs.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-20 text-center fade-in">
              <div className="empty-state-image max-w-lg mx-auto mb-8">
                <img 
                  src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=800&h=500&fit=crop" 
                  alt="AI Knowledge" 
                  className="w-full h-80 object-cover rounded-2xl opacity-60"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No knowledge bases yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create a knowledge base and upload documents to train your agents with custom information
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
              const Icon = typeIcons[kb.type] || FileText;
              const colors = typeColors[kb.type] || typeColors.documents;
              return (
                <Card key={kb.id} className="glass-card card-hover group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
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
                          <DropdownMenuItem onClick={() => handleUpload(kb)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Files
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-100" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(kb.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{kb.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {kb.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className={`${colors.border} ${colors.icon.replace('text-', 'bg-').replace('600', '50')}`}>
                        {kb.type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {kb.documents_count || 0} documents
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => handleUpload(kb)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
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
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Create Knowledge Base
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Name</Label>
              <Input
                placeholder="Product Documentation"
                value={newKB.name}
                onChange={(e) => setNewKB((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-gray-50 border-gray-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea
                placeholder="Documentation for products and features"
                value={newKB.description}
                onChange={(e) => setNewKB((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-gray-50 border-gray-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Type</Label>
              <Select
                value={newKB.type}
                onValueChange={(value) => setNewKB((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="documents">Documents (PDF, TXT, DOCX)</SelectItem>
                  <SelectItem value="website">Website / URLs</SelectItem>
                  <SelectItem value="api">API / Database</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Upload to {selectedKB?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Drag and drop files here</p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <Button variant="outline" className="border-gray-200">
                Browse Files
              </Button>
              <p className="text-xs text-gray-400 mt-4">Supported: PDF, TXT, DOCX, MD (max 10MB)</p>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} className="border-gray-200">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
