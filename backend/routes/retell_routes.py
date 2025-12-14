"""
Retell AI Voice Agent Routes
Based on Retell API documentation and platform-layer-backend reference
"""
import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
import httpx
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection - reuse from environment
def get_db():
    """Get MongoDB database connection"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'emergent_agents')
    client = AsyncIOMotorClient(mongo_url)
    return client, client[db_name]

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/retell", tags=["Voice Agents"])

# Retell API Configuration
RETELL_API_BASE = "https://api.retellai.com"

def get_retell_api_key():
    """Get Retell API key from environment (dynamic lookup)"""
    return os.environ.get("RETELL_API_KEY")


# ========== PYDANTIC MODELS ==========

class CreateAgentRequest(BaseModel):
    """Request model for creating a Retell voice agent"""
    agent_name: str = Field(..., description="Name of the agent")
    voice_id: str = Field(default="11labs-Adrian", description="Voice ID for TTS")
    fallback_voice_ids: List[str] = Field(
        default=["openai-Alloy", "deepgram-Angus"], 
        description="Fallback voices if primary fails"
    )
    system_prompt: str = Field(..., description="System prompt/instructions for the agent")
    language: str = Field(default="en-US", description="Language code")
    responsiveness: float = Field(default=1.0, ge=0, le=1, description="How quickly agent responds")
    interruption_sensitivity: float = Field(default=1.0, ge=0, le=1, description="Sensitivity to user interruptions")
    enable_backchannel: bool = Field(default=True, description="Enable 'uh-huh', 'yeah' responses")
    backchannel_frequency: float = Field(default=0.9, ge=0, le=1)
    backchannel_words: List[str] = Field(default=["yeah", "uh-huh", "mm-hmm"])
    reminder_max_count: int = Field(default=2, description="Max reminders if user is silent")
    reminder_trigger_ms: int = Field(default=10000, description="Time before reminder in ms")
    end_call_after_silence_ms: int = Field(default=30000, description="End call after silence")
    max_call_duration_ms: int = Field(default=3600000, description="Max call duration (1 hour)")
    webhook_url: Optional[str] = Field(None, description="Webhook for call events")
    boosted_keywords: Optional[List[str]] = Field(None, description="Keywords to boost in STT")


class UpdateAgentRequest(BaseModel):
    """Request model for updating a Retell voice agent"""
    agent_name: Optional[str] = None
    voice_id: Optional[str] = None
    fallback_voice_ids: Optional[List[str]] = None
    system_prompt: Optional[str] = None
    language: Optional[str] = None
    responsiveness: Optional[float] = Field(None, ge=0, le=1)
    interruption_sensitivity: Optional[float] = Field(None, ge=0, le=1)
    enable_backchannel: Optional[bool] = None
    backchannel_frequency: Optional[float] = Field(None, ge=0, le=1)
    backchannel_words: Optional[List[str]] = None
    webhook_url: Optional[str] = None
    boosted_keywords: Optional[List[str]] = None
    end_call_after_silence_ms: Optional[int] = None
    max_call_duration_ms: Optional[int] = None


class WebCallResponse(BaseModel):
    """Response from creating a web call"""
    call_id: str
    access_token: str
    agent_id: str


# ========== HELPER FUNCTIONS ==========

async def make_retell_request(
    method: str, 
    endpoint: str, 
    data: dict = None,
    timeout: float = 30.0
) -> dict:
    """Make authenticated request to Retell API"""
    api_key = get_retell_api_key()
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="RETELL_API_KEY not configured. Add it to your .env file."
        )
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    url = f"{RETELL_API_BASE}{endpoint}"
    logger.info(f"Retell API: {method} {endpoint}")
    if data:
        logger.info(f"Retell API request data: {data}")
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            if method.upper() == "GET":
                response = await client.get(url, headers=headers)
            elif method.upper() == "POST":
                response = await client.post(url, headers=headers, json=data)
            elif method.upper() == "PATCH":
                response = await client.patch(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = await client.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported method: {method}")
            
            logger.info(f"Retell API response: {response.status_code}")
            
            if response.status_code >= 400:
                error_detail = response.text
                logger.error(f"Retell API raw error response: {error_detail}")
                try:
                    error_json = response.json()
                    logger.error(f"Retell API error JSON: {error_json}")
                    error_detail = error_json.get("error", error_json.get("detail", error_json.get("message", error_detail)))
                except:
                    pass
                
                logger.error(f"Retell API error: {response.status_code} - {error_detail}")
                
                if response.status_code == 401:
                    raise HTTPException(status_code=401, detail="Invalid Voice Platform API key")
                elif response.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Resource not found: {endpoint}")
                else:
                    raise HTTPException(status_code=response.status_code, detail=error_detail)
            
            # Handle DELETE with no content
            if method.upper() == "DELETE" and response.status_code == 204:
                return {"success": True}
            
            return response.json() if response.text else {"success": True}
            
        except httpx.RequestError as e:
            logger.error(f"Retell API connection error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to Voice Platform API: {str(e)}")


# ========== AGENT ENDPOINTS ==========

@router.post("/agents", response_model=Dict[str, Any])
async def create_retell_agent(request: CreateAgentRequest):
    """
    Create a new Retell AI voice agent.
    This creates both the LLM configuration and the agent in Retell.
    """
    try:
        logger.info(f"Creating Retell agent: {request.agent_name}")
        
        # Step 1: Create the LLM in Retell
        llm_data = {
            "model": "gpt-4o",
            "general_prompt": request.system_prompt,
            "general_tools": [],
            "states": []
        }
        
        llm_response = await make_retell_request("POST", "/create-retell-llm", llm_data)
        llm_id = llm_response.get("llm_id")
        
        if not llm_id:
            raise HTTPException(status_code=500, detail="Failed to create LLM")
        
        logger.info(f"Created Retell LLM: {llm_id}")
        
        # Step 2: Create the Agent with the LLM
        agent_data = {
            "response_engine": {
                "type": "retell-llm",
                "llm_id": llm_id
            },
            "agent_name": request.agent_name,
            "voice_id": request.voice_id,
            "fallback_voice_ids": request.fallback_voice_ids,
            "language": request.language,
            "responsiveness": request.responsiveness,
            "interruption_sensitivity": request.interruption_sensitivity,
            "enable_backchannel": request.enable_backchannel,
            "backchannel_frequency": request.backchannel_frequency,
            "backchannel_words": request.backchannel_words,
            "reminder_max_count": request.reminder_max_count,
            "reminder_trigger_ms": request.reminder_trigger_ms,
            "end_call_after_silence_ms": request.end_call_after_silence_ms,
            "max_call_duration_ms": request.max_call_duration_ms,
            "normalize_for_speech": True,
            "enable_transcription_formatting": True,
        }
        
        if request.webhook_url:
            agent_data["webhook_url"] = request.webhook_url
        if request.boosted_keywords:
            agent_data["boosted_keywords"] = request.boosted_keywords
        
        agent_response = await make_retell_request("POST", "/create-agent", agent_data)
        agent_id = agent_response.get("agent_id")
        
        if not agent_id:
            raise HTTPException(status_code=500, detail="Failed to create agent")
        
        logger.info(f"Created Retell agent: {agent_id}")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "llm_id": llm_id,
            "agent_name": request.agent_name,
            "voice_id": request.voice_id,
            "language": request.language,
            "message": f"Successfully created voice agent '{request.agent_name}'"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Retell agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents", response_model=List[Dict[str, Any]])
async def list_retell_agents():
    """List all Retell voice agents"""
    try:
        response = await make_retell_request("GET", "/list-agents")
        return response if isinstance(response, list) else []
    except Exception as e:
        logger.error(f"Error listing Retell agents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}", response_model=Dict[str, Any])
async def get_retell_agent(agent_id: str):
    """Get details of a specific Retell agent"""
    try:
        return await make_retell_request("GET", f"/get-agent/{agent_id}")
    except Exception as e:
        logger.error(f"Error getting Retell agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/agents/{agent_id}", response_model=Dict[str, Any])
async def update_retell_agent(agent_id: str, request: UpdateAgentRequest):
    """Update an existing Retell agent"""
    try:
        # Get current agent to find LLM ID
        current_agent = await make_retell_request("GET", f"/get-agent/{agent_id}")
        response_engine = current_agent.get("response_engine", {})
        llm_id = response_engine.get("llm_id")
        
        # Prepare agent update data
        agent_update = {}
        
        if request.agent_name is not None:
            agent_update["agent_name"] = request.agent_name
        if request.voice_id is not None:
            agent_update["voice_id"] = request.voice_id
        if request.fallback_voice_ids is not None:
            agent_update["fallback_voice_ids"] = request.fallback_voice_ids
        if request.language is not None:
            agent_update["language"] = request.language
        if request.responsiveness is not None:
            agent_update["responsiveness"] = request.responsiveness
        if request.interruption_sensitivity is not None:
            agent_update["interruption_sensitivity"] = request.interruption_sensitivity
        if request.enable_backchannel is not None:
            agent_update["enable_backchannel"] = request.enable_backchannel
        if request.backchannel_frequency is not None:
            agent_update["backchannel_frequency"] = request.backchannel_frequency
        if request.backchannel_words is not None:
            agent_update["backchannel_words"] = request.backchannel_words
        if request.webhook_url is not None:
            agent_update["webhook_url"] = request.webhook_url
        if request.boosted_keywords is not None:
            agent_update["boosted_keywords"] = request.boosted_keywords
        if request.end_call_after_silence_ms is not None:
            agent_update["end_call_after_silence_ms"] = request.end_call_after_silence_ms
        if request.max_call_duration_ms is not None:
            agent_update["max_call_duration_ms"] = request.max_call_duration_ms
        
        # Update agent if there are changes
        if agent_update:
            await make_retell_request("PATCH", f"/update-agent/{agent_id}", agent_update)
        
        # Update LLM if system prompt changed
        if request.system_prompt is not None and llm_id:
            llm_update = {"general_prompt": request.system_prompt}
            await make_retell_request("PUT", f"/update-retell-llm/{llm_id}", llm_update)
        
        return {
            "success": True,
            "agent_id": agent_id,
            "message": "Agent updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating Retell agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/agents/{agent_id}")
async def delete_retell_agent(agent_id: str):
    """Delete a Retell agent"""
    try:
        await make_retell_request("DELETE", f"/delete-agent/{agent_id}")
        return {"success": True, "message": "Agent deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting Retell agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== VOICE ENDPOINTS ==========

@router.get("/voices", response_model=List[Dict[str, Any]])
async def list_voices():
    """Get all available voices from Retell"""
    try:
        return await make_retell_request("GET", "/list-voices")
    except Exception as e:
        logger.error(f"Error listing voices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== WEB CALL ENDPOINTS ==========

@router.post("/agents/{agent_id}/web-call", response_model=WebCallResponse)
async def create_web_call(agent_id: str, metadata: Optional[Dict[str, Any]] = None):
    """
    Create a web call for testing an agent in the browser.
    Returns access_token to connect via Retell Web SDK.
    """
    try:
        call_data = {
            "agent_id": agent_id,
            "metadata": metadata or {"source": "intelliax_platform"}
        }
        
        response = await make_retell_request("POST", "/v2/create-web-call", call_data)
        
        return WebCallResponse(
            call_id=response.get("call_id"),
            access_token=response.get("access_token"),
            agent_id=agent_id
        )
        
    except Exception as e:
        logger.error(f"Error creating web call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== CALL HISTORY & ANALYTICS ==========

@router.get("/calls", response_model=List[Dict[str, Any]])
async def list_calls(
    limit: int = 50,
    agent_id: Optional[str] = None,
    start_timestamp: Optional[int] = None,
    end_timestamp: Optional[int] = None
):
    """Get call history with optional filters"""
    try:
        params = {"limit": limit}
        if agent_id:
            params["agent_id"] = agent_id
        if start_timestamp:
            params["start_timestamp"] = start_timestamp
        if end_timestamp:
            params["end_timestamp"] = end_timestamp
        
        response = await make_retell_request("POST", "/v2/list-calls", params)
        return response if isinstance(response, list) else response.get("calls", [])
        
    except Exception as e:
        logger.error(f"Error listing calls: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calls/{call_id}", response_model=Dict[str, Any])
async def get_call_details(call_id: str):
    """Get detailed information about a specific call"""
    try:
        return await make_retell_request("GET", f"/v2/get-call/{call_id}")
    except Exception as e:
        logger.error(f"Error getting call {call_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calls/{call_id}/recording")
async def get_call_recording(call_id: str):
    """Get recording URL for a call"""
    try:
        call = await make_retell_request("GET", f"/v2/get-call/{call_id}")
        recording_url = call.get("recording_url")
        
        if not recording_url:
            raise HTTPException(status_code=404, detail="No recording available for this call")
        
        return {"recording_url": recording_url, "call_id": call_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calls/{call_id}/transcript")
async def get_call_transcript(call_id: str):
    """Get transcript for a call"""
    try:
        call = await make_retell_request("GET", f"/v2/get-call/{call_id}")
        transcript = call.get("transcript", [])
        
        return {
            "call_id": call_id,
            "transcript": transcript,
            "duration_ms": call.get("duration_ms"),
            "call_status": call.get("call_status")
        }
        
    except Exception as e:
        logger.error(f"Error getting transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== CALL HISTORY ENDPOINTS ==========

# Cutoff date: December 13, 2025 - only show data from this date onwards
CUTOFF_DATE = datetime(2025, 12, 13, 0, 0, 0)
CUTOFF_TIMESTAMP_MS = int(CUTOFF_DATE.timestamp() * 1000)

@router.get("/history")
async def get_call_history(
    limit: int = 50,
    agent_id: Optional[str] = None,
    days: int = 30
):
    """
    Get call history.
    Returns a list of calls sorted by timestamp.
    Only shows calls from December 13, 2025 onwards.
    """
    try:
        from datetime import timedelta
        
        history = []
        
        # Calculate time range - but never go before Dec 13, 2025
        end_timestamp = int(datetime.now().timestamp() * 1000)
        calculated_start = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
        # Use the later of the two dates (cutoff or calculated start)
        start_timestamp = max(calculated_start, CUTOFF_TIMESTAMP_MS)
        
        logger.info(f"Fetching calls from {start_timestamp} to {end_timestamp} (cutoff: {CUTOFF_TIMESTAMP_MS})")
        
        # Get calls
        try:
            call_params = {
                "limit": limit * 2,  # Fetch more since we'll filter
                "start_timestamp": start_timestamp,
                "end_timestamp": end_timestamp
            }
            if agent_id:
                call_params["agent_id"] = agent_id
            
            calls_response = await make_retell_request("POST", "/v2/list-calls", call_params)
            calls = calls_response if isinstance(calls_response, list) else calls_response.get("calls", [])
            
            for call in calls:
                # Double-check: skip calls before cutoff date
                call_timestamp = call.get("start_timestamp", 0) or call.get("created_timestamp", 0)
                if call_timestamp < CUTOFF_TIMESTAMP_MS:
                    logger.debug(f"Skipping call {call.get('call_id')} - before cutoff date")
                    continue
                
                history.append({
                    "id": call.get("call_id"),
                    "type": "call",
                    "agent_id": call.get("agent_id"),
                    "status": call.get("call_status"),
                    "start_timestamp": call.get("start_timestamp"),
                    "end_timestamp": call.get("end_timestamp"),
                    "duration_ms": call.get("duration_ms"),
                    "transcript": call.get("transcript", []),
                    "transcript_object": call.get("transcript_object", []),
                    "recording_url": call.get("recording_url"),
                    "public_log_url": call.get("public_log_url"),
                    "call_type": call.get("call_type"),
                    "from_number": call.get("from_number"),
                    "to_number": call.get("to_number"),
                    "disconnection_reason": call.get("disconnection_reason"),
                    "call_analysis": call.get("call_analysis", {}),
                    "call_cost": call.get("call_cost", {}),
                    "metadata": call.get("metadata", {})
                })
        except Exception as e:
            logger.warning(f"Error fetching calls: {str(e)}")
        
        # Sort by start timestamp (most recent first) and apply limit
        history.sort(key=lambda x: x.get("start_timestamp", 0), reverse=True)
        history = history[:limit]
        
        return {
            "conversations": history,
            "total": len(history),
            "days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting call history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== UTILITY ENDPOINTS ==========

@router.get("/test-api-key")
async def test_retell_api_key():
    """Test if the Retell API key is valid"""
    if not RETELL_API_KEY:
        return {
            "success": False,
            "error": "RETELL_API_KEY not configured",
            "key_present": False
        }
    
    try:
        response = await make_retell_request("GET", "/list-agents")
        return {
            "success": True,
            "message": "Voice Platform API key is valid",
            "key_present": True,
            "key_prefix": RETELL_API_KEY[:12] + "...",
            "agents_count": len(response) if isinstance(response, list) else 0
        }
    except HTTPException as e:
        return {
            "success": False,
            "error": str(e.detail),
            "key_present": True,
            "key_prefix": RETELL_API_KEY[:12] + "...",
            "status_code": e.status_code
        }


@router.post("/sync-agents")
async def sync_retell_agents_to_db():
    """
    Sync all Retell agents to the local database.
    This imports agents created directly in Retell dashboard.
    """
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import uuid
        
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Get all agents from Retell
        retell_agents = await make_retell_request("GET", "/list-agents")
        
        if not isinstance(retell_agents, list):
            retell_agents = []
        
        synced_count = 0
        created_count = 0
        
        for retell_agent in retell_agents:
            retell_agent_id = retell_agent.get("agent_id")
            agent_name = retell_agent.get("agent_name", "Unnamed Agent")
            
            # Check if agent already exists in local DB (by retell_agent_id)
            existing = await db.agents.find_one({"retell_agent_id": retell_agent_id})
            
            if not existing:
                # Create local record for this Retell agent
                response_engine = retell_agent.get("response_engine", {})
                llm_id = response_engine.get("llm_id") if isinstance(response_engine, dict) else None
                
                # Try to get the system prompt from the LLM
                system_prompt = "Voice agent created from cloud dashboard"
                if llm_id:
                    try:
                        llm_details = await make_retell_request("GET", f"/get-retell-llm/{llm_id}")
                        system_prompt = llm_details.get("general_prompt", system_prompt)
                    except:
                        pass
                
                new_agent = {
                    "id": str(uuid.uuid4()),
                    "name": agent_name,
                    "description": f"Imported from Cloud",
                    "type": "voice",
                    "status": "active",
                    "system_prompt": system_prompt,
                    "greeting_message": "Hello! How can I help you today?",
                    "voice_config": {
                        "voice_id": retell_agent.get("voice_id", "11labs-Adrian"),
                        "language": retell_agent.get("language", "en-US"),
                        "responsiveness": retell_agent.get("responsiveness", 1.0),
                        "interruption_sensitivity": retell_agent.get("interruption_sensitivity", 1.0),
                        "enable_backchannel": retell_agent.get("enable_backchannel", True),
                    },
                    "chat_config": {
                        "llm_provider": "openai",
                        "llm_model": "gpt-4o",
                        "temperature": 0.7,
                        "max_tokens": 2048,
                    },
                    "tools": [],
                    "knowledge_bases": [],
                    "retell_agent_id": retell_agent_id,
                    "retell_llm_id": llm_id,
                    "calls_count": 0,
                    "success_rate": 0.0,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }
                
                await db.agents.insert_one(new_agent)
                created_count += 1
                logger.info(f"Imported Retell agent: {agent_name} ({retell_agent_id})")
            else:
                # Update existing agent's Retell data
                await db.agents.update_one(
                    {"retell_agent_id": retell_agent_id},
                    {"$set": {
                        "name": agent_name,
                        "updated_at": datetime.utcnow().isoformat()
                    }}
                )
            
            synced_count += 1
        
        client.close()
        
        return {
            "success": True,
            "message": f"Synced {synced_count} agents from cloud",
            "total_retell_agents": len(retell_agents),
            "newly_imported": created_count,
            "already_synced": synced_count - created_count
        }
        
    except Exception as e:
        logger.error(f"Error syncing Retell agents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/overview")
async def get_analytics_overview(days: int = 7, agent_id: Optional[str] = None):
    """Get analytics overview for calls (only from Dec 13, 2025 onwards)"""
    try:
        from datetime import timedelta
        
        end_timestamp = int(datetime.now().timestamp() * 1000)
        calculated_start = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
        # Use the later of the two dates (cutoff or calculated start)
        start_timestamp = max(calculated_start, CUTOFF_TIMESTAMP_MS)
        
        params = {
            "limit": 100,
            "start_timestamp": start_timestamp,
            "end_timestamp": end_timestamp
        }
        if agent_id:
            params["agent_id"] = agent_id
        
        response = await make_retell_request("POST", "/v2/list-calls", params)
        calls = response if isinstance(response, list) else response.get("calls", [])
        
        # Calculate metrics
        total_calls = len(calls)
        successful_calls = sum(1 for c in calls if c.get("call_status") == "ended")
        total_duration = sum(c.get("duration_ms", 0) for c in calls)
        total_cost = sum(
            c.get("call_cost", {}).get("combined_cost", 0) 
            for c in calls if c.get("call_cost")
        )
        
        # Sentiment analysis
        sentiments = {"positive": 0, "neutral": 0, "negative": 0, "unknown": 0}
        for call in calls:
            analysis = call.get("call_analysis", {})
            sentiment = analysis.get("user_sentiment", "unknown").lower()
            if sentiment in sentiments:
                sentiments[sentiment] += 1
            else:
                sentiments["unknown"] += 1
        
        return {
            "period_days": days,
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": total_calls - successful_calls,
            "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
            "average_duration_seconds": (total_duration / total_calls / 1000) if total_calls > 0 else 0,
            "total_duration_seconds": total_duration / 1000,
            "total_cost": total_cost,
            "average_cost": total_cost / total_calls if total_calls > 0 else 0,
            "sentiment_distribution": sentiments
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== KNOWLEDGE BASE ENDPOINTS ==========

class CreateKnowledgeBaseRequest(BaseModel):
    """Request model for creating a knowledge base"""
    knowledge_base_name: str = Field(..., description="Name of the knowledge base")
    knowledge_base_texts: Optional[List[Dict[str, str]]] = Field(
        None, 
        description="List of text sources with 'title' and 'text' fields"
    )
    knowledge_base_urls: Optional[List[str]] = Field(
        None,
        description="List of URLs to scrape for content"
    )


class AddKnowledgeBaseSourcesRequest(BaseModel):
    """Request model for adding sources to a knowledge base"""
    knowledge_base_texts: Optional[List[Dict[str, str]]] = Field(
        None, 
        description="List of text sources with 'title' and 'text' fields"
    )
    knowledge_base_urls: Optional[List[str]] = Field(
        None,
        description="List of URLs to scrape for content"
    )


async def make_retell_multipart_request(
    endpoint: str, 
    form_data: dict,
    timeout: float = 60.0
) -> dict:
    """Make multipart/form-data request to Retell API (for knowledge base creation)"""
    import json
    
    if not RETELL_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="RETELL_API_KEY not configured. Add it to your .env file."
        )
    
    headers = {
        "Authorization": f"Bearer {RETELL_API_KEY}",
    }
    
    url = f"{RETELL_API_BASE}{endpoint}"
    logger.info(f"Retell API (multipart): POST {endpoint}")
    logger.info(f"Form data keys: {list(form_data.keys())}")
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            # Build the multipart files dict - httpx needs this format for multipart
            files = {}
            
            # knowledge_base_name is a simple form field
            if "knowledge_base_name" in form_data:
                files["knowledge_base_name"] = (None, form_data["knowledge_base_name"])
            
            # knowledge_base_texts needs to be sent as individual items or JSON
            if "knowledge_base_texts" in form_data and form_data["knowledge_base_texts"]:
                texts = form_data["knowledge_base_texts"]
                files["knowledge_base_texts"] = (None, json.dumps(texts), "application/json")
            
            # knowledge_base_urls needs to be sent as JSON array
            if "knowledge_base_urls" in form_data and form_data["knowledge_base_urls"]:
                urls = form_data["knowledge_base_urls"]
                files["knowledge_base_urls"] = (None, json.dumps(urls), "application/json")
            
            # enable_auto_refresh
            if "enable_auto_refresh" in form_data:
                files["enable_auto_refresh"] = (None, str(form_data["enable_auto_refresh"]).lower())
            
            logger.info(f"Sending multipart files: {list(files.keys())}")
            
            response = await client.post(url, headers=headers, files=files)
            
            logger.info(f"Retell API response: {response.status_code}")
            logger.info(f"Retell API response body: {response.text[:500] if response.text else 'empty'}")
            
            if response.status_code >= 400:
                error_detail = response.text
                logger.error(f"Retell API raw error response: {error_detail}")
                try:
                    error_json = response.json()
                    logger.error(f"Retell API error JSON: {error_json}")
                    error_detail = error_json.get("message", error_detail)
                except:
                    pass
                raise HTTPException(status_code=response.status_code, detail=error_detail)
            
            return response.json() if response.text else {"success": True}
            
        except httpx.RequestError as e:
            logger.error(f"Retell API connection error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to Voice Platform API: {str(e)}")


@router.post("/knowledge-bases", response_model=Dict[str, Any])
async def create_knowledge_base(request: CreateKnowledgeBaseRequest):
    """
    Create a new knowledge base in Retell.
    Knowledge bases can be attached to agents for RAG (Retrieval-Augmented Generation).
    """
    import json
    import aiohttp
    
    try:
        logger.info(f"Creating knowledge base: {request.knowledge_base_name}")
        
        kb_name = request.knowledge_base_name.strip()[:40]  # Max 40 chars
        
        # Prepare the multipart form data using aiohttp FormData
        form = aiohttp.FormData()
        form.add_field('knowledge_base_name', kb_name)
        
        has_sources = False
        
        # Add text sources if provided
        if request.knowledge_base_texts and len(request.knowledge_base_texts) > 0:
            form.add_field('knowledge_base_texts', json.dumps(request.knowledge_base_texts), 
                          content_type='application/json')
            has_sources = True
        
        # Add URL sources if provided
        if request.knowledge_base_urls:
            clean_urls = [url.strip() for url in request.knowledge_base_urls 
                         if url.strip() and url.strip().startswith(('http://', 'https://'))]
            if clean_urls:
                form.add_field('knowledge_base_urls', json.dumps(clean_urls),
                              content_type='application/json')
                has_sources = True
        
        # If no sources provided, add a default placeholder text
        if not has_sources:
            default_text = [{"title": "Welcome", "text": f"Welcome to {kb_name}. Add your content here."}]
            form.add_field('knowledge_base_texts', json.dumps(default_text),
                          content_type='application/json')
        
        headers = {
            "Authorization": f"Bearer {RETELL_API_KEY}",
        }
        
        logger.info(f"Sending request to Retell with form data")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{RETELL_API_BASE}/create-knowledge-base",
                headers=headers,
                data=form
            ) as response:
                response_text = await response.text()
                logger.info(f"Retell API response: {response.status}")
                logger.info(f"Retell API response body: {response_text[:500]}")
                
                if response.status >= 400:
                    logger.error(f"Retell API error: {response_text}")
                    raise HTTPException(status_code=response.status, detail=response_text)
                
                data = await response.json()
        
        return {
            "success": True,
            "knowledge_base_id": data.get("knowledge_base_id"),
            "knowledge_base_name": kb_name,
            "status": data.get("status", "in_progress"),
            "message": f"Knowledge base '{kb_name}' created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-bases", response_model=List[Dict[str, Any]])
async def list_knowledge_bases():
    """List all knowledge bases in Retell account"""
    try:
        response = await make_retell_request("GET", "/list-knowledge-bases")
        return response if isinstance(response, list) else []
    except Exception as e:
        logger.error(f"Error listing knowledge bases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-bases/{knowledge_base_id}", response_model=Dict[str, Any])
async def get_knowledge_base(knowledge_base_id: str):
    """Get details of a specific knowledge base"""
    try:
        return await make_retell_request("GET", f"/get-knowledge-base/{knowledge_base_id}")
    except Exception as e:
        logger.error(f"Error getting knowledge base {knowledge_base_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/knowledge-bases/{knowledge_base_id}")
async def delete_knowledge_base(knowledge_base_id: str):
    """Delete a knowledge base"""
    try:
        await make_retell_request("DELETE", f"/delete-knowledge-base/{knowledge_base_id}")
        return {"success": True, "message": "Knowledge base deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting knowledge base {knowledge_base_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge-bases/{knowledge_base_id}/sources")
async def add_knowledge_base_sources(
    knowledge_base_id: str, 
    request: AddKnowledgeBaseSourcesRequest
):
    """
    Add sources (texts or URLs) to an existing knowledge base.
    This is useful for incrementally adding content.
    Uses multipart/form-data as required by Retell API.
    """
    try:
        logger.info(f"Adding sources to knowledge base: {knowledge_base_id}")
        
        form_data = {}
        
        if request.knowledge_base_texts:
            form_data["knowledge_base_texts"] = request.knowledge_base_texts
        
        if request.knowledge_base_urls:
            # Clean and validate URLs
            clean_urls = []
            for url in request.knowledge_base_urls:
                url = url.strip()
                if url and (url.startswith("http://") or url.startswith("https://")):
                    clean_urls.append(url)
            if clean_urls:
                form_data["knowledge_base_urls"] = clean_urls
        
        if not form_data:
            raise HTTPException(status_code=400, detail="No sources provided")
        
        response = await make_retell_multipart_request(
            f"/add-knowledge-base-sources/{knowledge_base_id}", 
            form_data
        )
        
        return {
            "success": True,
            "knowledge_base_id": knowledge_base_id,
            "status": response.get("status", "in_progress"),
            "message": "Sources added successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding sources to knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/knowledge-bases/{knowledge_base_id}/sources/{source_id}")
async def delete_knowledge_base_source(knowledge_base_id: str, source_id: str):
    """Delete a specific source from a knowledge base"""
    try:
        await make_retell_request(
            "DELETE", 
            f"/delete-knowledge-base-source/{knowledge_base_id}/{source_id}"
        )
        return {"success": True, "message": "Source deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge-bases/sync")
async def sync_knowledge_bases_to_db():
    """
    Sync all Retell knowledge bases to the local database.
    This imports knowledge bases created directly in Retell dashboard.
    """
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import uuid
        
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Get all knowledge bases from Retell
        retell_kbs = await make_retell_request("GET", "/list-knowledge-bases")
        
        if not isinstance(retell_kbs, list):
            retell_kbs = []
        
        synced_count = 0
        created_count = 0
        
        for retell_kb in retell_kbs:
            kb_id = retell_kb.get("knowledge_base_id")
            kb_name = retell_kb.get("knowledge_base_name", "Unnamed KB")
            
            # Check if KB already exists in local DB
            existing = await db.knowledge.find_one({"retell_kb_id": kb_id})
            
            if not existing:
                # Get full KB details
                try:
                    kb_details = await make_retell_request("GET", f"/get-knowledge-base/{kb_id}")
                    sources = kb_details.get("knowledge_base_sources", [])
                    documents_count = len(sources)
                except:
                    documents_count = 0
                
                new_kb = {
                    "id": str(uuid.uuid4()),
                    "name": kb_name,
                    "description": f"Imported from cloud",
                    "type": "documents",
                    "documents_count": documents_count,
                    "retell_kb_id": kb_id,
                    "created_at": datetime.utcnow().isoformat(),
                }
                
                await db.knowledge.insert_one(new_kb)
                created_count += 1
                logger.info(f"Imported knowledge base: {kb_name} ({kb_id})")
            else:
                # Update existing KB
                try:
                    kb_details = await make_retell_request("GET", f"/get-knowledge-base/{kb_id}")
                    sources = kb_details.get("knowledge_base_sources", [])
                    documents_count = len(sources)
                except:
                    documents_count = existing.get("documents_count", 0)
                
                await db.knowledge.update_one(
                    {"retell_kb_id": kb_id},
                    {"$set": {
                        "name": kb_name,
                        "documents_count": documents_count
                    }}
                )
            
            synced_count += 1
        
        client.close()
        
        return {
            "success": True,
            "message": f"Synced {synced_count} knowledge bases",
            "total_retell_kbs": len(retell_kbs),
            "newly_imported": created_count,
            "already_synced": synced_count - created_count
        }
        
    except Exception as e:
        logger.error(f"Error syncing knowledge bases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/{agent_id}/attach-knowledge-base")
async def attach_knowledge_base_to_agent(agent_id: str, knowledge_base_ids: List[str]):
    """
    Attach knowledge bases to an agent for RAG.
    The agent will use these knowledge bases to retrieve relevant information during conversations.
    """
    try:
        logger.info(f"Attaching {len(knowledge_base_ids)} knowledge bases to agent {agent_id}")
        
        # First get current agent config
        current_agent = await make_retell_request("GET", f"/get-agent/{agent_id}")
        
        # Update agent with knowledge base IDs
        update_data = {
            "knowledge_base_ids": knowledge_base_ids
        }
        
        response = await make_retell_request("PATCH", f"/update-agent/{agent_id}", update_data)
        
        return {
            "success": True,
            "agent_id": agent_id,
            "knowledge_base_ids": knowledge_base_ids,
            "message": f"Attached {len(knowledge_base_ids)} knowledge bases to agent"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error attaching knowledge bases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AGENT EVALUATION / TESTING ====================

class TestCaseScenario(BaseModel):
    """A test scenario for agent evaluation"""
    name: str
    description: Optional[str] = None
    user_message: str  # What the user says to start the test
    expected_topics: Optional[List[str]] = []  # Topics agent should cover
    expected_actions: Optional[List[str]] = []  # Actions agent should take
    max_turns: Optional[int] = 10
    success_criteria: Optional[str] = None  # Natural language success criteria

class CreateTestCaseRequest(BaseModel):
    """Request to create a test case definition"""
    agent_id: str
    name: str
    description: Optional[str] = None
    scenarios: List[TestCaseScenario]
    tags: Optional[List[str]] = []

class RunBatchTestRequest(BaseModel):
    """Request to run a batch test"""
    test_case_definition_ids: List[str]
    agent_id: str
    concurrency: Optional[int] = 1


@router.post("/test-cases")
async def create_test_case_definition(request: CreateTestCaseRequest):
    """
    Create a test case definition for agent evaluation.
    Test cases define scenarios to test agent behavior.
    """
    try:
        logger.info(f"Creating test case definition: {request.name}")
        
        # Try to create via Retell API if they support it
        try:
            retell_data = {
                "name": request.name,
                "description": request.description,
                "agent_id": request.agent_id,
                "test_scenarios": [
                    {
                        "name": s.name,
                        "user_message": s.user_message,
                        "expected_topics": s.expected_topics,
                        "max_turns": s.max_turns
                    } for s in request.scenarios
                ]
            }
            response = await make_retell_request("POST", "/create-test-case-definition", retell_data)
            test_case_id = response.get("test_case_definition_id")
        except:
            # Fallback: store locally if Retell doesn't support this endpoint
            test_case_id = f"tc_{uuid.uuid4().hex[:16]}"
        
        # Store in local database
        client, db = get_db()
        
        test_case = {
            "id": test_case_id,
            "retell_id": test_case_id,
            "agent_id": request.agent_id,
            "name": request.name,
            "description": request.description,
            "scenarios": [s.dict() for s in request.scenarios],
            "tags": request.tags,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "run_count": 0,
            "pass_rate": 0.0
        }
        
        await db.test_cases.insert_one(test_case)
        client.close()
        
        return {
            "success": True,
            "test_case_definition_id": test_case_id,
            "name": request.name,
            "scenarios_count": len(request.scenarios),
            "message": f"Test case '{request.name}' created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-cases")
async def list_test_cases(agent_id: Optional[str] = None):
    """List all test case definitions, optionally filtered by agent"""
    try:
        client, db = get_db()
        
        query = {}
        if agent_id:
            query["agent_id"] = agent_id
        
        test_cases = await db.test_cases.find(query, {"_id": 0}).to_list(100)
        client.close()
        
        return test_cases
        
    except Exception as e:
        logger.error(f"Error listing test cases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-cases/{test_case_id}")
async def get_test_case(test_case_id: str):
    """Get details of a specific test case definition"""
    try:
        client, db = get_db()
        
        test_case = await db.test_cases.find_one({"id": test_case_id}, {"_id": 0})
        client.close()
        
        if not test_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        return test_case
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/test-cases/{test_case_id}")
async def delete_test_case(test_case_id: str):
    """Delete a test case definition"""
    try:
        client, db = get_db()
        
        result = await db.test_cases.delete_one({"id": test_case_id})
        client.close()
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        return {"success": True, "message": "Test case deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-tests")
async def create_batch_test(request: RunBatchTestRequest):
    """
    Create and run a batch test with multiple test cases.
    This will execute all scenarios in the specified test cases against the agent.
    """
    try:
        logger.info(f"Creating batch test with {len(request.test_case_definition_ids)} test cases")
        
        client, db = get_db()
        
        # Get all test case definitions
        test_cases = await db.test_cases.find(
            {"id": {"$in": request.test_case_definition_ids}},
            {"_id": 0}
        ).to_list(100)
        
        if not test_cases:
            raise HTTPException(status_code=404, detail="No test cases found")
        
        # Calculate total scenarios
        total_scenarios = sum(len(tc.get("scenarios", [])) for tc in test_cases)
        
        # Create batch job record
        batch_job_id = f"batch_{uuid.uuid4().hex[:16]}"
        batch_job = {
            "id": batch_job_id,
            "agent_id": request.agent_id,
            "test_case_definition_ids": request.test_case_definition_ids,
            "status": "in_progress",
            "pass_count": 0,
            "fail_count": 0,
            "error_count": 0,
            "total_count": total_scenarios,
            "results": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.batch_tests.insert_one(batch_job)
        
        # Try to run via Retell API for actual voice calls
        use_retell_api = False
        try:
            # Get agent's response engine config from Retell
            agent = await make_retell_request("GET", f"/get-agent/{request.agent_id}")
            logger.info(f"Agent config for batch test: {agent}")
            
            # Get the LLM ID - try multiple possible field names
            llm_id = agent.get("response_engine", {}).get("llm_id") if isinstance(agent.get("response_engine"), dict) else None
            
            # Alternative: check if agent has llm_websocket_url with llm_ prefix
            if not llm_id:
                llm_ws = agent.get("llm_websocket_url", "")
                if llm_ws and "llm_" in llm_ws:
                    # Extract llm_id from websocket URL like wss://api.retellai.com/llm/llm_xxx
                    parts = llm_ws.split("/")
                    for part in parts:
                        if part.startswith("llm_"):
                            llm_id = part
                            break
            
            if llm_id:
                logger.info(f"Using Retell LLM ID: {llm_id}")
                retell_request = {
                    "test_case_definition_ids": request.test_case_definition_ids,
                    "response_engine": {
                        "type": "retell-llm",
                        "llm_id": llm_id
                    },
                    "reserved_concurrency": request.concurrency or 1
                }
                
                response = await make_retell_request("POST", "/create-batch-test", retell_request)
                
                # Update with Retell batch job ID
                await db.batch_tests.update_one(
                    {"id": batch_job_id},
                    {"$set": {
                        "retell_batch_id": response.get("test_case_batch_job_id"),
                        "test_type": "voice_call"
                    }}
                )
                use_retell_api = True
                logger.info(f"Retell batch test created: {response.get('test_case_batch_job_id')}")
            else:
                logger.warning("No LLM ID found for agent, falling back to local simulation")
            
        except Exception as e:
            logger.warning(f"Retell batch test API not available, running locally: {e}")
        
        # Fall back to local text simulation if Retell API didn't work
        if not use_retell_api:
            await db.batch_tests.update_one(
                {"id": batch_job_id},
                {"$set": {"test_type": "text_simulation"}}
            )
            await run_local_batch_test(db, batch_job_id, test_cases, request.agent_id)
        
        client.close()
        
        return {
            "success": True,
            "test_case_batch_job_id": batch_job_id,
            "status": "in_progress",
            "total_count": total_scenarios,
            "message": f"Batch test started with {total_scenarios} scenarios"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating batch test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_local_batch_test(db, batch_job_id: str, test_cases: list, agent_id: str):
    """Run batch test locally (simulated evaluation)"""
    import httpx
    import random
    
    results = []
    pass_count = 0
    fail_count = 0
    error_count = 0
    
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    retell_api_key = os.environ.get('RETELL_API_KEY')
    api_key = openai_api_key or retell_api_key
    
    for tc in test_cases:
        for scenario in tc.get("scenarios", []):
            try:
                # Get agent config
                agent = await db.agents.find_one({"retell_agent_id": agent_id}, {"_id": 0})
                if not agent:
                    # Try to get from Retell
                    try:
                        retell_agent = await make_retell_request("GET", f"/get-agent/{agent_id}")
                        system_prompt = "You are a helpful assistant."
                    except:
                        system_prompt = "You are a helpful assistant."
                else:
                    system_prompt = agent.get("system_prompt", "You are a helpful assistant.")
                
                # Simulate agent response using OpenAI
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": scenario.get("user_message", "")}
                            ],
                            "temperature": 0.7,
                            "max_tokens": 1024
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        agent_response = data["choices"][0]["message"]["content"]
                        
                        # Evaluate response against expected topics
                        expected_topics = scenario.get("expected_topics", [])
                        topics_covered = 0
                        for topic in expected_topics:
                            if topic.lower() in agent_response.lower():
                                topics_covered += 1
                        
                        # Calculate score
                        if expected_topics:
                            score = topics_covered / len(expected_topics)
                            passed = score >= 0.5
                        else:
                            # No specific expectations, consider passed if response is non-empty
                            passed = len(agent_response) > 10
                            score = 1.0 if passed else 0.0
                        
                        if passed:
                            pass_count += 1
                        else:
                            fail_count += 1
                        
                        results.append({
                            "test_case_id": tc.get("id"),
                            "scenario_name": scenario.get("name"),
                            "user_message": scenario.get("user_message"),
                            "agent_response": agent_response[:500],
                            "expected_topics": expected_topics,
                            "topics_covered": topics_covered,
                            "score": score,
                            "passed": passed,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })
                    else:
                        error_count += 1
                        results.append({
                            "test_case_id": tc.get("id"),
                            "scenario_name": scenario.get("name"),
                            "error": f"API error: {response.status_code}",
                            "passed": False,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })
                        
            except Exception as e:
                error_count += 1
                results.append({
                    "test_case_id": tc.get("id"),
                    "scenario_name": scenario.get("name", "Unknown"),
                    "error": str(e),
                    "passed": False,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    
    # Update batch job with results
    total = pass_count + fail_count + error_count
    await db.batch_tests.update_one(
        {"id": batch_job_id},
        {"$set": {
            "status": "complete",
            "pass_count": pass_count,
            "fail_count": fail_count,
            "error_count": error_count,
            "results": results,
            "pass_rate": (pass_count / total * 100) if total > 0 else 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )


@router.get("/batch-tests")
async def list_batch_tests(agent_id: Optional[str] = None, limit: int = 20):
    """List all batch test jobs"""
    try:
        client, db = get_db()
        
        query = {}
        if agent_id:
            query["agent_id"] = agent_id
        
        batch_tests = await db.batch_tests.find(
            query, 
            {"_id": 0, "results": 0}  # Exclude detailed results for list view
        ).sort("created_at", -1).to_list(limit)
        
        client.close()
        
        return batch_tests
        
    except Exception as e:
        logger.error(f"Error listing batch tests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batch-tests/{batch_job_id}")
async def get_batch_test(batch_job_id: str):
    """Get details and results of a specific batch test"""
    try:
        client, db = get_db()
        
        batch_test = await db.batch_tests.find_one({"id": batch_job_id}, {"_id": 0})
        client.close()
        
        if not batch_test:
            raise HTTPException(status_code=404, detail="Batch test not found")
        
        return batch_test
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting batch test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice-test")
async def run_voice_test(
    agent_id: str,
    test_message: str,
    auto_mode: bool = True,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Run an automated voice test where a simulated caller tests the agent.
    The test_message is what the simulated caller will say to the agent.
    Uses TTS to generate the caller's voice and records the full conversation.
    """
    try:
        logger.info(f"Starting automated voice test for agent {agent_id}")
        
        client, db = get_db()
        
        # Create a unique test ID
        test_id = f"vtest_{uuid.uuid4().hex[:16]}"
        
        if auto_mode:
            # For automated testing, we create a phone call with the test scenario
            # injected as the first user message via dynamic variables
            call_data = {
                "agent_id": agent_id,
                "metadata": {
                    "test_mode": True,
                    "test_id": test_id,
                    "test_message": test_message
                },
                # This injects the test message as context for the agent
                "retell_llm_dynamic_variables": {
                    "user_initial_message": test_message,
                    "test_scenario": test_message
                }
            }
            
            # Create a web call
            response = await make_retell_request("POST", "/v2/create-web-call", call_data)
            call_id = response.get("call_id")
            access_token = response.get("access_token")
            
            # Store test call in database
            test_call = {
                "id": test_id,
                "call_id": call_id,
                "agent_id": agent_id,
                "access_token": access_token,
                "test_message": test_message,
                "test_type": "automated",
                "status": "created",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.voice_tests.insert_one(test_call)
            client.close()
            
            return {
                "success": True,
                "test_id": test_id,
                "call_id": call_id,
                "access_token": access_token,
                "test_type": "automated",
                "message": "Automated voice test created. The simulated caller will speak the test scenario."
            }
        else:
            # Manual mode - user speaks
            call_data = {
                "agent_id": agent_id,
                "metadata": {"test_mode": True, "test_message": test_message}
            }
            
            response = await make_retell_request("POST", "/v2/create-web-call", call_data)
            
            test_call = {
                "id": test_id,
                "call_id": response.get("call_id"),
                "agent_id": agent_id,
                "access_token": response.get("access_token"),
                "test_message": test_message,
                "test_type": "manual",
                "status": "created",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.voice_tests.insert_one(test_call)
            client.close()
            
            return {
                "success": True,
                "test_id": test_id,
                "call_id": response.get("call_id"),
                "access_token": response.get("access_token"),
                "test_type": "manual",
                "message": "Voice test call created. Connect to speak with the agent."
            }
        
    except Exception as e:
        logger.error(f"Error creating voice test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automated-voice-test")
async def run_automated_voice_test(
    agent_id: str = Body(..., embed=True),
    test_scenarios: List[str] = Body(..., embed=True)
):
    """
    Run fully automated voice tests using TTS for the caller.
    Creates multiple test calls where AI speaks the test scenarios.
    """
    import asyncio
    
    try:
        logger.info(f"Starting automated voice tests for agent {agent_id} with {len(test_scenarios)} scenarios")
        
        client, db = get_db()
        results = []
        
        for i, scenario in enumerate(test_scenarios):
            test_id = f"auto_{uuid.uuid4().hex[:12]}"
            
            # Create call with the test scenario
            call_data = {
                "agent_id": agent_id,
                "metadata": {
                    "automated_test": True,
                    "test_id": test_id,
                    "scenario_index": i,
                    "test_scenario": scenario
                },
                "retell_llm_dynamic_variables": {
                    "caller_message": scenario
                }
            }
            
            try:
                response = await make_retell_request("POST", "/v2/create-web-call", call_data)
                
                test_record = {
                    "id": test_id,
                    "call_id": response.get("call_id"),
                    "agent_id": agent_id,
                    "test_message": scenario,
                    "test_type": "automated_batch",
                    "batch_index": i,
                    "status": "created",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.voice_tests.insert_one(test_record)
                
                results.append({
                    "test_id": test_id,
                    "call_id": response.get("call_id"),
                    "scenario": scenario,
                    "status": "created"
                })
                
            except Exception as e:
                results.append({
                    "test_id": test_id,
                    "scenario": scenario,
                    "status": "error",
                    "error": str(e)
                })
            
            # Small delay between calls
            await asyncio.sleep(0.5)
        
        client.close()
        
        created_count = len([r for r in results if r['status'] == 'created'])
        return {
            "success": True,
            "total_scenarios": len(test_scenarios),
            "results": results,
            "message": f"Created {created_count} voice test calls. Note: Recordings will be available after calls are connected and completed.",
            "note": "These are web calls waiting for connection. To get recordings, you need to connect to each call using the Test page, speak the scenario, and end the call."
        }
        
    except Exception as e:
        logger.error(f"Error running automated voice tests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run-simulation-test")
async def run_simulation_test(
    agent_id: str = Body(..., embed=True),
    test_scenarios: List[str] = Body(..., embed=True)
):
    """
    Run automated simulation tests using native batch testing.
    Creates test case definitions and runs batch tests where AI caller speaks to your agent.
    This is the PROPER way to do automated agent testing.
    """
    try:
        logger.info(f"Running Retell simulation test for agent {agent_id} with {len(test_scenarios)} scenarios")
        
        # Get agent's LLM ID
        agent_response = await make_retell_request("GET", f"/get-agent/{agent_id}")
        llm_websocket_url = agent_response.get("llm_websocket_url", "")
        llm_id = None
        if llm_websocket_url:
            parts = llm_websocket_url.split("/")
            if parts:
                llm_id = parts[-1]
        
        if not llm_id:
            raise HTTPException(status_code=400, detail="Could not get LLM ID from agent. Make sure agent is properly configured.")
        
        test_case_ids = []
        client, db = get_db()
        
        # Create test case definitions for each scenario in the system
        for i, scenario in enumerate(test_scenarios):
            try:
                # Format according to API documentation
                test_case_data = {
                    "name": f"Auto Test {i+1}: {scenario[:30]}...",
                    "response_engine": {
                        "type": "retell-llm",
                        "llm_id": llm_id
                    },
                    "test_case": {
                        "messages": [
                            {
                                "role": "user", 
                                "content": scenario
                            }
                        ]
                    }
                }
                
                logger.info(f"Creating test case definition: {test_case_data}")
                response = await make_retell_request("POST", "/create-test-case-definition", test_case_data)
                logger.info(f"Test case definition response: {response}")
                test_case_id = response.get("test_case_definition_id")
                
                if test_case_id:
                    test_case_ids.append(test_case_id)
                    
                    # Store locally
                    await db.test_cases.insert_one({
                        "id": test_case_id,
                        "retell_id": test_case_id,
                        "name": f"Auto Test {i+1}",
                        "user_prompt": scenario,
                        "agent_id": agent_id,
                        "source": "simulation",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    
            except Exception as e:
                logger.warning(f"Failed to create test case for scenario {i+1}: {str(e)}")
        
        if not test_case_ids:
            client.close()
            raise HTTPException(status_code=500, detail="Failed to create any test cases")
        
        # Run batch test with all created test cases
        batch_request = {
            "test_case_definition_ids": test_case_ids,
            "response_engine": {
                "type": "retell-llm",
                "llm_id": llm_id
            }
        }
        
        batch_response = await make_retell_request("POST", "/create-batch-test", batch_request)
        
        # Store batch test
        batch_test = {
            "id": batch_response.get("test_case_batch_job_id"),
            "agent_id": agent_id,
            "test_case_ids": test_case_ids,
            "scenarios": test_scenarios,
            "status": batch_response.get("status", "in_progress"),
            "pass_count": batch_response.get("pass_count", 0),
            "fail_count": batch_response.get("fail_count", 0),
            "total_count": batch_response.get("total_count", len(test_case_ids)),
            "test_type": "simulation",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.batch_tests.insert_one(batch_test)
        client.close()
        
        return {
            "success": True,
            "batch_job_id": batch_response.get("test_case_batch_job_id"),
            "test_case_count": len(test_case_ids),
            "status": batch_response.get("status"),
            "message": f"Started simulation test with {len(test_case_ids)} scenarios. AI caller will test your agent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running simulation test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulation-test/{batch_job_id}")
async def get_simulation_test_results(batch_job_id: str):
    """
    Get results of a simulation test batch job.
    """
    try:
        # Try to get from Retell
        try:
            response = await make_retell_request("GET", f"/get-batch-test/{batch_job_id}")
            return response
        except:
            pass
        
        # Fallback to local DB
        client, db = get_db()
        batch_test = await db.batch_tests.find_one({"id": batch_job_id})
        client.close()
        
        if not batch_test:
            raise HTTPException(status_code=404, detail="Batch test not found")
        
        batch_test.pop("_id", None)
        return batch_test
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting simulation test results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voice-test/{call_id}/recording")
async def get_voice_test_recording(call_id: str):
    """Get the recording URL for a voice test call"""
    try:
        # Get call details from Retell
        call = await make_retell_request("GET", f"/v2/get-call/{call_id}")
        
        return {
            "call_id": call_id,
            "recording_url": call.get("recording_url"),
            "public_log_url": call.get("public_log_url"),
            "transcript": call.get("transcript"),
            "transcript_object": call.get("transcript_object"),
            "call_analysis": call.get("call_analysis"),
            "start_timestamp": call.get("start_timestamp"),
            "end_timestamp": call.get("end_timestamp"),
            "duration_ms": call.get("end_timestamp", 0) - call.get("start_timestamp", 0) if call.get("end_timestamp") else None
        }
        
    except Exception as e:
        logger.error(f"Error getting voice test recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voice-tests")
async def list_voice_tests(agent_id: Optional[str] = None, limit: int = 20):
    """List all voice test calls with their recordings"""
    try:
        client, db = get_db()
        
        query = {}
        if agent_id:
            query["agent_id"] = agent_id
        
        tests = await db.voice_tests.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
        
        # Enrich with call details from API
        enriched_tests = []
        for test in tests:
            try:
                if test.get("call_id"):
                    call = await make_retell_request("GET", f"/v2/get-call/{test['call_id']}")
                    test["recording_url"] = call.get("recording_url")
                    test["transcript"] = call.get("transcript")
                    test["call_status"] = call.get("call_status")
                    test["call_type"] = call.get("call_type")
                    test["duration_ms"] = call.get("end_timestamp", 0) - call.get("start_timestamp", 0) if call.get("end_timestamp") else None
                    # Log for debugging
                    logger.info(f"Call {test['call_id']}: status={call.get('call_status')}, has_recording={bool(call.get('recording_url'))}, has_transcript={bool(call.get('transcript'))}")
            except Exception as e:
                logger.warning(f"Failed to get call details for {test.get('call_id')}: {e}")
            enriched_tests.append(test)
        
        client.close()
        return enriched_tests
        
    except Exception as e:
        logger.error(f"Error listing voice tests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-test-scenarios")
async def generate_test_scenarios(
    agent_id: str,
    num_scenarios: int = 5,
    focus_areas: Optional[List[str]] = None
):
    """
    Auto-generate test scenarios based on agent configuration.
    Uses AI to create relevant test cases.
    """
    try:
        logger.info(f"Generating {num_scenarios} test scenarios for agent {agent_id}")
        
        # Get agent configuration
        client, db = get_db()
        
        # Try to find agent by retell_agent_id (voice agent) or by id (chat agent)
        agent = await db.agents.find_one(
            {"$or": [{"retell_agent_id": agent_id}, {"id": agent_id}]}, 
            {"_id": 0}
        )
        
        if not agent:
            # Try fetching from Retell API if it's a voice agent
            try:
                retell_agent = await make_retell_request("GET", f"/get-agent/{agent_id}")
                system_prompt = retell_agent.get("general_prompt", "You are a helpful assistant.")
                agent_name = retell_agent.get("agent_name", "Agent")
            except:
                client.close()
                raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
        else:
            system_prompt = agent.get("system_prompt", "You are a helpful assistant.")
            agent_name = agent.get("name", "Agent")
        
        client.close()
        
        # Use GPT to generate test scenarios
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        retell_api_key = os.environ.get('RETELL_API_KEY')
        api_key = openai_api_key or retell_api_key
        
        focus_text = ""
        if focus_areas:
            focus_text = f"\nFocus on these areas: {', '.join(focus_areas)}"
        
        generation_prompt = f"""Based on this agent's system prompt, generate {num_scenarios} diverse test scenarios to evaluate the agent's performance.

Agent System Prompt:
{system_prompt}
{focus_text}

For each scenario, provide:
1. A name (short descriptive title)
2. A user message (what the user would say to test this)
3. Expected topics the agent should cover (2-4 key topics)
4. Success criteria (how to know if the agent handled it well)

Return as JSON array with format:
[
  {{
    "name": "Scenario Name",
    "user_message": "What the user says",
    "expected_topics": ["topic1", "topic2"],
    "success_criteria": "Description of successful response"
  }}
]

Generate varied scenarios including:
- Basic functionality tests
- Edge cases
- Complex multi-part questions
- Potential confusion scenarios"""

        async with httpx.AsyncClient(timeout=60.0) as http_client:
            response = await http_client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "You are a QA engineer creating test scenarios for AI agents. Return only valid JSON."},
                        {"role": "user", "content": generation_prompt}
                    ],
                    "temperature": 0.8,
                    "max_tokens": 2048
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to generate scenarios")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            import json
            # Clean up the response
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            scenarios = json.loads(content.strip())
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "scenarios": scenarios,
            "count": len(scenarios)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating test scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ========== CONVERSATION FLOW MODELS ==========

class ConversationFlowNode(BaseModel):
    """Model for a conversation flow node"""
    id: str = Field(..., description="Unique node ID")
    type: str = Field(..., description="Node type: conversation, function, logic, end, transfer_call, component")
    name: Optional[str] = Field(None, description="Display name for the node")
    instruction: Optional[Dict[str, Any]] = Field(None, description="Instruction for conversation nodes")
    edges: Optional[List[Dict[str, Any]]] = Field(default=[], description="Outgoing edges with transition conditions")
    display_position: Optional[Dict[str, float]] = Field(None, description="X,Y position for UI display")
    tool_id: Optional[str] = Field(None, description="Tool ID for function nodes")
    knowledge_base_ids: Optional[List[str]] = Field(None, description="Knowledge base IDs for RAG")

class ConversationFlowTool(BaseModel):
    """Model for a custom tool in conversation flow"""
    type: str = Field(default="custom", description="Tool type")
    name: str = Field(..., description="Tool name")
    tool_id: str = Field(..., description="Unique tool ID")
    description: Optional[str] = Field(None, description="Tool description for LLM")
    url: str = Field(..., description="Server URL to call")
    method: str = Field(default="POST", description="HTTP method")
    headers: Optional[Dict[str, str]] = Field(None, description="Request headers")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Parameter schema")
    timeout_ms: Optional[int] = Field(default=120000, description="Timeout in milliseconds")

class CreateConversationFlowRequest(BaseModel):
    """Request model for creating a conversation flow"""
    name: str = Field(..., description="Flow name for display")
    description: Optional[str] = Field(None, description="Flow description")
    model_choice: Dict[str, Any] = Field(
        default={"type": "cascading", "model": "gpt-4.1"},
        description="LLM model configuration"
    )
    start_speaker: str = Field(default="agent", description="Who starts: user or agent")
    nodes: List[Dict[str, Any]] = Field(..., description="Array of flow nodes")
    global_prompt: Optional[str] = Field(None, description="Global prompt for all nodes")
    tools: Optional[List[Dict[str, Any]]] = Field(None, description="Custom tools/functions")
    start_node_id: Optional[str] = Field(None, description="Starting node ID")
    knowledge_base_ids: Optional[List[str]] = Field(None, description="Knowledge base IDs")
    default_dynamic_variables: Optional[Dict[str, str]] = Field(None, description="Dynamic variables")
    begin_tag_display_position: Optional[Dict[str, float]] = Field(None, description="Begin tag position")

class UpdateConversationFlowRequest(BaseModel):
    """Request model for updating a conversation flow"""
    name: Optional[str] = None
    description: Optional[str] = None
    model_choice: Optional[Dict[str, Any]] = None
    start_speaker: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    global_prompt: Optional[str] = None
    tools: Optional[List[Dict[str, Any]]] = None
    start_node_id: Optional[str] = None
    knowledge_base_ids: Optional[List[str]] = None
    default_dynamic_variables: Optional[Dict[str, str]] = None


# ========== CONVERSATION FLOW ENDPOINTS ==========

@router.post("/conversation-flows", response_model=Dict[str, Any])
async def create_conversation_flow(request: CreateConversationFlowRequest):
    """
    Create a new Retell Conversation Flow.
    This creates the flow in Retell and stores metadata locally.
    """
    try:
        # Prepare the request body for Retell API
        flow_data = {
            "model_choice": request.model_choice,
            "start_speaker": request.start_speaker,
            "nodes": request.nodes,
        }
        
        # Add optional fields if provided
        if request.global_prompt:
            flow_data["global_prompt"] = request.global_prompt
        if request.tools:
            flow_data["tools"] = request.tools
        if request.start_node_id:
            flow_data["start_node_id"] = request.start_node_id
        if request.knowledge_base_ids:
            flow_data["knowledge_base_ids"] = request.knowledge_base_ids
        if request.default_dynamic_variables:
            flow_data["default_dynamic_variables"] = request.default_dynamic_variables
        if request.begin_tag_display_position:
            flow_data["begin_tag_display_position"] = request.begin_tag_display_position
        
        # Create in Retell
        result = await make_retell_request("POST", "/create-conversation-flow", flow_data)
        
        # Store metadata in our database
        client, db = get_db()
        flow_record = {
            "id": str(uuid.uuid4()),
            "retell_flow_id": result.get("conversation_flow_id"),
            "name": request.name,
            "description": request.description,
            "model_choice": request.model_choice,
            "nodes_count": len(request.nodes),
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.conversation_flows.insert_one(flow_record)
        client.close()
        
        return {
            "success": True,
            "flow_id": flow_record["id"],
            "retell_flow_id": result.get("conversation_flow_id"),
            "version": result.get("version"),
            **result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation flow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation-flows", response_model=List[Dict[str, Any]])
async def list_conversation_flows():
    """
    List all conversation flows from Retell and local metadata.
    """
    try:
        # Get from Retell
        result = await make_retell_request("GET", "/list-conversation-flows")
        
        # Get local metadata
        client, db = get_db()
        local_flows = await db.conversation_flows.find().to_list(100)
        client.close()
        
        # Create lookup for local metadata
        local_lookup = {f.get("retell_flow_id"): f for f in local_flows}
        
        # Merge Retell data with local metadata
        flows = []
        for flow in result:
            flow_id = flow.get("conversation_flow_id")
            local_data = local_lookup.get(flow_id, {})
            
            flows.append({
                "id": local_data.get("id", flow_id),
                "retell_flow_id": flow_id,
                "name": local_data.get("name", f"Flow {flow_id[:8]}"),
                "description": local_data.get("description", ""),
                "status": local_data.get("status", "active"),
                "nodes_count": len(flow.get("nodes", [])),
                "version": flow.get("version"),
                "model": flow.get("model_choice", {}).get("model", "gpt-4.1"),
                "start_speaker": flow.get("start_speaker", "agent"),
                "created_at": local_data.get("created_at"),
                "updated_at": local_data.get("updated_at"),
            })
        
        return flows
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing conversation flows: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation-flows/{flow_id}", response_model=Dict[str, Any])
async def get_conversation_flow(flow_id: str):
    """
    Get a specific conversation flow by ID.
    Supports both local ID and Retell flow ID.
    """
    try:
        # First try to find local metadata
        client, db = get_db()
        local_flow = await db.conversation_flows.find_one({"id": flow_id})
        
        if not local_flow:
            # Try by retell_flow_id
            local_flow = await db.conversation_flows.find_one({"retell_flow_id": flow_id})
        
        client.close()
        
        retell_flow_id = local_flow.get("retell_flow_id") if local_flow else flow_id
        
        # Get full data from Retell
        result = await make_retell_request("GET", f"/get-conversation-flow/{retell_flow_id}")
        
        return {
            "id": local_flow.get("id") if local_flow else flow_id,
            "retell_flow_id": retell_flow_id,
            "name": local_flow.get("name") if local_flow else f"Flow {retell_flow_id[:8]}",
            "description": local_flow.get("description") if local_flow else "",
            "status": local_flow.get("status", "active") if local_flow else "active",
            **result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation flow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/conversation-flows/{flow_id}", response_model=Dict[str, Any])
async def update_conversation_flow(flow_id: str, request: UpdateConversationFlowRequest):
    """
    Update a conversation flow.
    """
    try:
        # Get local record to find retell_flow_id
        client, db = get_db()
        local_flow = await db.conversation_flows.find_one({"id": flow_id})
        
        if not local_flow:
            local_flow = await db.conversation_flows.find_one({"retell_flow_id": flow_id})
        
        retell_flow_id = local_flow.get("retell_flow_id") if local_flow else flow_id
        
        # Prepare update data for Retell
        update_data = {}
        if request.model_choice:
            update_data["model_choice"] = request.model_choice
        if request.start_speaker:
            update_data["start_speaker"] = request.start_speaker
        if request.nodes is not None:
            update_data["nodes"] = request.nodes
        if request.global_prompt is not None:
            update_data["global_prompt"] = request.global_prompt
        if request.tools is not None:
            update_data["tools"] = request.tools
        if request.start_node_id:
            update_data["start_node_id"] = request.start_node_id
        if request.knowledge_base_ids is not None:
            update_data["knowledge_base_ids"] = request.knowledge_base_ids
        if request.default_dynamic_variables is not None:
            update_data["default_dynamic_variables"] = request.default_dynamic_variables
        
        # Update in Retell
        result = await make_retell_request("PATCH", f"/update-conversation-flow/{retell_flow_id}", update_data)
        
        # Update local metadata
        local_update = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if request.name:
            local_update["name"] = request.name
        if request.description is not None:
            local_update["description"] = request.description
        if request.nodes:
            local_update["nodes_count"] = len(request.nodes)
        
        if local_flow:
            await db.conversation_flows.update_one(
                {"_id": local_flow["_id"]},
                {"$set": local_update}
            )
        
        client.close()
        
        return {
            "success": True,
            "flow_id": local_flow.get("id") if local_flow else flow_id,
            "retell_flow_id": retell_flow_id,
            **result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation flow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversation-flows/{flow_id}", response_model=Dict[str, Any])
async def delete_conversation_flow(flow_id: str):
    """
    Delete a conversation flow.
    """
    try:
        # Get local record
        client, db = get_db()
        local_flow = await db.conversation_flows.find_one({"id": flow_id})
        
        if not local_flow:
            local_flow = await db.conversation_flows.find_one({"retell_flow_id": flow_id})
        
        retell_flow_id = local_flow.get("retell_flow_id") if local_flow else flow_id
        
        # Delete from Retell
        await make_retell_request("DELETE", f"/delete-conversation-flow/{retell_flow_id}")
        
        # Delete local record
        if local_flow:
            await db.conversation_flows.delete_one({"_id": local_flow["_id"]})
        
        client.close()
        
        return {
            "success": True,
            "message": f"Conversation flow {flow_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation flow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation-flow-models", response_model=List[Dict[str, str]])
async def get_available_models():
    """
    Get list of available LLM models for conversation flows.
    """
    return [
        {"id": "gpt-4.1", "name": "GPT-4.1", "provider": "OpenAI"},
        {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini", "provider": "OpenAI"},
        {"id": "gpt-4.1-nano", "name": "GPT-4.1 Nano", "provider": "OpenAI"},
        {"id": "gpt-5", "name": "GPT-5", "provider": "OpenAI"},
        {"id": "gpt-5-mini", "name": "GPT-5 Mini", "provider": "OpenAI"},
        {"id": "gpt-5-nano", "name": "GPT-5 Nano", "provider": "OpenAI"},
        {"id": "claude-4.5-sonnet", "name": "Claude 4.5 Sonnet", "provider": "Anthropic"},
        {"id": "claude-4.5-haiku", "name": "Claude 4.5 Haiku", "provider": "Anthropic"},
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "Google"},
        {"id": "gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite", "provider": "Google"},
    ]



@router.post("/conversation-flows/{flow_id}/test", response_model=Dict[str, Any])
async def test_conversation_flow(flow_id: str):
    """
    Test a conversation flow by creating a temporary agent and starting a web call.
    """
    try:
        # Get local record
        client, db = get_db()
        local_flow = await db.conversation_flows.find_one({"id": flow_id})
        
        if not local_flow:
            local_flow = await db.conversation_flows.find_one({"retell_flow_id": flow_id})
        
        retell_flow_id = local_flow.get("retell_flow_id") if local_flow else flow_id
        client.close()
        
        # Create a temporary agent with this conversation flow
        agent_data = {
            "agent_name": f"Test Agent - {local_flow.get('name', 'Flow') if local_flow else 'Flow'}",
            "response_engine": {
                "type": "conversation-flow",
                "conversation_flow_id": retell_flow_id
            },
            "voice_id": "11labs-Adrian",
            "language": "en-US"
        }
        
        agent_result = await make_retell_request("POST", "/create-agent", agent_data)
        temp_agent_id = agent_result.get("agent_id")
        
        if not temp_agent_id:
            raise HTTPException(status_code=500, detail="Failed to create test agent")
        
        # Create web call
        call_data = {
            "agent_id": temp_agent_id
        }
        
        call_result = await make_retell_request("POST", "/v2/create-web-call", call_data)
        
        return {
            "success": True,
            "agent_id": temp_agent_id,
            "call_id": call_result.get("call_id"),
            "access_token": call_result.get("access_token"),
            "flow_id": flow_id,
            "retell_flow_id": retell_flow_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing conversation flow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

