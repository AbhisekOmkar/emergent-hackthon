from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from services.token_service import token_service
from services.agent_dispatch_service import agent_dispatch_service
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

class TokenRequest(BaseModel):
    room: str
    identity: str
    name: str
    duration_minutes: Optional[int] = 60

class TokenResponse(BaseModel):
    token: str
    url: str

class StartConversationRequest(BaseModel):
    room: str
    agent_name: Optional[str] = "default-agent"
    user_id: str
    voice_model: Optional[str] = "nova"

@router.post("/token", response_model=TokenResponse)
async def get_token(
    request: TokenRequest,
    authorization: Optional[str] = Header(None)
):
    """Generate LiveKit access token for voice session"""
    try:
        # Validate authorization (implement your auth logic)
        # if not authorization:
        #     raise HTTPException(status_code=401, detail="Unauthorized")
        
        # Validate room and identity are non-empty
        if not request.room or not request.identity:
            raise HTTPException(
                status_code=400,
                detail="Room and identity are required"
            )
        
        token = token_service.generate_token(
            room=request.room,
            identity=request.identity,
            name=request.name,
            duration_minutes=request.duration_minutes
        )
        
        livekit_url = os.getenv("LIVEKIT_URL")
        
        return TokenResponse(
            token=token,
            url=livekit_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token generation failed")

@router.post("/start-conversation")
async def start_conversation(
    request: StartConversationRequest,
    authorization: Optional[str] = Header(None)
):
    """Start a voice conversation with an AI agent"""
    try:
        # Validate authorization
        # if not authorization:
        #     raise HTTPException(status_code=401, detail="Unauthorized")
        
        if not request.room or not request.user_id:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Dispatch agent
        success = await agent_dispatch_service.dispatch_agent(
            room=request.room,
            agent_name=request.agent_name,
            agent_config={"voice_model": request.voice_model},
            user_id=request.user_id
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to dispatch agent"
            )
        
        return {"success": True, "room": request.room}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Start conversation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Conversation initiation failed")

@router.post("/refresh-token")
async def refresh_token(
    request: TokenRequest,
    authorization: Optional[str] = Header(None)
):
    """Refresh an existing LiveKit token"""
    # if not authorization:
    #     raise HTTPException(status_code=401, detail="Unauthorized")
    
    if not request.room or not request.identity:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    try:
        new_token = token_service.generate_token(
            room=request.room,
            identity=request.identity,
            name=request.name,
            duration_minutes=request.duration_minutes or 60
        )
        
        return {"token": new_token}
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Token refresh failed")
