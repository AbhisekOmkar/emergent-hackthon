import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Mic, Bot, Upload, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAgentStore } from "../../stores/agentStore";
import { toast } from "sonner";

const agentTypes = [
  { id: "chat", label: "Chat", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "voice", label: "Voice", icon: Mic, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "multi-modal", label: "Multi-modal", icon: Bot, color: "text-indigo-600", bg: "bg-indigo-100" },
];

const llmProviders = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-5.1"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-4-sonnet-20250514", "claude-3-5-haiku-20241022"] },
  { value: "gemini", label: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"] },
];

const sttProviders = [
  { value: "deepgram", label: "Deepgram" },
  { value: "assemblyai", label: "AssemblyAI" },
  { value: "whisper", label: "OpenAI Whisper" },
  { value: "google", label: "Google Speech" },
];

const ttsProviders = [
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "cartesia", label: "Cartesia" },
  { value: "openai", label: "OpenAI TTS" },
  { value: "playht", label: "PlayHT" },
];

export default function CreateAgentModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { createAgent } = useAgentStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "You are a helpful AI assistant. Be concise, friendly, and professional.",
    greeting_message: "Hello! How can I help you today?",
    llm_provider: "openai",
    llm_model: "gpt-4o",
    stt_provider: "deepgram",
    tts_provider: "elevenlabs",
    tts_voice: "default",
    direction: "inbound",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (field === "llm_provider") {
      const provider = llmProviders.find((p) => p.value === value);
      if (provider) {
        setFormData((prev) => ({ ...prev, llm_model: provider.models[0] }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter an agent name");
      return;
    }

    setLoading(true);
    try {
      const agentData = {
        name: formData.name,
        description: formData.description,
        type: activeTab,
        system_prompt: formData.system_prompt,
        greeting_message: formData.greeting_message,
        chat_config: {
          llm_provider: formData.llm_provider,
          llm_model: formData.llm_model,
          temperature: 0.7,
          max_tokens: 2048,
        },
        voice_config: activeTab === "voice" || activeTab === "multi-modal" ? {
          direction: formData.direction,
          stt_provider: formData.stt_provider,
          tts_provider: formData.tts_provider,
          tts_voice: formData.tts_voice,
          llm_provider: formData.llm_provider,
          llm_model: formData.llm_model,
        } : null,
        tools: [],
        knowledge_bases: [],
      };

      const result = await createAgent(agentData);
      if (result) {
        toast.success("Agent created successfully!");
        onClose();
        navigate(`/agents/${result.id}/test`);
      } else {
        toast.error("Failed to create agent");
      }
    } catch (error) {
      toast.error("Error creating agent");
    }
    setLoading(false);
  };

  const selectedProvider = llmProviders.find((p) => p.value === formData.llm_provider);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white border-gray-200 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Create new agent
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-6">
          {/* Agent Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
              {agentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <TabsTrigger
                    key={type.id}
                    value={type.id}
                    data-testid={`tab-${type.id}`}
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    <Icon className={`w-4 h-4 ${activeTab === type.id ? type.color : 'text-gray-500'}`} />
                    {type.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Form Content */}
            <div className="mt-6 space-y-4">
              {/* Name & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Name</Label>
                  <Input
                    placeholder="My AI Agent"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="bg-white border-gray-200"
                    data-testid="agent-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Description</Label>
                  <Input
                    placeholder="Agent description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>

              {/* LLM Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">LLM Provider</Label>
                  <Select
                    value={formData.llm_provider}
                    onValueChange={(value) => handleChange("llm_provider", value)}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {llmProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Model</Label>
                  <Select
                    value={formData.llm_model}
                    onValueChange={(value) => handleChange("llm_model", value)}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {selectedProvider?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice-specific options */}
              {(activeTab === "voice" || activeTab === "multi-modal") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">STT Provider</Label>
                    <Select
                      value={formData.stt_provider}
                      onValueChange={(value) => handleChange("stt_provider", value)}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {sttProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">TTS Provider</Label>
                    <Select
                      value={formData.tts_provider}
                      onValueChange={(value) => handleChange("tts_provider", value)}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {ttsProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* System Prompt */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">System Prompt</Label>
                <Textarea
                  placeholder="Define your agent's personality and instructions..."
                  value={formData.system_prompt}
                  onChange={(e) => handleChange("system_prompt", e.target.value)}
                  className="bg-white border-gray-200 min-h-[100px]"
                  data-testid="system-prompt-input"
                />
              </div>

              {/* Training Documents */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Add training documents</Label>
                <p className="text-xs text-gray-500">Attach files to give your agent business context</p>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Drag files here or click to browse
                  </p>
                </div>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8"
            data-testid="create-agent-submit"
          >
            {loading ? "Creating..." : "Create agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
