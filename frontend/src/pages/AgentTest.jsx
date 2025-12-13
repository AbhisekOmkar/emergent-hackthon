import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, MicOff, Volume2, 
  VolumeX, RefreshCw, Bot, User, Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { useAgentStore } from "../stores/agentStore";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AgentTest() {
  const { agentId } = useParams();
  const { currentAgent, fetchAgent } = useAgentStore();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId, fetchAgent]);

  useEffect(() => {
    // Add greeting message when agent loads
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
    // Scroll to bottom on new messages
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

      {/* Chat Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="glass-card lg:col-span-2 flex flex-col">
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
                {currentAgent?.type === "voice" || currentAgent?.type === "multi-modal" ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className={`border-zinc-700 ${
                      isRecording ? "bg-red-500/20 border-red-500" : ""
                    }`}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                ) : null}
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-zinc-900/50 border-zinc-800 focus:border-amber-500"
                  data-testid="chat-input"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || loading}
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
