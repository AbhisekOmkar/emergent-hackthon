import { useState } from "react";
import { Code2, Globe, X, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToolStore } from "../../stores/agentStore";
import { toast } from "sonner";

export default function CreateToolModal({ isOpen, onClose }) {
  const { createTool } = useToolStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "http",
    http_url: "",
    http_method: "POST",
    http_headers: "",
    http_body_template: "",
    http_response_path: "",
    parameters: [],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addParameter = () => {
    setFormData((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { name: "", type: "string", description: "", required: false },
      ],
    }));
  };

  const removeParameter = (index) => {
    setFormData((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const updateParameter = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      parameters: prev.parameters.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a tool name");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);
    try {
      const toolData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: "custom",
        config: {
          url: formData.http_url,
          method: formData.http_method,
          headers: formData.http_headers ? JSON.parse(formData.http_headers) : {},
          body_template: formData.http_body_template,
          response_path: formData.http_response_path,
        },
        parameters: formData.parameters,
      };

      const result = await createTool(toolData);
      if (result) {
        toast.success("Tool created successfully!");
        onClose();
        setFormData({
          name: "",
          description: "",
          type: "http",
          http_url: "",
          http_method: "POST",
          http_headers: "",
          http_body_template: "",
          http_response_path: "",
          parameters: [],
        });
      } else {
        toast.error("Failed to create tool");
      }
    } catch (error) {
      toast.error("Error creating tool");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#0F0F12] border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl text-white">
            Create Custom Tool
          </DialogTitle>
          <DialogDescription>
            Create a tool that your AI agents can use during conversations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Tool Name</Label>
              <Input
                placeholder="lookup_inventory"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
              />
              <p className="text-xs text-zinc-500">Use snake_case</p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="http">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      HTTP/API Call
                    </div>
                  </SelectItem>
                  <SelectItem value="code">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      Custom Code
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Description</Label>
            <Textarea
              placeholder="Describe what this tool does. The AI will use this description to decide when to use the tool."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
            />
          </div>

          {/* HTTP Configuration */}
          {formData.type === "http" && (
            <div className="space-y-4 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800">
              <h4 className="font-medium text-white">HTTP Configuration</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Method</Label>
                  <Select
                    value={formData.http_method}
                    onValueChange={(value) => handleChange("http_method", value)}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label className="text-zinc-300">URL</Label>
                  <Input
                    placeholder="https://api.example.com/endpoint"
                    value={formData.http_url}
                    onChange={(e) => handleChange("http_url", e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Headers (JSON)</Label>
                <Textarea
                  placeholder='{"Authorization": "Bearer {{API_KEY}}", "Content-Type": "application/json"}'
                  value={formData.http_headers}
                  onChange={(e) => handleChange("http_headers", e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Body Template (JSON)</Label>
                <Textarea
                  placeholder='{"query": "{{search_term}}", "limit": 10}'
                  value={formData.http_body_template}
                  onChange={(e) => handleChange("http_body_template", e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500 font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Use {"{{param_name}}"} for dynamic parameters
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Response Path</Label>
                <Input
                  placeholder="data.results"
                  value={formData.http_response_path}
                  onChange={(e) => handleChange("http_response_path", e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                />
                <p className="text-xs text-zinc-500">JSON path to extract from response</p>
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="space-y-4 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">Parameters</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParameter}
                className="border-zinc-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.parameters.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                No parameters defined. Click "Add" to add inputs for this tool.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.parameters.map((param, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-3 bg-zinc-800/30 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        placeholder="param_name"
                        value={param.name}
                        onChange={(e) => updateParameter(index, "name", e.target.value)}
                        className="bg-zinc-900/50 border-zinc-700"
                      />
                      <Select
                        value={param.type}
                        onValueChange={(value) => updateParameter(index, "type", value)}
                      >
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="col-span-2 bg-zinc-900/50 border-zinc-700"
                        placeholder="Description"
                        value={param.description}
                        onChange={(e) => updateParameter(index, "description", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {loading ? "Creating..." : "Create Tool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
