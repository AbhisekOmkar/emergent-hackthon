"""
AI Agent Builder API - Backend Server
Using Retell AI for voice agents
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
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

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger(__name__)
    logger.info("Starting AI Agent Builder API...")
    
    # Check Retell API key
    retell_key = os.environ.get('RETELL_API_KEY')
    if retell_key:
        logger.info(f"Retell API key configured: {retell_key[:12]}...")
    else:
        logger.warning("RETELL_API_KEY not configured. Voice features will not work.")
    
    yield  # Server is running
    
    # Shutdown
    client.close()
    logger.info("MongoDB connection closed")

app = FastAPI(title="AI Agent Builder API", version="1.0.0", lifespan=lifespan)

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
    voice_id: str = "11labs-Adrian"
    language: str = "en-US"
    responsiveness: float = 1.0
    interruption_sensitivity: float = 1.0
    enable_backchannel: bool = True

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
    knowledge_base_ids: Optional[List[str]] = None  # Knowledge bases attached to this agent
    retell_agent_id: Optional[str] = None  # Link to voice platform agent
    voice_config: Optional[VoiceConfig] = None
    chat_config: Optional[ChatConfig] = None
    tools: Optional[List[str]] = None
    knowledge_bases: Optional[List[str]] = None
    retell_agent_id: Optional[str] = None  # Link to Retell voice agent
    retell_llm_id: Optional[str] = None  # Link to Retell LLM for chat

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
    knowledge_base_ids: List[str] = []  # Knowledge bases attached via voice platform
    retell_agent_id: Optional[str] = None  # Link to Retell voice agent
    retell_llm_id: Optional[str] = None  # Link to Retell LLM for chat
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
    nodes: List[Dict] = []
    edges: List[Dict] = []

class Flow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    name: str
    description: str = ""
    version: int = 1
    is_active: bool = True
    nodes: List[Dict] = []
    edges: List[Dict] = []
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
    # Filter to only show agents created from Dec 13, 2025 onwards
    cutoff_date = datetime(2025, 12, 13, 0, 0, 0, tzinfo=timezone.utc)
    
    # First, get list of valid agents from Retell to filter out deleted ones
    import httpx
    retell_api_key = os.environ.get('RETELL_API_KEY')
    valid_retell_agent_ids = set()
    
    if retell_api_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.retellai.com/list-agents",
                    headers={"Authorization": f"Bearer {retell_api_key}"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    retell_agents = response.json()
                    valid_retell_agent_ids = {a.get("agent_id") for a in retell_agents if a.get("agent_id")}
        except Exception as e:
            logging.warning(f"Could not fetch Retell agents for validation: {e}")
    
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    filtered_agents = []
    
    for a in agents:
        # Skip agents that have a retell_agent_id but it's no longer valid in Retell (deleted)
        retell_id = a.get('retell_agent_id')
        if retell_id and valid_retell_agent_ids and retell_id not in valid_retell_agent_ids:
            # This agent was deleted from Retell, skip it
            continue
        
        created_at = a.get('created_at')
        if isinstance(created_at, str):
            a['created_at'] = datetime.fromisoformat(created_at)
        if isinstance(a.get('updated_at'), str):
            a['updated_at'] = datetime.fromisoformat(a['updated_at'])
        
        # Check if agent was created on or after Dec 13, 2025
        agent_created = a.get('created_at')
        if agent_created:
            if isinstance(agent_created, str):
                agent_created = datetime.fromisoformat(agent_created)
            if agent_created.tzinfo is None:
                agent_created = agent_created.replace(tzinfo=timezone.utc)
            if agent_created >= cutoff_date:
                filtered_agents.append(a)
        else:
            # If no created_at, don't include (older agents)
            pass
    
    return filtered_agents

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

# Cutoff date: December 13, 2025 - only show data from this date onwards
CUTOFF_DATE = datetime(2025, 12, 13, 0, 0, 0, tzinfo=timezone.utc)
CUTOFF_TIMESTAMP_MS = int(CUTOFF_DATE.timestamp() * 1000)

async def fetch_retell_calls(days: int = 7, agent_id: str = None) -> List[Dict]:
    """Fetch calls from Retell API (only from Dec 13, 2025 onwards)"""
    import httpx
    from datetime import timedelta
    
    retell_api_key = os.environ.get('RETELL_API_KEY')
    if not retell_api_key:
        return []
    
    end_timestamp = int(datetime.now().timestamp() * 1000)
    calculated_start = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
    # Use the later of the two dates (cutoff or calculated start)
    start_timestamp = max(calculated_start, CUTOFF_TIMESTAMP_MS)
    
    params = {
        "limit": 1000,
        "start_timestamp": start_timestamp,
        "end_timestamp": end_timestamp
    }
    
    if agent_id:
        params["filter_criteria"] = [{"member": "agent_id", "operator": "eq", "value": agent_id}]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.retellai.com/v2/list-calls",
                headers={
                    "Authorization": f"Bearer {retell_api_key}",
                    "Content-Type": "application/json"
                },
                json=params,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                calls = data if isinstance(data, list) else data.get("calls", [])
                # Double-check: filter out any calls before cutoff date
                filtered_calls = [
                    c for c in calls 
                    if (c.get("start_timestamp", 0) or c.get("created_timestamp", 0)) >= CUTOFF_TIMESTAMP_MS
                ]
                return filtered_calls
            else:
                logger.warning(f"Failed to fetch Retell calls: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Error fetching Retell calls: {str(e)}")
        return []


@api_router.post("/agents/cleanup")
async def cleanup_deleted_agents():
    """Remove agents from local DB that have been deleted from Retell"""
    import httpx
    
    retell_api_key = os.environ.get('RETELL_API_KEY')
    if not retell_api_key:
        raise HTTPException(status_code=500, detail="Voice Platform API key not configured")
    
    # Get all valid agents from Retell
    valid_retell_agent_ids = set()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.retellai.com/list-agents",
                headers={"Authorization": f"Bearer {retell_api_key}"},
                timeout=10.0
            )
            if response.status_code == 200:
                retell_agents = response.json()
                valid_retell_agent_ids = {a.get("agent_id") for a in retell_agents if a.get("agent_id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch cloud agents: {e}")
    
    # Find and delete local agents that no longer exist in Retell
    local_agents = await db.agents.find({"retell_agent_id": {"$ne": None}}, {"_id": 0, "id": 1, "name": 1, "retell_agent_id": 1}).to_list(1000)
    
    deleted_count = 0
    deleted_agents = []
    
    for agent in local_agents:
        retell_id = agent.get("retell_agent_id")
        if retell_id and retell_id not in valid_retell_agent_ids:
            # Delete this agent from local DB
            await db.agents.delete_one({"id": agent.get("id")})
            deleted_count += 1
            deleted_agents.append({"id": agent.get("id"), "name": agent.get("name"), "retell_agent_id": retell_id})
    
    # Also delete agents created before Dec 13, 2025
    cutoff_date = datetime(2025, 12, 13, 0, 0, 0, tzinfo=timezone.utc)
    cutoff_date_str = cutoff_date.isoformat()
    
    old_agents = await db.agents.find({}, {"_id": 0, "id": 1, "name": 1, "created_at": 1}).to_list(1000)
    for agent in old_agents:
        created_at = agent.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    continue
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if created_at < cutoff_date:
                await db.agents.delete_one({"id": agent.get("id")})
                deleted_count += 1
                deleted_agents.append({"id": agent.get("id"), "name": agent.get("name"), "reason": "created_before_cutoff"})
    
    return {
        "success": True,
        "deleted_count": deleted_count,
        "deleted_agents": deleted_agents,
        "valid_retell_agents": len(valid_retell_agent_ids)
    }


@api_router.get("/analytics/calls")
async def get_call_analytics(days: int = 7):
    """Get call analytics from Retell"""
    from datetime import timedelta
    
    # Fetch real calls from Retell
    calls = await fetch_retell_calls(days)
    
    total_calls = len(calls)
    successful_calls = sum(1 for c in calls if c.get("call_status") == "ended")
    failed_calls = sum(1 for c in calls if c.get("call_status") in ["error", "failed"])
    total_duration_ms = sum(c.get("duration_ms", 0) or 0 for c in calls)
    
    # Calculate calls today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_timestamp = int(today_start.timestamp() * 1000)
    calls_today = sum(1 for c in calls if (c.get("start_timestamp", 0) or 0) >= today_timestamp)
    
    # Calculate total cost
    total_cost = sum(
        c.get("call_cost", {}).get("combined_cost", 0) or 0
        for c in calls if c.get("call_cost")
    )
    
    # Sentiment distribution
    sentiments = {"positive": 0, "neutral": 0, "negative": 0}
    for call in calls:
        analysis = call.get("call_analysis", {}) or {}
        sentiment = (analysis.get("user_sentiment") or "neutral").lower()
        if sentiment in sentiments:
            sentiments[sentiment] += 1
        else:
            sentiments["neutral"] += 1
    
    return {
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "failed_calls": failed_calls,
        "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
        "average_duration": (total_duration_ms / total_calls / 1000) if total_calls > 0 else 0,
        "total_duration_seconds": total_duration_ms / 1000,
        "calls_today": calls_today,
        "calls_this_week": total_calls,
        "total_cost": round(total_cost, 2),
        "sentiment_distribution": sentiments,
        "period_days": days
    }


@api_router.get("/analytics/chart-data")
async def get_analytics_chart_data(days: int = 7):
    """Get daily breakdown of calls for charts"""
    from datetime import timedelta
    from collections import defaultdict
    
    calls = await fetch_retell_calls(days)
    
    # Group calls by day
    daily_data = defaultdict(lambda: {"calls": 0, "success": 0, "duration": 0})
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for call in calls:
        timestamp_ms = call.get("start_timestamp", 0) or call.get("created_timestamp", 0)
        if timestamp_ms:
            call_date = datetime.fromtimestamp(timestamp_ms / 1000)
            day_key = call_date.strftime("%a")  # Mon, Tue, etc.
            daily_data[day_key]["calls"] += 1
            if call.get("call_status") == "ended":
                daily_data[day_key]["success"] += 1
            daily_data[day_key]["duration"] += (call.get("duration_ms", 0) or 0) / 1000
    
    # Build chart data for the last 7 days
    calls_chart = []
    duration_chart = []
    
    for i in range(6, -1, -1):
        day = datetime.now() - timedelta(days=i)
        day_name = day.strftime("%a")
        data = daily_data.get(day_name, {"calls": 0, "success": 0, "duration": 0})
        
        calls_chart.append({
            "name": day_name,
            "calls": data["calls"],
            "success": data["success"]
        })
        
        avg_duration = data["duration"] / data["calls"] if data["calls"] > 0 else 0
        duration_chart.append({
            "name": day_name,
            "duration": round(avg_duration, 1)
        })
    
    return {
        "calls_data": calls_chart,
        "duration_data": duration_chart
    }


@api_router.get("/analytics/agents/{agent_id}")
async def get_agent_analytics(agent_id: str, days: int = 7):
    """Get analytics for a specific agent"""
    # Get the platform agent to find its Retell agent ID
    agent = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    retell_agent_id = agent.get("retell_agent_id") if agent else None
    
    # Fetch calls for this agent
    calls = await fetch_retell_calls(days, retell_agent_id)
    
    total_calls = len(calls)
    successful_calls = sum(1 for c in calls if c.get("call_status") == "ended")
    total_duration_ms = sum(c.get("duration_ms", 0) or 0 for c in calls)
    
    return {
        "agent_id": agent_id,
        "retell_agent_id": retell_agent_id,
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
        "average_duration": (total_duration_ms / total_calls / 1000) if total_calls > 0 else 0,
        "period_days": days
    }


@api_router.get("/analytics/recent-calls")
async def get_recent_calls(limit: int = 10):
    """Get recent calls with details"""
    calls = await fetch_retell_calls(days=30)
    
    # Sort by timestamp descending and limit
    sorted_calls = sorted(
        calls, 
        key=lambda x: x.get("start_timestamp", 0) or 0, 
        reverse=True
    )[:limit]
    
    # Format for display
    recent = []
    for call in sorted_calls:
        recent.append({
            "call_id": call.get("call_id"),
            "agent_id": call.get("agent_id"),
            "status": call.get("call_status"),
            "duration_seconds": round((call.get("duration_ms", 0) or 0) / 1000, 1),
            "timestamp": call.get("start_timestamp"),
            "end_reason": call.get("disconnection_reason"),
            "sentiment": call.get("call_analysis", {}).get("user_sentiment") if call.get("call_analysis") else None,
            "summary": call.get("call_analysis", {}).get("call_summary") if call.get("call_analysis") else None
        })
    
    return recent

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

async def call_retell_llm(
    llm_id: str,
    messages: List[Dict],
    system_prompt: str,
    temperature: float = 0.7
) -> str:
    """Call Retell LLM for chat completion"""
    import httpx
    
    retell_api_key = os.environ.get('RETELL_API_KEY')
    if not retell_api_key:
        raise HTTPException(status_code=500, detail="RETELL_API_KEY not configured")
    
    # Format messages for Retell LLM
    # Retell uses a specific format for chat
    formatted_messages = []
    for msg in messages:
        if msg["role"] == "user":
            formatted_messages.append({"role": "user", "content": msg["content"]})
        elif msg["role"] in ["assistant", "agent"]:
            formatted_messages.append({"role": "assistant", "content": msg["content"]})
    
    async with httpx.AsyncClient() as client:
        # Use Retell's chat completion endpoint
        response = await client.post(
            "https://api.retellai.com/v2/create-chat-completion",
            headers={
                "Authorization": f"Bearer {retell_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "llm_id": llm_id,
                "messages": formatted_messages,
                "system_prompt": system_prompt,
                "temperature": temperature
            },
            timeout=60.0
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("response", data.get("content", ""))
        
        # If Retell chat completion doesn't work, fall back to OpenAI via Retell
        # Try the LLM websocket simulation approach
        logger.warning(f"Retell chat completion returned {response.status_code}, trying fallback")
    
    # Fallback: Use OpenAI directly if Retell doesn't support chat completion
    return await call_openai_fallback(messages, system_prompt, temperature)


async def call_openai_fallback(
    messages: List[Dict], 
    system_prompt: str,
    temperature: float = 0.7
) -> str:
    """Fallback to OpenAI API for chat"""
    import httpx
    
    # Try Retell's OpenAI key first, then fall back to direct OpenAI key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured for chat fallback")
    
    # Build OpenAI messages
    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        if msg["role"] in ["user", "assistant"]:
            openai_messages.append({"role": msg["role"], "content": msg["content"]})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "messages": openai_messages,
                "temperature": temperature
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            error_detail = response.text
            try:
                error_json = response.json()
                error_detail = error_json.get("error", {}).get("message", error_detail)
            except:
                pass
            raise HTTPException(status_code=response.status_code, detail=f"OpenAI API error: {error_detail}")
        
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def get_or_create_retell_llm(agent: Dict) -> str:
    """Get existing Retell LLM ID or create a new one for the agent"""
    import httpx
    
    retell_api_key = os.environ.get('RETELL_API_KEY')
    if not retell_api_key:
        raise HTTPException(status_code=500, detail="RETELL_API_KEY not configured")
    
    # Check if agent already has a Retell LLM
    if agent.get('retell_llm_id'):
        return agent['retell_llm_id']
    
    # Create a new Retell LLM for this agent
    system_prompt = agent.get('system_prompt', 'You are a helpful AI assistant.')
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.retellai.com/create-retell-llm",
            headers={
                "Authorization": f"Bearer {retell_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "general_prompt": system_prompt,
                "general_tools": [],
                "states": []
            },
            timeout=30.0
        )
        
        if response.status_code != 200 and response.status_code != 201:
            logger.error(f"Failed to create Retell LLM: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to create Voice LLM")
        
        data = response.json()
        llm_id = data.get("llm_id")
        
        if llm_id:
            # Update agent with LLM ID
            await db.agents.update_one(
                {"id": agent["id"]},
                {"$set": {"retell_llm_id": llm_id}}
            )
        
        return llm_id


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """Chat with an AI agent"""
    import httpx
    
    # Get agent configuration
    agent = await db.agents.find_one({"id": request.agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    system_prompt = agent.get('system_prompt', 'You are a helpful AI assistant.')
    chat_config = agent.get('chat_config') or {}
    temperature = chat_config.get('temperature', 0.7)
    
    # Generate session ID
    session_id = request.session_id or str(uuid.uuid4())
    
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    retell_api_key = os.environ.get('RETELL_API_KEY')
    
    if not openai_api_key and not retell_api_key:
        raise HTTPException(status_code=500, detail="No API key configured")
    
    # Build conversation messages
    messages = []
    for msg in request.history:
        role = "assistant" if msg.role == "assistant" else "user"
        messages.append({"role": role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})
    
    # Use OpenAI for chat completion
    api_key = openai_api_key or retell_api_key
    
    openai_messages = [{"role": "system", "content": system_prompt}]
    openai_messages.extend(messages)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": chat_config.get('llm_model', 'gpt-4o'),
                    "messages": openai_messages,
                    "temperature": temperature,
                    "max_tokens": chat_config.get('max_tokens', 2048)
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("error", {}).get("message", error_detail)
                except:
                    pass
                raise HTTPException(status_code=response.status_code, detail=f"Chat API error: {error_detail}")
            
            data = response.json()
            response_text = data["choices"][0]["message"]["content"]
        
        return ChatResponse(response=response_text, session_id=session_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/test/chat")
async def test_chat(message: str, provider: str = "openai", model: str = "gpt-4o"):
    """Test LLM chat directly"""
    import httpx
    
    try:
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('RETELL_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="No API key configured")
        
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": message}
        ]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("error", {}).get("message", error_detail)
                except:
                    pass
                raise HTTPException(status_code=response.status_code, detail=error_detail)
            
            data = response.json()
            response_text = data["choices"][0]["message"]["content"]
        
        return {"response": response_text, "provider": provider, "model": model}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

# Include the main API router
app.include_router(api_router)

# Include Retell routes
from routes.retell_routes import router as retell_router
app.include_router(retell_router, prefix="/api")

# Include Payments routes
from routes.payments_routes import router as payments_router
app.include_router(payments_router, prefix="/api")

# Include Prompt Lab routes
from routes.prompt_lab_routes import router as prompt_lab_router
app.include_router(prompt_lab_router, prefix="/api")

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
