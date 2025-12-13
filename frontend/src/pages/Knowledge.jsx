import { useEffect, useState } from "react";
import { Plus, Database, FileText, Upload, Trash2, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Knowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newKB, setNewKB] = useState({ name: "", description: "", type: "documents" });
  const [loading, setLoading] = useState(false);

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

  const filteredKBs = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kb.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="knowledge-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit font-bold text-3xl text-white">Knowledge Base</h1>
          <p className="text-zinc-400 mt-1">Upload documents to train your agents</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Knowledge Base
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Search knowledge bases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
        />
      </div>

      {/* Knowledge Bases Grid */}
      {filteredKBs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Database className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No knowledge bases yet</h3>
            <p className="text-zinc-400 mb-6">
              Create a knowledge base and upload documents to train your agents
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKBs.map((kb) => (
            <Card key={kb.id} className="glass-card card-hover group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Database className="w-6 h-6 text-purple-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400"
                    onClick={() => handleDelete(kb.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-outfit font-semibold text-lg text-white mb-1">{kb.name}</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  {kb.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-zinc-700">
                    {kb.type}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {kb.documents_count || 0} documents
                  </span>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full border-zinc-700 hover:border-amber-500/50">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0F0F12] border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl text-white">
              Create Knowledge Base
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Name</Label>
              <Input
                placeholder="Product Documentation"
                value={newKB.name}
                onChange={(e) => setNewKB((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Input
                placeholder="Documentation for products and features"
                value={newKB.description}
                onChange={(e) => setNewKB((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-zinc-400">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
