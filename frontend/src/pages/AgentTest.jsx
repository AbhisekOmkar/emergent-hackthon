import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, MicOff, Volume2, 
  VolumeX, RefreshCw, Bot, User, Loader2, Phone
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { useAgentStore } from "../stores/agentStore";
import axios from "axios";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import "@livekit/components-styles";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function SimpleVoiceVisualizer() {
  const { state, audioTrack } = useVoiceAssistant();
  return (
    <div className="h-16 flex items-center justify-center gap-1">
      <BarVisualizer
        state={state}
        barCount={5}
        trackRef={audioTrack}
        className="h-full w-32"
        options={{ minHeight: 10, maxHeight: 40 }}
      />
    </div>
  );
}

function ControlSection({ isRecording, onToggleMic, onDisconnect }) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        className={`border-zinc-700 h-12 w-12 rounded-full ${
          isMicrophoneEnabled ? "bg-red-500/20 border-red-500 text-red-500" : ""
        }`}
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
      >
        {isMicrophoneEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>
      <Button
        variant="destructive"
        className="rounded-full px-6"
        onClick={onDisconnect}
      >
        <Phone className="w-4 h-4 mr-2" />
        End Call
      </Button>
    </div>
  );
}

export default function AgentTest() {
  const { agentId } = useParams();
  const { currentAgent, fetchAgent } = useAgentStore();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef(null);

  // LiveKit State
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);

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
      setIsVoiceActive(false);
      setToken("");
      return;
    }

    try {
      const roomName = `room-${agentId}-${Math.random().toString(36).substring(7)}`;
      const participantName = "user-" + Math.random().toString(36).substring(7);
      
      const { data } = await axios.post(`${API}/token?room=${roomName}&participant=${participantName}`);
      
      setToken(data.token);
      setServerUrl(data.serverUrl);
      setIsVoiceActive(true);
    } catch (error) {
      console.error("Failed to get token", error);
      alert("Failed to connect to voice server. Please check your configuration.");
    }
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId(null);
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

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col" data-testid="agent-test">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/agents">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-semibold text-xl text-white">
                Test: {currentAgent?.name || "Agent"}
              </h1>
              {currentAgent && (
                <Badge 
                  variant="outline"
                  className={
                    currentAgent.type === 'voice' ? 'badge-voice' :
                    currentAgent.type === 'chat' ? 'badge-chat' : 'badge-multimodal'
                  }
                >
                  {currentAgent.type}
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-400">Chat playground to test your agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-700"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            className="border-zinc-700"
            onClick={handleReset}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="glass-card lg:col-span-2 flex flex-col overflow-hidden relative">
          {isVoiceActive ? (
            <div className="absolute inset-0 z-10 bg-zinc-950/95 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
              <LiveKitRoom
                video={false}
                audio={true}
                token={token}
                serverUrl={serverUrl}
                data-lk-theme="default"
                className="flex flex-col items-center justify-center gap-8 w-full"
                onDisconnected={() => setIsVoiceActive(false)}
              >
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-600/20 flex items-center justify-center animate-pulse">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white border-green-400">Live</Badge>
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium text-white">Voice Session Active</h3>
                  <p className="text-zinc-400">Listening to you...</p>
                </div>

                <SimpleVoiceVisualizer />
                <RoomAudioRenderer />
                <ControlSection 
                  onDisconnect={() => setIsVoiceActive(false)} 
                />
              </LiveKitRoom>
            </div>
          ) : null}

          <CardContent className="flex-1 flex flex-col p-0">
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
                          ? "bg-amber-500"
                          : "bg-zinc-700"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-black" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === "user"
                          ? "chat-bubble-user"
                          : message.isError
                          ? "bg-red-500/20 border border-red-500/30 text-red-300"
                          : "chat-bubble-agent text-white"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-[10px] mt-1 opacity-60">
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
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="chat-bubble-agent px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span className="text-sm text-zinc-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className={`border-zinc-700 ${
                    isVoiceActive ? "bg-green-500/20 border-green-500 text-green-500 hover:text-green-400" : ""
                  }`}
                  onClick={handleVoiceToggle}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  data-testid="chat-input"
                  disabled={isVoiceActive}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || loading || isVoiceActive}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  data-testid="send-message-btn"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Info Panel */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-white">Agent Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentAgent ? (
              <>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Type</p>
                  <Badge 
                    variant="outline"
                    className={
                      currentAgent.type === 'voice' ? 'badge-voice' :
                      currentAgent.type === 'chat' ? 'badge-chat' : 'badge-multimodal'
                    }
                  >
                    {currentAgent.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                  <Badge 
                    variant="outline"
                    className={
                      currentAgent.status === 'active' ? 'status-active' :
                      currentAgent.status === 'paused' ? 'status-paused' : 'status-draft'
                    }
                  >
                    {currentAgent.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">LLM</p>
                  <p className="text-sm text-white">
                    {currentAgent.chat_config?.llm_provider} / {currentAgent.chat_config?.llm_model}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">System Prompt</p>
                  <p className="text-sm text-zinc-400 line-clamp-4">
                    {currentAgent.system_prompt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Session</p>
                  <code className="text-xs text-amber-400 font-mono">
                    {sessionId ? sessionId.slice(0, 8) + "..." : "New session"}
                  </code>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Loading agent...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
