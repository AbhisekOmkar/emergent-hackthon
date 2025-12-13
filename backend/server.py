from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="AI Agent Builder API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== ENUMS ==========
class AgentType(str, Enum):
    CHAT = "chat"
    VOICE = "voice"
    MULTIMODAL = "multi-modal"

class AgentStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"

class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"

# ========== MODELS ==========
class VoiceConfig(BaseModel):
    direction: str = "inbound"
    stt_provider: str = "deepgram"
    tts_provider: str = "elevenlabs"
    tts_voice: str = "default"
    llm_provider: LLMProvider = LLMProvider.OPENAI
    llm_model: str = "gpt-4o"

class ChatConfig(BaseModel):
    llm_provider: LLMProvider = LLMProvider.OPENAI
    llm_model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 2048

class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    type: AgentType
    system_prompt: str
    greeting_message: Optional[str] = "Hello! How can I help you today?"
    voice_config: Optional[VoiceConfig] = None
    chat_config: Optional[ChatConfig] = None
    tools: List[str] = []
    knowledge_bases: List[str] = []

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    greeting_message: Optional[str] = None
    status: Optional[AgentStatus] = None
    voice_config: Optional[VoiceConfig] = None
    chat_config: Optional[ChatConfig] = None
    tools: Optional[List[str]] = None
    knowledge_bases: Optional[List[str]] = None

class Agent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    type: AgentType
    status: AgentStatus = AgentStatus.DRAFT
    system_prompt: str
    greeting_message: str = "Hello! How can I help you today?"
    voice_config: Optional[Dict] = None
    chat_config: Optional[Dict] = None
    tools: List[str] = []
    knowledge_bases: List[str] = []
    calls_count: int = 0
    success_rate: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Flow Models
class FlowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class FlowCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    agent_id: Optional[str] = None
    nodes: List[Dict] = []
    edges: List[Dict] = []

class Flow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: Optional[str] = None
    name: str
    description: str = ""
    version: int = 1
    status: str = "draft"
    is_active: bool = True
    nodes: List[Dict] = []
    edges: List[Dict] = []
    nodes_count: int = 0
    runs: int = 0
    last_run: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Tool Models
class ToolType(str, Enum):
    BUILTIN = "builtin"
    HTTP = "http"
    CUSTOM = "custom"
    UNIFIED = "unified"

class ToolCreate(BaseModel):
    name: str
    description: str
    type: ToolType
    category: str = "custom"
    config: Dict = {}
    parameters: List[Dict] = []

class Tool(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: ToolType
    category: str = "custom"
    config: Dict = {}
    parameters: List[Dict] = []
    is_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Knowledge Base Models
class KnowledgeBaseCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    type: str = "documents"

class KnowledgeBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    type: str = "documents"
    documents_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Call/Analytics Models
class Call(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    direction: str = "inbound"
    status: str = "completed"
    duration: int = 0
    transcript: List[Dict] = []
    analytics: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Chat Models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    agent_id: str
    message: str
    session_id: Optional[str] = None
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Insight Models
class InsightCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    agent_id: Optional[str] = "all"
    improvement_direction: str = "increase"
    prompt: str

class Insight(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    agent_id: str = "all"
    improvement_direction: str = "increase"
    prompt: str
    pass_rate: float = 0.0
    simulations_passed: int = 0
    simulations_failed: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== ROUTES ==========

# Health check
@api_router.get("/")
async def root():
    return {"message": "AI Agent Builder API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# ========== AGENTS ==========
@api_router.post("/agents", response_model=Agent)
async def create_agent(agent_data: AgentCreate):
    agent = Agent(
        name=agent_data.name,
        description=agent_data.description or "",
        type=agent_data.type,
        system_prompt=agent_data.system_prompt,
        greeting_message=agent_data.greeting_message or "Hello! How can I help you today?",
        voice_config=agent_data.voice_config.model_dump() if agent_data.voice_config else None,
        chat_config=agent_data.chat_config.model_dump() if agent_data.chat_config else None,
        tools=agent_data.tools,
        knowledge_bases=agent_data.knowledge_bases,
    )
    doc = agent.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.agents.insert_one(doc)
    return agent

@api_router.get("/agents", response_model=List[Agent])
async def list_agents():
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    for a in agents:
        if isinstance(a.get('created_at'), str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
        if isinstance(a.get('updated_at'), str):
            a['updated_at'] = datetime.fromisoformat(a['updated_at'])
    return agents

@api_router.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    agent = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if isinstance(agent.get('created_at'), str):
        agent['created_at'] = datetime.fromisoformat(agent['created_at'])
    if isinstance(agent.get('updated_at'), str):
        agent['updated_at'] = datetime.fromisoformat(agent['updated_at'])
    return agent

@api_router.put("/agents/{agent_id}", response_model=Agent)
async def update_agent(agent_id: str, agent_data: AgentUpdate):
    update_dict = {k: v for k, v in agent_data.model_dump().items() if v is not None}
    if 'voice_config' in update_dict and update_dict['voice_config']:
        update_dict['voice_config'] = update_dict['voice_config']
    if 'chat_config' in update_dict and update_dict['chat_config']:
        update_dict['chat_config'] = update_dict['chat_config']
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.agents.update_one({"id": agent_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return await get_agent(agent_id)

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    result = await db.agents.delete_one({"id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}

@api_router.post("/agents/{agent_id}/deploy")
async def deploy_agent(agent_id: str):
    result = await db.agents.update_one(
        {"id": agent_id}, 
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deployed successfully", "status": "active"}

# ========== FLOWS ==========
@api_router.post("/agents/{agent_id}/flows", response_model=Flow)
async def create_flow(agent_id: str, flow_data: FlowCreate):
    agent = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    flow = Flow(
        agent_id=agent_id,
        name=flow_data.name,
        description=flow_data.description or "",
        nodes=flow_data.nodes,
        edges=flow_data.edges,
    )
    doc = flow.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.flows.insert_one(doc)
    return flow

@api_router.get("/agents/{agent_id}/flows", response_model=List[Flow])
async def list_flows(agent_id: str):
    flows = await db.flows.find({"agent_id": agent_id}, {"_id": 0}).to_list(100)
    for f in flows:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
        if isinstance(f.get('updated_at'), str):
            f['updated_at'] = datetime.fromisoformat(f['updated_at'])
    return flows

@api_router.get("/agents/{agent_id}/flows/{flow_id}", response_model=Flow)
async def get_flow(agent_id: str, flow_id: str):
    flow = await db.flows.find_one({"id": flow_id, "agent_id": agent_id}, {"_id": 0})
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    if isinstance(flow.get('created_at'), str):
        flow['created_at'] = datetime.fromisoformat(flow['created_at'])
    if isinstance(flow.get('updated_at'), str):
        flow['updated_at'] = datetime.fromisoformat(flow['updated_at'])
    return flow

@api_router.put("/agents/{agent_id}/flows/{flow_id}", response_model=Flow)
async def update_flow(agent_id: str, flow_id: str, flow_data: FlowCreate):
    update_dict = flow_data.model_dump()
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.flows.update_one(
        {"id": flow_id, "agent_id": agent_id}, 
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return await get_flow(agent_id, flow_id)

@api_router.delete("/agents/{agent_id}/flows/{flow_id}")
async def delete_flow(agent_id: str, flow_id: str):
    result = await db.flows.delete_one({"id": flow_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"message": "Flow deleted successfully"}

# ========== GENERAL FLOWS (not tied to agents) ==========
@api_router.get("/flows", response_model=List[Flow])
async def list_all_flows():
    """List all flows, optionally filter by agent"""
    flows = await db.flows.find({}, {"_id": 0}).to_list(100)
    for f in flows:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
        if isinstance(f.get('updated_at'), str):
            f['updated_at'] = datetime.fromisoformat(f['updated_at'])
    return flows

@api_router.post("/flows", response_model=Flow)
async def create_general_flow(flow_data: FlowCreate):
    """Create a flow without requiring an agent"""
    # If agent_id is provided, verify it exists
    if flow_data.agent_id:
        agent = await db.agents.find_one({"id": flow_data.agent_id}, {"_id": 0})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
    
    flow = Flow(
        agent_id=flow_data.agent_id,
        name=flow_data.name,
        description=flow_data.description or "",
        nodes=flow_data.nodes,
        edges=flow_data.edges,
        nodes_count=len(flow_data.nodes),
    )
    doc = flow.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.flows.insert_one(doc)
    return flow

@api_router.get("/flows/{flow_id}", response_model=Flow)
async def get_general_flow(flow_id: str):
    """Get a specific flow by ID"""
    flow = await db.flows.find_one({"id": flow_id}, {"_id": 0})
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    if isinstance(flow.get('created_at'), str):
        flow['created_at'] = datetime.fromisoformat(flow['created_at'])
    if isinstance(flow.get('updated_at'), str):
        flow['updated_at'] = datetime.fromisoformat(flow['updated_at'])
    return flow

@api_router.put("/flows/{flow_id}", response_model=Flow)
async def update_general_flow(flow_id: str, flow_data: FlowCreate):
    """Update a flow"""
    update_dict = flow_data.model_dump()
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_dict['nodes_count'] = len(flow_data.nodes)
    
    result = await db.flows.update_one(
        {"id": flow_id}, 
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return await get_general_flow(flow_id)

@api_router.delete("/flows/{flow_id}")
async def delete_general_flow(flow_id: str):
    """Delete a flow"""
    result = await db.flows.delete_one({"id": flow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"message": "Flow deleted successfully"}

# ========== TOOLS ==========
@api_router.post("/tools", response_model=Tool)
async def create_tool(tool_data: ToolCreate):
    tool = Tool(
        name=tool_data.name,
        description=tool_data.description,
        type=tool_data.type,
        category=tool_data.category,
        config=tool_data.config,
        parameters=tool_data.parameters,
    )
    doc = tool.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tools.insert_one(doc)
    return tool

@api_router.get("/tools", response_model=List[Tool])
async def list_tools():
    tools = await db.tools.find({}, {"_id": 0}).to_list(1000)
    for t in tools:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return tools

@api_router.get("/tools/builtin")
async def get_builtin_tools():
    """Return list of built-in tools available for agents"""
    return [
        {"id": "book_appointment", "name": "Book Appointment", "description": "Schedule meetings via connected calendar", "category": "calendar"},
        {"id": "check_availability", "name": "Check Availability", "description": "Query calendar for open time slots", "category": "calendar"},
        {"id": "update_crm", "name": "Update CRM", "description": "Create or update records in CRM", "category": "crm"},
        {"id": "lookup_customer", "name": "Lookup Customer", "description": "Find customer info by phone/email", "category": "crm"},
        {"id": "transfer_call", "name": "Transfer Call", "description": "Transfer to human agent or department", "category": "voice"},
        {"id": "send_sms", "name": "Send SMS", "description": "Send text message to caller", "category": "messaging"},
        {"id": "send_email", "name": "Send Email", "description": "Send email to customer", "category": "messaging"},
        {"id": "create_ticket", "name": "Create Ticket", "description": "Create support ticket", "category": "ticketing"},
        {"id": "end_call", "name": "End Call", "description": "Gracefully end the conversation", "category": "voice"},
    ]

@api_router.get("/tools/{tool_id}", response_model=Tool)
async def get_tool(tool_id: str):
    tool = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    if isinstance(tool.get('created_at'), str):
        tool['created_at'] = datetime.fromisoformat(tool['created_at'])
    return tool

@api_router.delete("/tools/{tool_id}")
async def delete_tool(tool_id: str):
    result = await db.tools.delete_one({"id": tool_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"message": "Tool deleted successfully"}

# ========== KNOWLEDGE BASE ==========
@api_router.post("/knowledge", response_model=KnowledgeBase)
async def create_knowledge_base(kb_data: KnowledgeBaseCreate):
    kb = KnowledgeBase(
        name=kb_data.name,
        description=kb_data.description or "",
        type=kb_data.type,
    )
    doc = kb.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.knowledge_bases.insert_one(doc)
    return kb

@api_router.get("/knowledge", response_model=List[KnowledgeBase])
async def list_knowledge_bases():
    kbs = await db.knowledge_bases.find({}, {"_id": 0}).to_list(100)
    for kb in kbs:
        if isinstance(kb.get('created_at'), str):
            kb['created_at'] = datetime.fromisoformat(kb['created_at'])
    return kbs

@api_router.delete("/knowledge/{kb_id}")
async def delete_knowledge_base(kb_id: str):
    result = await db.knowledge_bases.delete_one({"id": kb_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return {"message": "Knowledge base deleted successfully"}

# ========== ANALYTICS ==========
@api_router.get("/analytics/calls")
async def get_call_analytics():
    calls = await db.calls.find({}, {"_id": 0}).to_list(1000)
    total_calls = len(calls)
    successful_calls = sum(1 for c in calls if c.get('status') == 'completed')
    total_duration = sum(c.get('duration', 0) for c in calls)
    
    return {
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
        "average_duration": (total_duration / total_calls) if total_calls > 0 else 0,
        "calls_today": 0,
        "calls_this_week": total_calls,
    }

@api_router.get("/analytics/agents/{agent_id}")
async def get_agent_analytics(agent_id: str):
    calls = await db.calls.find({"agent_id": agent_id}, {"_id": 0}).to_list(1000)
    total_calls = len(calls)
    successful_calls = sum(1 for c in calls if c.get('status') == 'completed')
    
    return {
        "agent_id": agent_id,
        "total_calls": total_calls,
        "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
        "average_duration": sum(c.get('duration', 0) for c in calls) / total_calls if total_calls > 0 else 0,
    }

# ========== INSIGHTS ==========
@api_router.post("/insights", response_model=Insight)
async def create_insight(insight_data: InsightCreate):
    insight = Insight(
        name=insight_data.name,
        description=insight_data.description or "",
        agent_id=insight_data.agent_id or "all",
        improvement_direction=insight_data.improvement_direction,
        prompt=insight_data.prompt,
    )
    doc = insight.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.insights.insert_one(doc)
    return insight

@api_router.get("/insights", response_model=List[Insight])
async def list_insights():
    insights = await db.insights.find({}, {"_id": 0}).to_list(100)
    for i in insights:
        if isinstance(i.get('created_at'), str):
            i['created_at'] = datetime.fromisoformat(i['created_at'])
    return insights

# ========== CHAT / LLM ==========
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """Chat with an AI agent using LLM"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get agent configuration
    agent = await db.agents.find_one({"id": request.agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get LLM configuration
    chat_config = agent.get('chat_config') or {}
    llm_provider = chat_config.get('llm_provider', 'openai')
    llm_model = chat_config.get('llm_model', 'gpt-4o')
    
    # Initialize chat
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    session_id = request.session_id or str(uuid.uuid4())
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=agent.get('system_prompt', 'You are a helpful AI assistant.')
    ).with_model(llm_provider, llm_model)
    
    # Send message and get response
    user_message = UserMessage(text=request.message)
    response = await chat.send_message(user_message)
    
    return ChatResponse(response=response, session_id=session_id)

@api_router.post("/test/chat")
async def test_chat(message: str, provider: str = "openai", model: str = "gpt-4o"):
    """Test LLM chat directly"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message="You are a helpful AI assistant."
    ).with_model(provider, model)
    
    user_message = UserMessage(text=message)
    response = await chat.send_message(user_message)
    
    return {"response": response, "provider": provider, "model": model}

# ========== INTEGRATIONS ==========
@api_router.get("/integrations/categories")
async def get_integration_categories():
    """Return Unified.to integration categories"""
    return [
        {"id": "crm", "name": "CRM", "count": 39, "objects": ["company", "contact", "deal", "lead", "pipeline"]},
        {"id": "calendar", "name": "Calendar", "count": 24, "objects": ["calendar", "event", "busy", "link"]},
        {"id": "hr", "name": "HR & HRIS", "count": 196, "objects": ["employee", "group", "payslip", "timeoff"]},
        {"id": "ats", "name": "ATS", "count": 66, "objects": ["candidate", "job", "application", "interview"]},
        {"id": "ticketing", "name": "Ticketing", "count": 7, "objects": ["ticket", "customer", "note"]},
        {"id": "accounting", "name": "Accounting", "count": 34, "objects": ["invoice", "contact", "transaction"]},
        {"id": "commerce", "name": "Commerce", "count": 25, "objects": ["item", "collection", "inventory"]},
        {"id": "payment", "name": "Payment", "count": 15, "objects": ["payment", "subscription", "refund"]},
        {"id": "storage", "name": "Storage", "count": 25, "objects": ["file"]},
        {"id": "messaging", "name": "Messaging", "count": 14, "objects": ["message", "channel"]},
        {"id": "tasks", "name": "Tasks", "count": 20, "objects": ["project", "task", "comment"]},
        {"id": "enrichment", "name": "Enrichment", "count": 25, "objects": ["person", "company"]},
        {"id": "genai", "name": "GenAI", "count": 11, "objects": ["model", "prompt", "embedding"]},
        {"id": "call_center", "name": "Call Center", "count": 13, "objects": ["contact", "call", "recording"]},
    ]

@api_router.get("/integrations/connections")
async def list_connections():
    """List all active integration connections"""
    connections = await db.integrations.find({}, {"_id": 0}).to_list(100)
    return connections

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
