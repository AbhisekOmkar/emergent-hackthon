import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { useAgentStore } from "../stores/agentStore";
import { toast } from "sonner";

export default function AgentSettings() {
  const { agentId } = useParams();
  const { currentAgent, fetchAgent, updateAgent, deleteAgent } = useAgentStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    greeting_message: "",
    llm_provider: "openai",
    llm_model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 2048,
    stt_provider: "deepgram",
    tts_provider: "elevenlabs",
  });

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId, fetchAgent]);

  useEffect(() => {
    if (currentAgent) {
      setFormData({
        name: currentAgent.name || "",
        description: currentAgent.description || "",
        system_prompt: currentAgent.system_prompt || "",
        greeting_message: currentAgent.greeting_message || "",
        llm_provider: currentAgent.chat_config?.llm_provider || "openai",
        llm_model: currentAgent.chat_config?.llm_model || "gpt-4o",
        temperature: currentAgent.chat_config?.temperature || 0.7,
        max_tokens: currentAgent.chat_config?.max_tokens || 2048,
        stt_provider: currentAgent.voice_config?.stt_provider || "deepgram",
        tts_provider: currentAgent.voice_config?.tts_provider || "elevenlabs",
      });
    }
  }, [currentAgent]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        greeting_message: formData.greeting_message,
        chat_config: {
          llm_provider: formData.llm_provider,
          llm_model: formData.llm_model,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
        },
        voice_config: currentAgent?.type === "voice" || currentAgent?.type === "multi-modal" ? {
          ...currentAgent.voice_config,
          stt_provider: formData.stt_provider,
          tts_provider: formData.tts_provider,
        } : null,
      };

      const result = await updateAgent(agentId, updateData);
      if (result) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Error saving settings");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="agent-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/agents">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-outfit font-semibold text-xl text-white">
              Settings: {currentAgent?.name || "Agent"}
            </h1>
            <p className="text-sm text-zinc-400">Configure your agent settings</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-900">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="persona">Persona</TabsTrigger>
          <TabsTrigger value="llm">LLM Settings</TabsTrigger>
          {(currentAgent?.type === "voice" || currentAgent?.type === "multi-modal") && (
            <TabsTrigger value="voice">Voice</TabsTrigger>
          )}
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription>Basic information about your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Agent Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Greeting Message</Label>
                <Input
                  value={formData.greeting_message}
                  onChange={(e) => handleChange("greeting_message", e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Persona Tab */}
        <TabsContent value="persona">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Agent Persona</CardTitle>
              <CardDescription>Define your agent's personality and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">System Prompt</Label>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) => handleChange("system_prompt", e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-amber-500 min-h-[200px]"
                  placeholder="Define your agent's personality, tone, and instructions..."
                />
                <p className="text-xs text-zinc-500">
                  This prompt defines how your agent behaves and responds to users.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Tab */}
        <TabsContent value="llm">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">LLM Configuration</CardTitle>
              <CardDescription>Configure the language model powering your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Provider</Label>
                  <Select
                    value={formData.llm_provider}
                    onValueChange={(value) => handleChange("llm_provider", value)}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Model</Label>
                  <Select
                    value={formData.llm_model}
                    onValueChange={(value) => handleChange("llm_model", value)}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {formData.llm_provider === "openai" && (
                        <>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                          <SelectItem value="gpt-5.1">GPT-5.1</SelectItem>
                        </>
                      )}
                      {formData.llm_provider === "anthropic" && (
                        <>
                          <SelectItem value="claude-4-sonnet-20250514">Claude 4 Sonnet</SelectItem>
                          <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                        </>
                      )}
                      {formData.llm_provider === "gemini" && (
                        <>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                          <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300">Temperature</Label>
                    <span className="text-sm text-zinc-400">{formData.temperature}</span>
                  </div>
                  <Slider
                    value={[formData.temperature]}
                    onValueChange={([value]) => handleChange("temperature", value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300">Max Tokens</Label>
                    <span className="text-sm text-zinc-400">{formData.max_tokens}</span>
                  </div>
                  <Slider
                    value={[formData.max_tokens]}
                    onValueChange={([value]) => handleChange("max_tokens", value)}
                    min={256}
                    max={4096}
                    step={256}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Voice Configuration</CardTitle>
              <CardDescription>Configure speech-to-text and text-to-speech settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">STT Provider</Label>
                  <Select
                    value={formData.stt_provider}
                    onValueChange={(value) => handleChange("stt_provider", value)}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="assemblyai">AssemblyAI</SelectItem>
                      <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                      <SelectItem value="google">Google Speech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">TTS Provider</Label>
                  <Select
                    value={formData.tts_provider}
                    onValueChange={(value) => handleChange("tts_provider", value)}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="cartesia">Cartesia</SelectItem>
                      <SelectItem value="openai">OpenAI TTS</SelectItem>
                      <SelectItem value="playht">PlayHT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card className="glass-card border-red-500/20">
            <CardHeader>
              <CardTitle className="text-white">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div>
                  <p className="font-medium text-white">Delete Agent</p>
                  <p className="text-sm text-zinc-400">
                    Permanently delete this agent and all its data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this agent?")) {
                      deleteAgent(agentId);
                      window.location.href = "/agents";
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
