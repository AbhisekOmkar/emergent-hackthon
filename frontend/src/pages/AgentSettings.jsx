import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Database, Check, X, RefreshCw, BookOpen, Play, Pause, Volume2 } from "lucide-react";
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
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

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
    voice_id: "11labs-Adrian",
  });
  
  // Knowledge Base state
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKBs, setSelectedKBs] = useState([]);
  const [loadingKBs, setLoadingKBs] = useState(false);
  const [attachingKBs, setAttachingKBs] = useState(false);
  
  // Voice platform linking state
  const [cloudAgents, setCloudAgents] = useState([]);
  const [selectedCloudAgent, setSelectedCloudAgent] = useState("");
  const [linkingAgent, setLinkingAgent] = useState(false);
  
  // Voice selection state
  const [availableVoices, setAvailableVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId, fetchAgent]);

  // Fetch knowledge bases
  useEffect(() => {
    fetchKnowledgeBases();
    fetchAvailableVoices();
  }, []);

  // Update selected KBs when agent loads
  useEffect(() => {
    if (currentAgent?.knowledge_base_ids) {
      setSelectedKBs(currentAgent.knowledge_base_ids);
    }
    if (currentAgent?.voice_config?.voice_id) {
      setSelectedVoiceId(currentAgent.voice_config.voice_id);
    }
  }, [currentAgent]);

  const fetchKnowledgeBases = async () => {
    setLoadingKBs(true);
    try {
      const response = await axios.get(`${API_URL}/api/retell/knowledge-bases`);
      setKnowledgeBases(response.data || []);
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      toast.error("Failed to fetch knowledge bases");
    }
    setLoadingKBs(false);
  };

  const fetchAvailableVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await axios.get(`${API_URL}/api/retell/voices`);
      setAvailableVoices(response.data || []);
    } catch (error) {
      console.error("Error fetching voices:", error);
      // Don't show error toast for voices - they might not have API key configured
    }
    setLoadingVoices(false);
  };

  const playVoicePreview = (voice) => {
    if (playingVoiceId === voice.voice_id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
    } else {
      // Start playing new voice
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (voice.preview_audio_url) {
        const audio = new Audio(voice.preview_audio_url);
        audioRef.current = audio;
        audio.play();
        setPlayingVoiceId(voice.voice_id);
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => {
          setPlayingVoiceId(null);
          toast.error("Failed to play voice preview");
        };
      } else {
        toast.error("No preview available for this voice");
      }
    }
  };

  const selectVoice = (voiceId) => {
    setSelectedVoiceId(voiceId);
    handleChange("voice_id", voiceId);
  };

  const toggleKB = (kbId) => {
    setSelectedKBs(prev => 
      prev.includes(kbId) 
        ? prev.filter(id => id !== kbId)
        : [...prev, kbId]
    );
  };

  const handleAttachKBs = async () => {
    if (!currentAgent?.retell_agent_id) {
      toast.error("Agent must be synced with voice platform first. Test the agent to create the connection.");
      return;
    }
    
    setAttachingKBs(true);
    try {
      await axios.post(
        `${API_URL}/api/retell/agents/${currentAgent.retell_agent_id}/attach-knowledge-base`,
        selectedKBs
      );
      
      // Update local agent with selected KBs
      await updateAgent(agentId, { knowledge_base_ids: selectedKBs });
      
      toast.success(`Successfully attached ${selectedKBs.length} knowledge base(s)`);
    } catch (error) {
      console.error("Error attaching knowledge bases:", error);
      const errorDetail = error.response?.data?.detail;
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : 
        (Array.isArray(errorDetail) ? errorDetail.map(e => e.msg).join(', ') : "Failed to attach knowledge bases");
      toast.error(errorMsg);
    }
    setAttachingKBs(false);
  };

  // Fetch cloud agents for linking
  const fetchCloudAgents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/retell/agents`);
      setCloudAgents(response.data || []);
    } catch (error) {
      console.error("Error fetching cloud agents:", error);
    }
  };

  // Link platform agent to existing cloud agent
  const handleLinkAgent = async () => {
    if (!selectedCloudAgent) {
      toast.error("Please select a cloud agent to link");
      return;
    }
    
    setLinkingAgent(true);
    try {
      await updateAgent(agentId, { retell_agent_id: selectedCloudAgent });
      await fetchAgent(agentId); // Refresh agent data
      toast.success("Successfully linked to cloud agent!");
      setSelectedCloudAgent("");
    } catch (error) {
      console.error("Error linking agent:", error);
      toast.error("Failed to link agent");
    }
    setLinkingAgent(false);
  };

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
        voice_id: currentAgent.voice_config?.voice_id || "11labs-Adrian",
      });
      setSelectedVoiceId(currentAgent.voice_config?.voice_id || "11labs-Adrian");
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
          voice_id: selectedVoiceId || formData.voice_id,
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
    <div className="min-h-screen bg-gray-50" data-testid="agent-settings">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/agents">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-xl text-gray-900">
                Settings: {currentAgent?.name || "Agent"}
              </h1>
              <p className="text-sm text-gray-500">Configure your agent settings</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-5xl mx-auto p-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="general" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md px-4">General</TabsTrigger>
            <TabsTrigger value="persona" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md px-4">Persona</TabsTrigger>
            <TabsTrigger value="llm" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md px-4">LLM Settings</TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md px-4">
              <Database className="w-4 h-4 mr-2" />
              Knowledge
            </TabsTrigger>
            {(currentAgent?.type === "voice" || currentAgent?.type === "multi-modal") && (
              <TabsTrigger value="voice" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md px-4">Voice</TabsTrigger>
            )}
            <TabsTrigger value="advanced" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md px-4">Advanced</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">General Settings</CardTitle>
                <CardDescription className="text-gray-500">Basic information about your agent</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Agent Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Greeting Message</Label>
                  <Input
                    value={formData.greeting_message}
                    onChange={(e) => handleChange("greeting_message", e.target.value)}
                    className="bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Persona Tab */}
          <TabsContent value="persona">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Agent Persona</CardTitle>
                <CardDescription className="text-gray-500">Define your agent's personality and behavior</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">System Prompt</Label>
                  <Textarea
                    value={formData.system_prompt}
                    onChange={(e) => handleChange("system_prompt", e.target.value)}
                    className="bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 min-h-[200px]"
                    placeholder="Define your agent's personality, tone, and instructions..."
                  />
                  <p className="text-xs text-gray-500">
                    This prompt defines how your agent behaves and responds to users.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Tab */}
          <TabsContent value="llm">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">LLM Configuration</CardTitle>
                <CardDescription className="text-gray-500">Configure the language model powering your agent</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Provider</Label>
                    <Select
                      value={formData.llm_provider}
                      onValueChange={(value) => handleChange("llm_provider", value)}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Model</Label>
                    <Select
                      value={formData.llm_model}
                      onValueChange={(value) => handleChange("llm_model", value)}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
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
                      <Label className="text-gray-700">Temperature</Label>
                      <span className="text-sm text-gray-500">{formData.temperature}</span>
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
                      <Label className="text-gray-700">Max Tokens</Label>
                      <span className="text-sm text-gray-500">{formData.max_tokens}</span>
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

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Knowledge Base Integration
                    </CardTitle>
                    <CardDescription className="text-gray-500 mt-1">
                      Attach knowledge bases to enable RAG (Retrieval-Augmented Generation) for your agent
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchKnowledgeBases}
                      disabled={loadingKBs}
                      className="border-gray-200"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loadingKBs ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Link to="/knowledge">
                      <Button variant="outline" size="sm" className="border-gray-200">
                        Manage Knowledge Bases
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!currentAgent?.retell_agent_id && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Note:</strong> To attach knowledge bases, your agent must first be connected to the voice platform.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Option 1: Test to create */}
                      <Link to={`/agents/${agentId}/test`} className="flex-1">
                        <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100">
                          Go to Test Page
                        </Button>
                      </Link>
                      
                      {/* Option 2: Link existing */}
                      <div className="flex-1 flex gap-2">
                        <Select
                          value={selectedCloudAgent}
                          onValueChange={setSelectedCloudAgent}
                          onOpenChange={(open) => open && fetchCloudAgents()}
                        >
                          <SelectTrigger className="bg-white border-gray-200 flex-1">
                            <SelectValue placeholder="Link existing agent..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {cloudAgents.length === 0 ? (
                              <SelectItem value="_none" disabled>No agents found</SelectItem>
                            ) : (
                              cloudAgents.map((agent) => (
                                <SelectItem key={agent.agent_id} value={agent.agent_id}>
                                  {agent.agent_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleLinkAgent}
                          disabled={!selectedCloudAgent || linkingAgent}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {linkingAgent ? "Linking..." : "Link"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentAgent?.retell_agent_id && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 text-sm">
                      Connected to voice platform (ID: {currentAgent.retell_agent_id.slice(-8)})
                    </span>
                  </div>
                )}
                
                {loadingKBs ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : knowledgeBases.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No knowledge bases found</p>
                    <Link to="/knowledge">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Create Knowledge Base
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {knowledgeBases.map((kb) => {
                        const isSelected = selectedKBs.includes(kb.knowledge_base_id);
                        const sourcesCount = kb.knowledge_base_sources?.length || 0;
                        
                        return (
                          <div
                            key={kb.knowledge_base_id}
                            onClick={() => toggleKB(kb.knowledge_base_id)}
                            className={`
                              p-4 rounded-lg border-2 cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">
                                    {kb.knowledge_base_name}
                                  </h4>
                                  {kb.status === "in_progress" && (
                                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                      Processing
                                    </span>
                                  )}
                                  {kb.status === "complete" && (
                                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                      Ready
                                    </span>
                                  )}
                                  {kb.status === "error" && (
                                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                      Error
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {sourcesCount} source{sourcesCount !== 1 ? 's' : ''} • ID: {kb.knowledge_base_id.slice(-8)}
                                </p>
                              </div>
                              <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${isSelected 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300'
                                }
                              `}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {selectedKBs.length} knowledge base{selectedKBs.length !== 1 ? 's' : ''} selected
                      </p>
                      <Button
                        onClick={handleAttachKBs}
                        disabled={attachingKBs || !currentAgent?.retell_agent_id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {attachingKBs ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Attaching...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Attach Selected
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Voice Configuration</CardTitle>
                <CardDescription className="text-gray-500">Configure speech-to-text and text-to-speech settings</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">STT Provider</Label>
                    <Select
                      value={formData.stt_provider}
                      onValueChange={(value) => handleChange("stt_provider", value)}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="deepgram">Deepgram</SelectItem>
                        <SelectItem value="assemblyai">AssemblyAI</SelectItem>
                        <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                        <SelectItem value="google">Google Speech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">TTS Provider</Label>
                    <Select
                      value={formData.tts_provider}
                      onValueChange={(value) => handleChange("tts_provider", value)}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="cartesia">Cartesia</SelectItem>
                        <SelectItem value="openai">OpenAI TTS</SelectItem>
                        <SelectItem value="playht">PlayHT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Voice Selection Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 font-medium">Select Voice</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchAvailableVoices}
                      disabled={loadingVoices}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loadingVoices ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {loadingVoices ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span className="ml-2 text-gray-500">Loading voices...</span>
                    </div>
                  ) : availableVoices.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <Volume2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No voices available</p>
                      <p className="text-gray-400 text-xs mt-1">Make sure your Retell API key is configured</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {availableVoices.map((voice) => (
                        <div
                          key={voice.voice_id}
                          onClick={() => selectVoice(voice.voice_id)}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            selectedVoiceId === voice.voice_id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {selectedVoiceId === voice.voice_id && (
                            <div className="absolute top-2 right-2">
                              <Check className="w-5 h-5 text-indigo-600" />
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              voice.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                            }`}>
                              <Volume2 className={`w-5 h-5 ${
                                voice.gender === 'male' ? 'text-blue-600' : 'text-pink-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{voice.voice_name}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {voice.provider}
                                </span>
                                {voice.gender && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    voice.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                  }`}>
                                    {voice.gender}
                                  </span>
                                )}
                                {voice.accent && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                    {voice.accent}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {voice.preview_audio_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice);
                              }}
                              className="mt-3 w-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              {playingVoiceId === voice.voice_id ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Stop Preview
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Play Preview
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedVoiceId && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected voice: <span className="font-medium text-gray-700">{selectedVoiceId}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card className="bg-white border-red-100 shadow-sm">
              <CardHeader className="border-b border-red-100">
                <CardTitle className="text-gray-900">Danger Zone</CardTitle>
                <CardDescription className="text-gray-500">Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
                  <div>
                    <p className="font-medium text-gray-900">Delete Agent</p>
                    <p className="text-sm text-gray-500">
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
    </div>
  );
}
