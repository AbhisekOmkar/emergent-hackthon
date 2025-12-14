import { useEffect, useState, useCallback } from "react";
import {
  FlaskConical, Plus, Play, Pause, Trash2, CheckCircle, XCircle,
  AlertCircle, Clock, RefreshCw, Sparkles, ChevronDown,
  ChevronUp, FileText, Target, Zap, BarChart3, Settings,
  Phone, MessageSquare, Mic, Bot, Volume2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
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
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAgentStore } from "../stores/agentStore";
import { toast } from "sonner";
import axios from "axios";
import { UpgradePrompt } from "../components/UpgradePrompt";
import { useSubscription } from "../context/SubscriptionContext";
// Voice SDK is loaded dynamically when needed

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper to safely extract error message from API responses
const getErrorMessage = (error, defaultMsg = "An error occurred") => {
  const detail = error?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors are arrays of {loc, msg, type}
    return detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return defaultMsg;
};

export default function AgentEval() {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const { agents, fetchAgents } = useAgentStore();
  const [testCases, setTestCases] = useState([]);
  const [batchTests, setBatchTests] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedBatchTest, setSelectedBatchTest] = useState(null);
  const [generatingScenarios, setGeneratingScenarios] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  
  // Voice test state
  const [voiceTests, setVoiceTests] = useState([]);
  const [showVoiceTestModal, setShowVoiceTestModal] = useState(false);
  const [voiceTestMessage, setVoiceTestMessage] = useState("");
  const [startingVoiceTest, setStartingVoiceTest] = useState(false);
  const [playingRecording, setPlayingRecording] = useState(null);
  const [activeVoiceTest, setActiveVoiceTest] = useState(null);
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState("idle"); // idle, connecting, connected, ended
  const [voiceCallTranscript, setVoiceCallTranscript] = useState([]);
  const [voiceClient, setVoiceClient] = useState(null);

  // New test case form
  const [newTestCase, setNewTestCase] = useState({
    name: "",
    description: "",
    scenarios: [{ name: "", user_message: "", expected_topics: "", success_criteria: "" }]
  });

  // Selected test cases for batch run
  const [selectedTestCases, setSelectedTestCases] = useState([]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (selectedAgent) {
      fetchTestCases();
      fetchBatchTests();
      fetchVoiceTests();
    }
  }, [selectedAgent]);

  const fetchVoiceTests = async () => {
    if (!selectedAgent) return;
    try {
      const response = await axios.get(`${API}/retell/voice-tests?agent_id=${selectedAgent}`);
      setVoiceTests(response.data || []);
    } catch (error) {
      console.error("Error fetching voice tests:", error);
    }
  };

  const handleStartVoiceTest = async () => {
    if (!voiceTestMessage.trim()) {
      toast.error("Please enter a test scenario");
      return;
    }

    setStartingVoiceTest(true);
    try {
      const response = await axios.post(
        `${API}/retell/voice-test?agent_id=${selectedAgent}&test_message=${encodeURIComponent(voiceTestMessage)}`
      );
      
      toast.success("Voice test call created!");
      
      // If we got an access token, open the voice test call interface
      if (response.data.access_token) {
        // Open voice test in a new window/modal with the test call
        setActiveVoiceTest({
          ...response.data,
          test_message: voiceTestMessage
        });
        setShowVoiceCallModal(true);
      }
      
      setShowVoiceTestModal(false);
      setVoiceTestMessage("");
      
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start voice test"));
    }
    setStartingVoiceTest(false);
  };

  // Run fully automated tests with AI caller using native simulation
  const handleRunAutomatedTests = async () => {
    const scenarios = voiceTestMessage.split('\n').filter(s => s.trim());
    
    if (scenarios.length === 0) {
      toast.error("Please enter at least one test scenario");
      return;
    }

    setStartingVoiceTest(true);
    try {
      // Use native simulation testing
      const response = await axios.post(`${API}/retell/run-simulation-test`, {
        agent_id: selectedAgent,
        test_scenarios: scenarios
      });
      
      if (response.data.batch_job_id) {
        toast.success(`Started simulation test! AI caller will test ${response.data.test_case_count} scenarios.`);
        
        // Poll for results
        const pollResults = async (jobId, attempts = 0) => {
          if (attempts > 30) return; // Max 5 minutes polling
          
          try {
            const resultResponse = await axios.get(`${API}/retell/simulation-test/${jobId}`);
            if (resultResponse.data.status === "complete") {
              toast.success(`Simulation complete! ✓ ${resultResponse.data.pass_count} passed, ✗ ${resultResponse.data.fail_count} failed`);
              fetchBatchTests();
              return;
            }
          } catch (e) {
            console.log("Polling...");
          }
          
          setTimeout(() => pollResults(jobId, attempts + 1), 10000);
        };
        
        pollResults(response.data.batch_job_id);
      } else {
        toast.success(`Started ${scenarios.length} automated voice tests!`);
      }
      
      setShowVoiceTestModal(false);
      setVoiceTestMessage("");
      
      // Refresh data
      setTimeout(() => fetchVoiceTests(), 2000);
      setTimeout(() => fetchBatchTests(), 2000);
      
    } catch (error) {
      // Fallback to web call based testing
      try {
        const fallbackResponse = await axios.post(`${API}/retell/automated-voice-test`, {
          agent_id: selectedAgent,
          test_scenarios: scenarios
        });
        
        const count = fallbackResponse.data.results?.length || 0;
        toast.success(`Created ${count} test calls. Connect via Test page to record conversations.`, { duration: 5000 });
        setShowVoiceTestModal(false);
        setVoiceTestMessage("");
        
        setTimeout(() => fetchVoiceTests(), 2000);
      } catch (fallbackError) {
        toast.error(getErrorMessage(error, "Failed to start automated tests"));
      }
    }
    setStartingVoiceTest(false);
  };

  const playRecording = (recordingUrl) => {
    if (playingRecording === recordingUrl) {
      setPlayingRecording(null);
    } else {
      setPlayingRecording(recordingUrl);
    }
  };

  // Start the actual voice call connection
  const startVoiceCall = async () => {
    if (!activeVoiceTest?.access_token) {
      toast.error("No access token available");
      return;
    }

    setVoiceCallStatus("connecting");
    setVoiceCallTranscript([]);

    try {
      // Dynamically import Voice SDK
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const client = new RetellWebClient();
      setVoiceClient(client);

      // Set up event listeners
      client.on("call_started", () => {
        setVoiceCallStatus("connected");
        toast.success("Voice test call started!");
      });

      client.on("call_ended", () => {
        setVoiceCallStatus("ended");
        toast.info("Voice test call ended");
        fetchVoiceTests(); // Refresh to get recording
      });

      client.on("agent_start_talking", () => {
        // Agent started speaking
      });

      client.on("agent_stop_talking", () => {
        // Agent stopped speaking
      });

      client.on("update", (update) => {
        // Handle transcript updates
        if (update.transcript) {
          setVoiceCallTranscript(update.transcript);
        }
      });

      client.on("error", (error) => {
        console.error("Voice call error:", error);
        toast.error("Voice call error");
        setVoiceCallStatus("ended");
      });

      // Start the call
      await client.startCall({
        accessToken: activeVoiceTest.access_token,
      });

    } catch (error) {
      console.error("Error starting voice call:", error);
      toast.error("Failed to start voice call");
      setVoiceCallStatus("idle");
    }
  };

  // End the voice call
  const endVoiceCall = () => {
    if (voiceClient) {
      voiceClient.stopCall();
      setVoiceClient(null);
    }
    setVoiceCallStatus("ended");
    fetchVoiceTests();
  };

  // Close voice call modal
  const closeVoiceCallModal = () => {
    if (voiceClient) {
      voiceClient.stopCall();
      setVoiceClient(null);
    }
    setShowVoiceCallModal(false);
    setActiveVoiceTest(null);
    setVoiceCallStatus("idle");
    setVoiceCallTranscript([]);
    fetchVoiceTests();
  };

  const fetchTestCases = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/retell/test-cases?agent_id=${selectedAgent}`);
      setTestCases(response.data || []);
    } catch (error) {
      console.error("Error fetching test cases:", error);
    }
    setLoading(false);
  };

  const fetchBatchTests = async () => {
    if (!selectedAgent) return;
    try {
      const response = await axios.get(`${API}/retell/batch-tests?agent_id=${selectedAgent}`);
      setBatchTests(response.data || []);
    } catch (error) {
      console.error("Error fetching batch tests:", error);
    }
  };

  const handleCreateTestCase = async () => {
    if (!newTestCase.name || !selectedAgent) {
      toast.error("Please provide a name and select an agent");
      return;
    }

    if (newTestCase.scenarios.some(s => !s.user_message)) {
      toast.error("Each scenario must have a user message");
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        agent_id: selectedAgent,
        name: newTestCase.name,
        description: newTestCase.description,
        scenarios: newTestCase.scenarios.map(s => ({
          name: s.name || "Unnamed Scenario",
          user_message: s.user_message,
          expected_topics: s.expected_topics ? s.expected_topics.split(",").map(t => t.trim()) : [],
          success_criteria: s.success_criteria
        }))
      };

      await axios.post(`${API}/retell/test-cases`, requestData);
      toast.success("Test case created successfully!");
      setShowCreateModal(false);
      setNewTestCase({
        name: "",
        description: "",
        scenarios: [{ name: "", user_message: "", expected_topics: "", success_criteria: "" }]
      });
      fetchTestCases();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create test case"));
    }
    setLoading(false);
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;
    try {
      await axios.delete(`${API}/retell/test-cases/${testCaseId}`);
      toast.success("Test case deleted");
      fetchTestCases();
    } catch (error) {
      toast.error("Failed to delete test case");
    }
  };

  const handleRunBatchTest = async () => {
    if (selectedTestCases.length === 0) {
      toast.error("Please select at least one test case");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/retell/batch-tests`, {
        test_case_definition_ids: selectedTestCases,
        agent_id: selectedAgent,
        concurrency: 1
      });
      
      toast.success(`Batch test started with ${response.data.total_count} scenarios!`);
      setShowRunModal(false);
      setSelectedTestCases([]);
      
      // Start polling for results
      pollBatchTestResults(response.data.test_case_batch_job_id);
      fetchBatchTests();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start batch test"));
    }
    setLoading(false);
  };

  const pollBatchTestResults = async (batchJobId) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await axios.get(`${API}/retell/batch-tests/${batchJobId}`);
        if (response.data.status === "complete") {
          toast.success("Batch test completed!");
          fetchBatchTests();
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("Error polling batch test:", error);
      }
    };
    
    setTimeout(poll, 2000);
  };

  const handleGenerateScenarios = async (forVoiceTest = false) => {
    if (!selectedAgent) {
      toast.error("Please select an agent first");
      return;
    }

    setGeneratingScenarios(true);
    try {
      console.log('Generating scenarios for agent:', selectedAgent);
      const response = await axios.post(`${API}/retell/generate-test-scenarios?agent_id=${selectedAgent}&num_scenarios=5`);
      console.log('Generated scenarios response:', response.data);
      
      if (forVoiceTest) {
        // For voice tests, populate the textarea with user messages
        const userMessages = response.data.scenarios.map(s => s.user_message).join('\n');
        setVoiceTestMessage(userMessages);
        toast.success(`Generated ${response.data.scenarios.length} test scenarios for voice testing!`);
      } else {
        // For test case creation form
        const scenarios = response.data.scenarios.map(s => ({
          name: s.name || "",
          user_message: s.user_message || "",
          expected_topics: s.expected_topics?.join(", ") || "",
          success_criteria: s.success_criteria || ""
        }));
        
        console.log('Mapped scenarios:', scenarios);
        
        setNewTestCase(prev => ({
          ...prev,
          name: `Auto-generated tests for ${response.data.agent_name || 'Agent'}`,
          scenarios
        }));
        
        toast.success(`Generated ${scenarios.length} test scenarios!`);
      }
    } catch (error) {
      console.error('Generate scenarios error:', error);
      toast.error(error.response?.data?.detail || "Failed to generate scenarios");
    }
    setGeneratingScenarios(false);
  };

  const addScenario = () => {
    setNewTestCase(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, { name: "", user_message: "", expected_topics: "", success_criteria: "" }]
    }));
  };

  const removeScenario = (index) => {
    setNewTestCase(prev => ({
      ...prev,
      scenarios: prev.scenarios.filter((_, i) => i !== index)
    }));
  };

  const updateScenario = (index, field, value) => {
    setNewTestCase(prev => ({
      ...prev,
      scenarios: prev.scenarios.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const toggleTestCaseSelection = (testCaseId) => {
    setSelectedTestCases(prev =>
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const viewBatchResults = async (batchTest) => {
    try {
      const response = await axios.get(`${API}/retell/batch-tests/${batchTest.id}`);
      setSelectedBatchTest(response.data);
      setShowResultsModal(true);
    } catch (error) {
      toast.error("Failed to load results");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "complete": return "bg-green-100 text-green-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "error": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Get all agents - support both voice and chat
  const voiceAgents = agents.filter(a => a.retell_agent_id);
  const chatAgents = agents.filter(a => !a.retell_agent_id);
  const allAgents = agents;

  // Stats
  const totalTests = batchTests.length;
  const passedTests = batchTests.filter(t => t.status === "complete" && t.pass_rate >= 70).length;
  const avgPassRate = batchTests.length > 0 
    ? (batchTests.reduce((sum, t) => sum + (t.pass_rate || 0), 0) / batchTests.length).toFixed(1)
    : 0;

  // Show upgrade prompt for non-premium users
  if (!subscriptionLoading && !isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <UpgradePrompt 
          title="Upgrade to Unlock Agent Evaluation"
          description="Agent Evaluation is a premium feature. Test and evaluate your agents with automated test cases, batch runs, and voice call testing."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-blue-600" />
            Agent Evaluation
          </h1>
          <p className="text-gray-500 mt-1">Create test cases and evaluate your agents</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[280px] bg-white">
              <SelectValue placeholder="Select an agent to test" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {voiceAgents.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">Voice Agents</div>
                  {voiceAgents.map(agent => (
                    <SelectItem key={`voice-${agent.retell_agent_id}`} value={agent.retell_agent_id}>
                      <span className="flex items-center gap-2">
                        {agent.name}
                        <Badge className="text-[10px] bg-purple-100 text-purple-700">Voice</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {chatAgents.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 mt-1">Chat Agents</div>
                  {chatAgents.map(agent => (
                    <SelectItem key={`chat-${agent.id}`} value={agent.id}>
                      <span className="flex items-center gap-2">
                        {agent.name}
                        <Badge className="text-[10px] bg-blue-100 text-blue-700">Chat</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Test Case
          </Button>
        </div>
      </div>

      {/* Stats */}
      {selectedAgent && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Test Cases</p>
                  <p className="text-2xl font-bold text-gray-900">{testCases.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Test Runs</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
                </div>
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{avgPassRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Passed Runs</p>
                  <p className="text-2xl font-bold text-gray-900">{passedTests}/{totalTests}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedAgent ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-16 text-center">
            <FlaskConical className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Agent</h3>
            <p className="text-gray-500">Choose an agent from the dropdown above to start creating test cases</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="test-cases" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="test-cases" className="data-[state=active]:bg-gray-100">
              <FileText className="w-4 h-4 mr-2" />
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="runs" className="data-[state=active]:bg-gray-100">
              <Zap className="w-4 h-4 mr-2" />
              Test Runs
            </TabsTrigger>
            <TabsTrigger value="voice-tests" className="data-[state=active]:bg-gray-100">
              <Phone className="w-4 h-4 mr-2" />
              Voice Tests
            </TabsTrigger>
          </TabsList>

          {/* Test Cases Tab */}
          <TabsContent value="test-cases">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Test Case Definitions</h2>
              <Button
                variant="outline"
                onClick={() => setShowRunModal(true)}
                disabled={testCases.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Run Batch Test
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : testCases.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases Yet</h3>
                  <p className="text-gray-500 mb-4">Create test cases to evaluate your agent's performance</p>
                  <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Test Case
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {testCases.map(tc => (
                  <Card key={tc.id} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">{tc.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {tc.scenarios?.length || 0} scenarios
                            </Badge>
                          </div>
                          {tc.description && (
                            <p className="text-sm text-gray-500 mt-1">{tc.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Created: {new Date(tc.created_at).toLocaleDateString()}</span>
                            {tc.run_count > 0 && <span>Runs: {tc.run_count}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTestCase(tc.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Voice Tests Tab */}
          <TabsContent value="voice-tests">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Voice Call Tests</h2>
                <p className="text-sm text-gray-500">Make real voice calls and listen to recordings</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchVoiceTests}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setShowVoiceTestModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Automated Tests
                </Button>
              </div>
            </div>

            {voiceTests.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-12 text-center">
                  <Bot className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Automated Tests Yet</h3>
                  <p className="text-gray-500 mb-4">Run automated voice tests where AI caller speaks to your agent</p>
                  <Button 
                    onClick={() => setShowVoiceTestModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run Automated Tests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {voiceTests.map(test => (
                  <Card key={test.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={
                              test.call_status === "ended" ? "bg-green-100 text-green-700" :
                              test.call_status === "ongoing" ? "bg-blue-100 text-blue-700" :
                              test.call_status === "error" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {test.call_status === "ended" ? "✓ Completed" : 
                               test.call_status === "ongoing" ? "🔄 In Progress" : 
                               test.call_status === "error" ? "✗ Expired (Not Connected)" :
                               "⏳ Waiting for Call"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(test.created_at).toLocaleString()}
                            </span>
                            {test.duration_ms && (
                              <Badge variant="outline">
                                {Math.round(test.duration_ms / 1000)}s
                              </Badge>
                            )}
                          </div>
                          
                          <div className="p-2 bg-gray-50 rounded mb-3">
                            <p className="text-xs text-gray-500 mb-1">TEST SCENARIO:</p>
                            <p className="text-sm text-gray-800 font-medium">{test.test_message}</p>
                          </div>
                          
                          {test.call_status === "error" && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                ⚠️ Call expired - nobody connected to speak. Web calls timeout after ~2 minutes if not connected.
                              </p>
                            </div>
                          )}
                          
                          {test.call_status !== "ended" && test.call_status !== "error" && !test.transcript && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                📞 Go to <strong>Test Page</strong> to speak this scenario and record the conversation
                              </p>
                            </div>
                          )}
                          
                          {test.transcript && (
                            <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                              <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                                <Volume2 className="w-3 h-3" /> CONVERSATION TRANSCRIPT
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {test.transcript}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {test.recording_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => playRecording(test.recording_url)}
                              className={`${playingRecording === test.recording_url ? "bg-green-100 border-green-300" : ""}`}
                            >
                              {playingRecording === test.recording_url ? (
                                <><Pause className="w-4 h-4 mr-1" /> Pause</>
                              ) : (
                                <><Volume2 className="w-4 h-4 mr-1" /> Listen</>
                              )}
                            </Button>
                          ) : test.call_status === "ended" ? (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              No recording
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600">
                              Awaiting call
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {playingRecording === test.recording_url && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-600 mb-2">🎧 Playing Recording</p>
                          <audio 
                            controls 
                            autoPlay 
                            className="w-full"
                            src={test.recording_url}
                            onEnded={() => setPlayingRecording(null)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Test Runs Tab */}
          <TabsContent value="runs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Batch Test Runs</h2>
              <Button variant="outline" onClick={fetchBatchTests}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {batchTests.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-12 text-center">
                  <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Runs Yet</h3>
                  <p className="text-gray-500">Run a batch test to see results here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {batchTests.map(bt => (
                  <Card key={bt.id} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(bt.status)}>
                              {bt.status === "in_progress" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                              {bt.status}
                            </Badge>
                            {bt.test_type === "voice_call" ? (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">🔊 Voice Call</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">💬 Text Simulation</Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(bt.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{bt.pass_count} passed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm">{bt.fail_count} failed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <span className="text-sm">{bt.error_count} errors</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Total: {bt.total_count}
                            </div>
                            {bt.pass_rate !== undefined && (
                              <Badge variant="outline" className={bt.pass_rate >= 70 ? "text-green-600" : "text-red-600"}>
                                {bt.pass_rate.toFixed(1)}% pass rate
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewBatchResults(bt)}
                          disabled={bt.status === "in_progress"}
                        >
                          View Results
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create Test Case Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
            <DialogDescription>
              Define scenarios to test your agent's behavior
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateScenarios}
                disabled={generatingScenarios}
              >
                {generatingScenarios ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Auto-Generate Scenarios
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Test Case Name *</Label>
              <Input
                value={newTestCase.name}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Customer Service Basic Tests"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTestCase.description}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this test case cover?"
                className="bg-white"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Test Scenarios</Label>
                <Button variant="outline" size="sm" onClick={addScenario}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Scenario
                </Button>
              </div>

              {newTestCase.scenarios.map((scenario, index) => (
                <Card key={index} className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-700">Scenario {index + 1}</span>
                      {newTestCase.scenarios.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScenario(index)}
                          className="text-red-500 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <Input
                      value={scenario.name}
                      onChange={(e) => updateScenario(index, "name", e.target.value)}
                      placeholder="Scenario name"
                      className="bg-white"
                    />

                    <Textarea
                      value={scenario.user_message}
                      onChange={(e) => updateScenario(index, "user_message", e.target.value)}
                      placeholder="User message (what the user says to test) *"
                      className="bg-white"
                      rows={2}
                    />

                    <Input
                      value={scenario.expected_topics}
                      onChange={(e) => updateScenario(index, "expected_topics", e.target.value)}
                      placeholder="Expected topics (comma-separated)"
                      className="bg-white"
                    />

                    <Input
                      value={scenario.success_criteria}
                      onChange={(e) => updateScenario(index, "success_criteria", e.target.value)}
                      placeholder="Success criteria"
                      className="bg-white"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTestCase}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create Test Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Batch Test Modal */}
      <Dialog open={showRunModal} onOpenChange={setShowRunModal}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Run Batch Test</DialogTitle>
            <DialogDescription>
              Select test cases to run against your agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Select the test cases you want to include in this batch run:
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {testCases.map(tc => (
                <div
                  key={tc.id}
                  onClick={() => toggleTestCaseSelection(tc.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTestCases.includes(tc.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{tc.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({tc.scenarios?.length || 0} scenarios)
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedTestCases.includes(tc.id)
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}>
                      {selectedTestCases.includes(tc.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              {selectedTestCases.length} test case(s) selected
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRunBatchTest}
              disabled={loading || selectedTestCases.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Batch Test Results
              {selectedBatchTest?.test_type === "voice_call" ? (
                <Badge className="bg-purple-100 text-purple-700">🔊 Voice Call Test</Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-700">💬 Text Simulation</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed results for each test scenario
            </DialogDescription>
          </DialogHeader>

          {selectedBatchTest && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedBatchTest.pass_count}</p>
                  <p className="text-sm text-gray-500">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedBatchTest.fail_count}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{selectedBatchTest.error_count}</p>
                  <p className="text-sm text-gray-500">Errors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedBatchTest.pass_rate?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Scenario Results</h4>
                {selectedBatchTest.results?.map((result, index) => (
                  <Card key={index} className={`border-l-4 ${
                    result.passed ? "border-l-green-500" : "border-l-red-500"
                  }`}>
                    <CardContent className="p-4">
                      <div 
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => setExpandedResults(prev => ({
                          ...prev,
                          [index]: !prev[index]
                        }))}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {result.passed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium text-gray-900">
                              {result.scenario_name || `Scenario ${index + 1}`}
                            </span>
                            {result.score !== undefined && (
                              <Badge variant="outline">
                                Score: {(result.score * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            User: "{result.user_message}"
                          </p>
                        </div>
                        {expandedResults[index] ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {expandedResults[index] && (
                        <div className="mt-4 space-y-3 pt-4 border-t">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">USER MESSAGE</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {result.user_message}
                            </p>
                          </div>
                          
                          {result.agent_response && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">AGENT RESPONSE</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                {result.agent_response}
                              </p>
                            </div>
                          )}
                          
                          {result.expected_topics?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">EXPECTED TOPICS</p>
                              <div className="flex flex-wrap gap-1">
                                {result.expected_topics.map((topic, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Covered: {result.topics_covered}/{result.expected_topics.length}
                              </p>
                            </div>
                          )}
                          
                          {result.error && (
                            <div>
                              <p className="text-xs font-medium text-red-500 mb-1">ERROR</p>
                              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {result.error}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voice Test Modal - Automated Testing */}
      <Dialog open={showVoiceTestModal} onOpenChange={setShowVoiceTestModal}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Automated Voice Test
            </DialogTitle>
            <DialogDescription>
              AI caller will automatically speak the test scenarios to your agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Bot className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Voice Test Workflow</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>1. Enter test scenarios below</li>
                    <li>2. Test calls will be created for each scenario</li>
                    <li>3. Go to <strong>Test Page</strong> to speak each scenario</li>
                    <li>4. Recordings & transcripts available after calls end</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>💡 Note:</strong> Test calls require you to connect and speak the scenario. 
                Recordings are only available after a conversation happens.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateScenarios(true)}
                disabled={generatingScenarios}
              >
                {generatingScenarios ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate from Agent Prompt
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Test Scenarios (one per line)</Label>
              <Textarea
                value={voiceTestMessage}
                onChange={(e) => setVoiceTestMessage(e.target.value)}
                placeholder="Enter test scenarios, one per line:&#10;I need to reschedule my flight to New York&#10;What's the status of my order?&#10;I want to cancel my subscription"
                className="bg-white min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Each line will be a separate test where the AI caller speaks to your agent
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Scenarios to run:</span>
                <Badge variant="outline">
                  {voiceTestMessage.split('\n').filter(s => s.trim()).length} tests
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoiceTestModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRunAutomatedTests}
              disabled={startingVoiceTest || !voiceTestMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {startingVoiceTest ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Starting Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Automated Tests
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Voice Call Modal */}
      <Dialog open={showVoiceCallModal} onOpenChange={closeVoiceCallModal}>
        <DialogContent className="bg-gradient-to-b from-purple-900 to-gray-900 max-w-2xl text-white border-purple-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Voice Test Call
            </DialogTitle>
          </DialogHeader>

          <div className="py-8">
            {/* Status indicator */}
            <div className="text-center mb-8">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                voiceCallStatus === "connected" ? "bg-green-500/20 animate-pulse" :
                voiceCallStatus === "connecting" ? "bg-yellow-500/20 animate-pulse" :
                voiceCallStatus === "ended" ? "bg-gray-500/20" :
                "bg-purple-500/20"
              }`}>
                {voiceCallStatus === "connected" ? (
                  <Mic className="w-12 h-12 text-green-400" />
                ) : voiceCallStatus === "connecting" ? (
                  <RefreshCw className="w-12 h-12 text-yellow-400 animate-spin" />
                ) : voiceCallStatus === "ended" ? (
                  <CheckCircle className="w-12 h-12 text-gray-400" />
                ) : (
                  <Phone className="w-12 h-12 text-purple-400" />
                )}
              </div>
              <p className="text-xl font-medium">
                {voiceCallStatus === "idle" && "Ready to Connect"}
                {voiceCallStatus === "connecting" && "Connecting..."}
                {voiceCallStatus === "connected" && "Call in Progress"}
                {voiceCallStatus === "ended" && "Call Ended"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {voiceCallStatus === "idle" && "Click 'Connect' to start the voice test"}
                {voiceCallStatus === "connected" && "Speak your test scenario to the agent"}
                {voiceCallStatus === "ended" && "Recording is now available"}
              </p>
            </div>

            {/* Test scenario reminder */}
            {activeVoiceTest?.test_message && (
              <div className="mb-6 p-4 bg-white/10 rounded-lg">
                <p className="text-xs text-purple-300 mb-1">YOUR TEST SCENARIO:</p>
                <p className="text-white">{activeVoiceTest.test_message}</p>
              </div>
            )}

            {/* Live transcript */}
            {voiceCallTranscript.length > 0 && (
              <div className="mb-6 max-h-48 overflow-y-auto p-4 bg-black/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">LIVE TRANSCRIPT:</p>
                <div className="space-y-2">
                  {voiceCallTranscript.map((item, i) => (
                    <div key={i} className={`text-sm ${item.role === "agent" ? "text-purple-300" : "text-blue-300"}`}>
                      <span className="font-medium">{item.role === "agent" ? "Agent: " : "You: "}</span>
                      {item.content}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {voiceCallStatus === "idle" && (
                <Button
                  onClick={startVoiceCall}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Connect & Start Call
                </Button>
              )}
              {voiceCallStatus === "connected" && (
                <Button
                  onClick={endVoiceCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              )}
              {voiceCallStatus === "ended" && (
                <Button
                  onClick={closeVoiceCallModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View Results
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

