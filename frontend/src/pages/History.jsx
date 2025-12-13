import { useEffect, useState, useCallback } from "react";
import { 
  Phone, Play, Pause, Download, Copy, 
  Clock, Calendar, User, Bot, ChevronDown, ChevronUp,
  Search, RefreshCw, Loader2, Volume2, FileText,
  ExternalLink, TrendingUp, CheckCircle, XCircle,
  Smile, Meh, Frown
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useAgentStore } from "../stores/agentStore";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function History() {
  const { agents, fetchAgents } = useAgentStore();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [timeRange, setTimeRange] = useState("30");
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState({});

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        days: timeRange
      });
      
      if (selectedAgent !== "all") {
        params.append("agent_id", selectedAgent);
      }

      const response = await axios.get(`${API}/retell/history?${params}`);
      setCalls(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load call history");
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, timeRange]);

  useEffect(() => {
    fetchAgents();
    fetchHistory();
  }, [fetchAgents, fetchHistory]);

  const formatDuration = (ms) => {
    if (!ms) return "—";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getAgentName = (agentId) => {
    if (!agentId) return "Unknown Agent";
    const agent = agents.find(a => a.retell_agent_id === agentId || a.id === agentId);
    return agent?.name || agentId.slice(0, 8) + "...";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ended: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
      ongoing: { label: "Ongoing", className: "bg-blue-100 text-blue-700 border-blue-200" },
      error: { label: "Error", className: "bg-red-100 text-red-700 border-red-200" },
      registered: { label: "Registered", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    };
    const config = statusConfig[status] || { label: status || "Unknown", className: "bg-gray-100 text-gray-700 border-gray-200" };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return <Smile className="w-4 h-4 text-green-500" />;
      case "negative":
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-gray-400" />;
    }
  };

  const handlePlayRecording = (url, callId) => {
    if (playingAudio === callId) {
      audioElement?.pause();
      setPlayingAudio(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        setPlayingAudio(null);
        setAudioElement(null);
      };
      setPlayingAudio(callId);
      setAudioElement(audio);
    }
  };

  const copyTranscript = (transcript) => {
    if (!transcript || transcript.length === 0) {
      toast.error("No transcript available");
      return;
    }
    
    let text = "";
    if (typeof transcript === "string") {
      text = transcript;
    } else if (Array.isArray(transcript)) {
      text = transcript.map(t => {
        const role = t.role === "agent" ? "Agent" : "User";
        return `${role}: ${t.content || t.text || t.words?.map(w => w.word).join(" ") || ""}`;
      }).join("\n\n");
    }
    
    navigator.clipboard.writeText(text);
    toast.success("Transcript copied to clipboard");
  };

  const toggleTranscriptExpand = (id) => {
    setExpandedTranscripts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredCalls = calls.filter(call => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const agentName = getAgentName(call.agent_id).toLowerCase();
    const transcript = JSON.stringify(call.transcript || []).toLowerCase();
    return agentName.includes(query) || transcript.includes(query);
  });

  const renderTranscript = (transcript, isExpanded = false) => {
    if (!transcript || transcript.length === 0) {
      return <p className="text-gray-400 text-sm italic">No transcript available</p>;
    }

    const items = typeof transcript === "string" 
      ? [{ role: "agent", content: transcript }]
      : transcript;

    const displayItems = isExpanded ? items : items.slice(0, 4);

    return (
      <div className="space-y-3">
        {displayItems.map((item, idx) => {
          const isAgent = item.role === "agent";
          const content = item.content || item.text || item.words?.map(w => w.word).join(" ") || "";
          
          return (
            <div key={idx} className={`flex gap-3 ${isAgent ? "" : "flex-row-reverse"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                isAgent ? "bg-blue-100" : "bg-gray-100"
              }`}>
                {isAgent ? <Bot className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-gray-600" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                isAgent 
                  ? "bg-blue-50 text-gray-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {content}
              </div>
            </div>
          );
        })}
        {!isExpanded && items.length > 4 && (
          <p className="text-xs text-blue-600 cursor-pointer hover:underline text-center">
            +{items.length - 4} more messages
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
          <p className="text-gray-500 mt-1">View call recordings, transcripts, and analytics</p>
        </div>
        <Button
          onClick={fetchHistory}
          variant="outline"
          className="border-gray-200"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{calls.length}</p>
                <p className="text-sm text-gray-500">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(calls.reduce((acc, c) => acc + (c.duration_ms || 0), 0))}
                </p>
                <p className="text-sm text-gray-500">Total Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {calls.filter(c => c.status === "ended").length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {calls.filter(c => c.recording_url).length}
                </p>
                <p className="text-sm text-gray-500">With Recording</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200"
                />
              </div>
            </div>
            
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[180px] border-gray-200">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.filter(a => a.retell_agent_id).map(agent => (
                  <SelectItem key={agent.id} value={agent.retell_agent_id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Call List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredCalls.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No calls found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? "Try adjusting your search or filters"
                : "Start a voice call to see history here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCalls.map((call) => (
            <Card 
              key={call.id} 
              className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedCall(call);
                setShowDetailModal(true);
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">Voice Call</h3>
                        {getStatusBadge(call.status)}
                        {call.call_analysis?.user_sentiment && (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            {getSentimentIcon(call.call_analysis.user_sentiment)}
                            {call.call_analysis.user_sentiment}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5" />
                          {getAgentName(call.agent_id)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(call.start_timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(call.duration_ms)}
                        </span>
                        {call.from_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {call.from_number}
                          </span>
                        )}
                      </div>

                      {/* Preview Transcript */}
                      <div className="bg-gray-50 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
                        {renderTranscript(call.transcript || call.transcript_object, expandedTranscripts[call.id])}
                        {(call.transcript?.length > 4 || call.transcript_object?.length > 4) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTranscriptExpand(call.id);
                            }}
                            className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1"
                          >
                            {expandedTranscripts[call.id] ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                Show full transcript
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {call.recording_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200"
                        onClick={() => handlePlayRecording(call.recording_url, call.id)}
                      >
                        {playingAudio === call.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200"
                      onClick={() => copyTranscript(call.transcript || call.transcript_object)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {call.public_log_url && (
                      <a 
                        href={call.public_log_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="border-gray-200">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xl">Call Details</span>
                <p className="text-sm font-normal text-gray-500">
                  {formatDate(selectedCall?.start_timestamp)}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCall && (
            <div className="space-y-6 mt-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedCall.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {formatDuration(selectedCall.duration_ms)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Agent</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {getAgentName(selectedCall.agent_id)}
                  </p>
                </div>
                {selectedCall.call_analysis?.user_sentiment && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(selectedCall.call_analysis.user_sentiment)}
                      <span className="font-semibold text-gray-900 capitalize">
                        {selectedCall.call_analysis.user_sentiment}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Call Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedCall.call_type && (
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 text-gray-900 capitalize">{selectedCall.call_type}</span>
                    </div>
                  )}
                  {selectedCall.from_number && (
                    <div>
                      <span className="text-gray-500">From:</span>
                      <span className="ml-2 text-gray-900">{selectedCall.from_number}</span>
                    </div>
                  )}
                  {selectedCall.to_number && (
                    <div>
                      <span className="text-gray-500">To:</span>
                      <span className="ml-2 text-gray-900">{selectedCall.to_number}</span>
                    </div>
                  )}
                  {selectedCall.disconnection_reason && (
                    <div>
                      <span className="text-gray-500">Ended:</span>
                      <span className="ml-2 text-gray-900 capitalize">
                        {selectedCall.disconnection_reason.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recording */}
              {selectedCall.recording_url && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Recording
                  </h4>
                  <audio 
                    controls 
                    className="w-full"
                    src={selectedCall.recording_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <div className="mt-2">
                    <a 
                      href={selectedCall.recording_url}
                      download
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Recording
                    </a>
                  </div>
                </div>
              )}

              {/* Call Analysis */}
              {selectedCall.call_analysis && Object.keys(selectedCall.call_analysis).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedCall.call_analysis.call_summary && (
                      <div>
                        <span className="text-gray-500 block mb-1">Summary:</span>
                        <p className="text-gray-900">{selectedCall.call_analysis.call_summary}</p>
                      </div>
                    )}
                    {selectedCall.call_analysis.call_successful !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Successful:</span>
                        {selectedCall.call_analysis.call_successful ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cost */}
              {selectedCall.call_cost && selectedCall.call_cost.combined_cost > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Cost Breakdown</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    ${selectedCall.call_cost.combined_cost?.toFixed(4) || "0.00"}
                  </p>
                </div>
              )}

              {/* Transcript */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transcript
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200"
                    onClick={() => copyTranscript(selectedCall.transcript || selectedCall.transcript_object)}
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {renderTranscript(selectedCall.transcript || selectedCall.transcript_object, true)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
