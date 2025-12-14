import { useState } from "react";
import {
  Sparkles, Globe, FileText, Type, Wand2, Play,
  Download, Copy, Check, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, MessageSquare, Brain,
  Target, Shield, BookOpen, Zap
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PromptLab() {
  const [activeTab, setActiveTab] = useState("website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedContent, setExtractedContent] = useState(null);
  const [extracting, setExtracting] = useState(false);
  
  // Prompt configuration
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [agentPurpose, setAgentPurpose] = useState("");
  const [tone, setTone] = useState("professional");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  
  // Generated prompt
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Test Q&A
  const [testQuestions, setTestQuestions] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});

  const handleExtractWebsite = async () => {
    if (!websiteUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    setExtracting(true);
    try {
      const response = await axios.post(`${API}/prompt-lab/extract-from-url`, {
        url: websiteUrl,
        extract_type: "auto"
      });
      
      setExtractedContent(response.data);
      toast.success(`Extracted ${response.data.faq_count} FAQs and ${response.data.content_length} characters`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to extract website content");
    }
    setExtracting(false);
  };

  const handleExtractPDF = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      const response = await axios.post(`${API}/prompt-lab/extract-from-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setExtractedContent({
        main_content: response.data.content,
        content_length: response.data.content_length,
        filename: response.data.filename
      });
      toast.success(`Extracted ${response.data.content_length} characters from PDF`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to extract PDF content");
    }
    setExtracting(false);
  };

  const handleUseTextInput = () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text");
      return;
    }
    
    setExtractedContent({
      main_content: textInput,
      content_length: textInput.length
    });
    toast.success("Text content ready for prompt generation");
  };

  const handleGeneratePrompt = async () => {
    if (!agentPurpose) {
      toast.error("Please describe the agent's purpose");
      return;
    }

    setGenerating(true);
    try {
      const sourceContent = extractedContent 
        ? `${extractedContent.main_content}\n\n${extractedContent.faq_items?.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n') || ''}`
        : null;

      const response = await axios.post(`${API}/prompt-lab/generate-prompt`, {
        company_name: companyName,
        industry: industry,
        agent_purpose: agentPurpose,
        tone: tone,
        source_content: sourceContent,
        additional_instructions: additionalInstructions
      });
      
      setGeneratedPrompt(response.data.prompt);
      toast.success("Prompt generated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate prompt");
    }
    setGenerating(false);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateTestQuestions = async () => {
    if (!generatedPrompt) {
      toast.error("Please generate a prompt first");
      return;
    }

    setGeneratingQuestions(true);
    try {
      const response = await axios.post(`${API}/prompt-lab/generate-test-qa`, {
        system_prompt: generatedPrompt,
        num_questions: 10
      });
      
      setTestQuestions(response.data.questions);
      toast.success(`Generated ${response.data.count} test questions!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate test questions");
    }
    setGeneratingQuestions(false);
  };

  const handleTestPrompt = async () => {
    if (testQuestions.length === 0) {
      toast.error("Please generate test questions first");
      return;
    }

    setTesting(true);
    setTestResults([]);
    try {
      const response = await axios.post(`${API}/prompt-lab/test-prompt`, {
        system_prompt: generatedPrompt,
        test_questions: testQuestions.map(q => q.question)
      });
      
      setTestResults(response.data.test_results);
      toast.success(`Tested ${response.data.tested_questions} questions!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to test prompt");
    }
    setTesting(false);
  };

  const handleDownloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-prompt-${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Prompt downloaded!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Wand2 className="w-7 h-7 text-indigo-600" />
          Prompt Lab
        </h1>
        <p className="text-gray-500 mt-1">
          Generate AI-powered system prompts with XML structure, guardrails, and testing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Input & Configuration */}
        <div className="space-y-6">
          {/* Step 1: Extract Content */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">1</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Extract Content</CardTitle>
                  <CardDescription>Import from website, PDF, or text</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 bg-gray-100">
                  <TabsTrigger value="website">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </TabsTrigger>
                  <TabsTrigger value="pdf">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <Type className="w-4 h-4 mr-2" />
                    Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="website" className="space-y-3">
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com/faq"
                      className="bg-white mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleExtractWebsite}
                    disabled={extracting || !websiteUrl}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {extracting ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Extracting...</>
                    ) : (
                      <><Globe className="w-4 h-4 mr-2" /> Extract Content</>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="pdf" className="space-y-3">
                  <div>
                    <Label>Upload PDF</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      className="bg-white mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleExtractPDF}
                    disabled={extracting || !pdfFile}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {extracting ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Extracting...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" /> Extract from PDF</>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="text" className="space-y-3">
                  <div>
                    <Label>Paste Content</Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your company information, FAQs, documentation, or SOPs here..."
                      className="bg-white mt-1 min-h-[150px]"
                    />
                  </div>
                  <Button
                    onClick={handleUseTextInput}
                    disabled={!textInput.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Type className="w-4 h-4 mr-2" /> Use This Content
                  </Button>
                </TabsContent>
              </Tabs>

              {extractedContent && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Content Ready</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {extractedContent.faq_count > 0 && `${extractedContent.faq_count} FAQs • `}
                    {extractedContent.content_length} characters extracted
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Configure Prompt */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">2</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Configure Agent</CardTitle>
                  <CardDescription>Define agent details and requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company/Product Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., IntelliAX"
                  className="bg-white mt-1"
                />
              </div>

              <div>
                <Label>Industry</Label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., SaaS, E-commerce, Healthcare"
                  className="bg-white mt-1"
                />
              </div>

              <div>
                <Label>Agent Purpose *</Label>
                <Textarea
                  value={agentPurpose}
                  onChange={(e) => setAgentPurpose(e.target.value)}
                  placeholder="What should this agent do? (e.g., Handle customer support, answer product questions, schedule appointments)"
                  className="bg-white mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional Instructions (Optional)</Label>
                <Textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Any specific requirements, constraints, or behavior guidelines..."
                  className="bg-white mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGeneratePrompt}
                disabled={generating || !agentPurpose}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
                size="lg"
              >
                {generating ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Generating Prompt...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" /> Generate XML Prompt</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Generated Prompt & Testing */}
        <div className="space-y-6">
          {/* Generated Prompt */}
          {generatedPrompt ? (
            <>
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-600" />
                      <CardTitle className="text-lg">Generated Prompt</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPrompt}
                      >
                        {copied ? (
                          <><Check className="w-4 h-4 mr-1" /> Copied</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-1" /> Copy</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPrompt}
                      >
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">{generatedPrompt}</pre>
                  </div>

                  {/* Prompt Sections Preview */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Badge variant="outline" className="justify-center">
                      <Target className="w-3 h-3 mr-1" /> Persona
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      <Shield className="w-3 h-3 mr-1" /> Guardrails
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      <BookOpen className="w-3 h-3 mr-1" /> Context
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      <Zap className="w-3 h-3 mr-1" /> Instructions
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Test Section */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-lg">Test Prompt</CardTitle>
                  </div>
                  <CardDescription>
                    Generate test questions and evaluate agent responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleGenerateTestQuestions}
                    disabled={generatingQuestions}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {generatingQuestions ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Brain className="w-4 h-4 mr-2" /> Generate Test Questions</>
                    )}
                  </Button>

                  {testQuestions.length > 0 && (
                    <>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          {testQuestions.length} test questions ready
                        </p>
                        <div className="mt-2 space-y-1">
                          {testQuestions.slice(0, 3).map((q, i) => (
                            <p key={i} className="text-xs text-blue-700">
                              • {q.question}
                            </p>
                          ))}
                          {testQuestions.length > 3 && (
                            <p className="text-xs text-blue-600">
                              +{testQuestions.length - 3} more questions...
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={handleTestPrompt}
                        disabled={testing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {testing ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                        ) : (
                          <><Play className="w-4 h-4 mr-2" /> Run Tests</>
                        )}
                      </Button>
                    </>
                  )}

                  {/* Test Results */}
                  {testResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">Test Results</h4>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {testResults.map((result, index) => (
                          <Card key={index} className="border-gray-200">
                            <CardContent className="p-3">
                              <div
                                className="cursor-pointer"
                                onClick={() => setExpandedResults(prev => ({
                                  ...prev,
                                  [index]: !prev[index]
                                }))}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      Q: {result.question}
                                    </p>
                                    {result.status === "success" && (
                                      <Badge className="mt-1 bg-green-100 text-green-700 text-xs">
                                        <Check className="w-3 h-3 mr-1" /> Answered
                                      </Badge>
                                    )}
                                  </div>
                                  {expandedResults[index] ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>

                                {expandedResults[index] && result.answer && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                    <p className="font-medium text-gray-500 mb-1">Answer:</p>
                                    {result.answer}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="py-16 text-center">
                <Wand2 className="w-16 h-16 mx-auto text-indigo-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Prompt Generated Yet
                </h3>
                <p className="text-gray-600 text-sm">
                  Configure your agent and click "Generate XML Prompt" to create
                  a structured system prompt
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
