import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, MicOff, Volume2, 
  VolumeX, RefreshCw, Bot, User, Loader2, Phone, PhoneOff,
  MessageSquare, Copy, Download, Clock
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { useAgentStore } from "../stores/agentStore";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Voice SDK will be loaded dynamically
let VoiceSDK = null;

export default function AgentTest() {
  const { agentId } = useParams();
  const { currentAgent, fetchAgent } = useAgentStore();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef(null);
  const transcriptRef = useRef(null);

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceClient, setVoiceClient] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, ended
  const [isMicMuted, setIsMicMuted] = useState(false);
  
  // Live Transcript State
  const [liveTranscript, setLiveTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId, fetchAgent]);

  useEffect(() => {
    if (currentAgent && messages.length === 0) {
      setMessages([
        {
          role: "agent",
          content: currentAgent.greeting_message || "Hello! How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [currentAgent, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  // Load Voice SDK dynamically
  useEffect(() => {
    const loadVoiceSDK = async () => {
      if (!VoiceSDK) {
        try {
          const module = await import("retell-client-js-sdk");
          VoiceSDK = module.RetellWebClient;
        } catch (error) {
          console.log("Voice SDK not installed. Voice features may not work.");
        }
      }
    };
    loadVoiceSDK();
  }, []);

  // Call duration timer
  useEffect(() => {
    if (isVoiceActive && callStatus === "active") {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isVoiceActive, callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        agent_id: agentId,
        message: inputValue,
        session_id: sessionId,
        history: messages.map((m) => ({ role: m.role === "agent" ? "assistant" : m.role, content: m.content })),
      });

      const agentMessage = {
        role: "agent",
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
      setSessionId(response.data.session_id);
    } catch (error) {
      const errorMessage = {
        role: "agent",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = async () => {
    if (isVoiceActive) {
      // End the call
      if (voiceClient) {
        voiceClient.stopCall();
        setVoiceClient(null);
      }
      setIsVoiceActive(false);
      setCallStatus("idle");
      return;
    }

    setIsConnecting(true);
    setCallStatus("connecting");
    setLiveTranscript([]);
    setCallDuration(0);

    try {
      let voiceAgentId = currentAgent?.retell_agent_id;

      // If no voice agent configured, create one automatically
      if (!voiceAgentId) {
        console.log("Creating voice agent for this platform agent...");
        
        // Create voice agent using platform agent's settings
        const createResponse = await axios.post(`${API}/retell/agents`, {
          agent_name: currentAgent.name,
          system_prompt: currentAgent.system_prompt || "You are a helpful assistant.",
          voice_id: currentAgent.voice_config?.voice_id || "11labs-Adrian",
          language: currentAgent.voice_config?.language || "en-US",
        });

        voiceAgentId = createResponse.data.agent_id;
        console.log("Created voice agent:", voiceAgentId);

        // Update platform agent with voice agent ID
        await axios.put(`${API}/agents/${agentId}`, {
          retell_agent_id: voiceAgentId,
        });

        // Refresh agent data
        await fetchAgent(agentId);
      }

      // Create a web call via backend
      const { data } = await axios.post(`${API}/retell/agents/${voiceAgentId}/web-call`);
      
      if (!VoiceSDK) {
        throw new Error("Voice SDK not loaded. Please install the voice SDK package.");
      }

      // Initialize voice client
      const client = new VoiceSDK();
      
      // Set up event handlers
      client.on("call_started", () => {
        console.log("Call started");
        setCallStatus("active");
        setIsVoiceActive(true);
        setLiveTranscript(prev => [...prev, {
          role: "system",
          content: "Call connected",
          timestamp: Date.now()
        }]);
      });

      client.on("call_ended", () => {
        console.log("Call ended");
        setCallStatus("idle");
        setIsVoiceActive(false);
        setVoiceClient(null);
        setLiveTranscript(prev => [...prev, {
          role: "system",
          content: "Call ended",
          timestamp: Date.now()
        }]);
      });

      client.on("agent_start_talking", () => {
        console.log("Agent is talking");
      });

      client.on("agent_stop_talking", () => {
        console.log("Agent stopped talking");
      });

      client.on("error", (error) => {
        console.error("Voice call error:", error);
        setCallStatus("idle");
        setIsVoiceActive(false);
        setVoiceClient(null);
        toast.error("Voice call error: " + error.message);
      });

      client.on("update", (update) => {
        // Handle transcript updates
        if (update.transcript) {
          const transcriptItems = update.transcript;
          if (Array.isArray(transcriptItems) && transcriptItems.length > 0) {
            setLiveTranscript(transcriptItems.map((item, idx) => ({
              role: item.role === "agent" ? "assistant" : "user",
              content: item.content,
              timestamp: Date.now() - (transcriptItems.length - idx) * 1000
            })));
          }
        }
      });

      // Start the call with the access token
      await client.startCall({
        accessToken: data.access_token,
      });

      setVoiceClient(client);
    } catch (error) {
      console.error("Failed to start voice call", error);
      const errorDetail = error.response?.data?.detail;
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : 
        (Array.isArray(errorDetail) ? errorDetail.map(e => e.msg).join(', ') : error.message);
      toast.error("Failed to start voice call: " + errorMsg);
      setCallStatus("idle");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMicToggle = () => {
    if (voiceClient) {
      if (isMicMuted) {
        voiceClient.unmute();
      } else {
        voiceClient.mute();
      }
      setIsMicMuted(!isMicMuted);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId(null);
    setLiveTranscript([]);
    setCallDuration(0);
    if (currentAgent) {
      setMessages([
        {
          role: "agent",
          content: currentAgent.greeting_message || "Hello! How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const copyTranscript = () => {
    const text = liveTranscript
      .filter(t => t.role !== "system")
      .map(t => `[${t.role === "user" ? "You" : "Agent"}]: ${t.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success("Transcript copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="agent-test">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/agents">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-xl text-gray-900">
                  Test: {currentAgent?.name || "Agent"}
                </h1>
                {currentAgent && (
                  <Badge 
                    variant="outline"
                    className={
                      currentAgent.type === 'voice' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      currentAgent.type === 'chat' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      'bg-indigo-100 text-indigo-700 border-indigo-200'
                    }
                  >
                    {currentAgent.type}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">Chat playground to test your agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              className="border-gray-200"
              onClick={handleReset}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat/Voice Area */}
          <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm overflow-hidden relative">
            {/* Voice Call Overlay */}
            {isVoiceActive && (
              <div className="absolute inset-0 z-10 flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1117 0%, #09090b 100%)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Voice Call Active</p>
                      <p className="text-zinc-500 text-sm">{formatDuration(callDuration)}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                    Live
                  </Badge>
                </div>

                {/* Live Transcript */}
                <div className="flex-1 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Live Transcript
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-zinc-500 hover:text-white hover:bg-white/5"
                      onClick={copyTranscript}
                      disabled={liveTranscript.length === 0}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[300px] pr-4" ref={transcriptRef}>
                    {liveTranscript.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">Waiting for conversation...</p>
                        <p className="text-xs mt-1 text-zinc-700">Start speaking to see the transcript</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {liveTranscript.map((item, index) => (
                          <div 
                            key={index} 
                            className={`flex gap-3 ${item.role === "system" ? "justify-center" : item.role === "user" ? "flex-row-reverse" : ""}`}
                          >
                            {item.role === "system" ? (
                              <span className="text-zinc-600 text-xs bg-white/5 px-3 py-1 rounded-full">
                                {item.content}
                              </span>
                            ) : (
                              <>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  item.role === "user" ? "bg-blue-500" : "bg-zinc-700"
                                }`}>
                                  {item.role === "user" ? (
                                    <User className="w-4 h-4 text-white" />
                                  ) : (
                                    <Bot className="w-4 h-4 text-zinc-300" />
                                  )}
                                </div>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                                  item.role === "user" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-zinc-800 text-zinc-200"
                                }`}>
                                  <p className="text-sm">{item.content}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Voice Visualizer */}
                <div className="p-6 flex flex-col items-center border-t border-white/5">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg border border-zinc-700">
                        <Bot className="w-8 h-8 text-zinc-300" />
                      </div>
                    </div>
                    {/* Audio bars animation */}
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-blue-500 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 20 + 8}px`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-14 w-14 rounded-full border ${
                        isMicMuted 
                          ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                          : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                      onClick={handleMicToggle}
                    >
                      {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                    <Button
                      className="h-14 px-8 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleVoiceToggle}
                    >
                      <PhoneOff className="w-5 h-5 mr-2" />
                      End Call
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="flex-1 flex flex-col p-0 h-[600px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-blue-500"
                            : "bg-gray-200"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : message.isError
                            ? "bg-red-50 border border-red-100 text-red-600"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          message.role === "user" ? "text-blue-100" : "text-gray-400"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`border-gray-200 ${
                      isVoiceActive 
                        ? "bg-green-100 border-green-300 text-green-600 hover:bg-green-200" 
                        : isConnecting 
                        ? "bg-yellow-100 border-yellow-300 text-yellow-600"
                        : "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600"
                    }`}
                    onClick={handleVoiceToggle}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isVoiceActive ? (
                      <Phone className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                    data-testid="chat-input"
                    disabled={isVoiceActive}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading || isVoiceActive}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="send-message-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Info Panel */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900">Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {currentAgent ? (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Type</p>
                    <Badge 
                      variant="outline"
                      className={
                        currentAgent.type === 'voice' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        currentAgent.type === 'chat' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                        'bg-indigo-100 text-indigo-700 border-indigo-200'
                      }
                    >
                      {currentAgent.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
                    <Badge 
                      variant="outline"
                      className={
                        currentAgent.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                        currentAgent.status === 'paused' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {currentAgent.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Voice Agent</p>
                    <p className="text-sm text-gray-900">
                      {currentAgent.retell_agent_id ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Configured
                        </span>
                      ) : (
                        <span className="text-gray-400">Not configured</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">LLM</p>
                    <p className="text-sm text-gray-900">
                      {currentAgent.chat_config?.llm_provider || "openai"} / {currentAgent.chat_config?.llm_model || "gpt-4o"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">System Prompt</p>
                    <p className="text-sm text-gray-600 line-clamp-4 bg-gray-50 p-3 rounded-lg">
                      {currentAgent.system_prompt}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Session</p>
                    <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-mono">
                      {sessionId ? sessionId.slice(0, 8) + "..." : "New session"}
                    </code>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading agent...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
