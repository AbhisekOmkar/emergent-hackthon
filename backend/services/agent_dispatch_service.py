from livekit.api import LiveKitAPI
import json
import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class AgentDispatchService:
    def __init__(self):
        self.livekit_url = os.getenv("LIVEKIT_URL")
        self.api_key = os.getenv("LIVEKIT_API_KEY")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([self.livekit_url, self.api_key, self.api_secret]):
            logger.warning("LiveKit credentials incomplete")
    
    async def dispatch_agent(
        self,
        room: str,
        agent_name: str,
        agent_config: dict,
        user_id: str
    ) -> bool:
        """Dispatch an agent to a room"""
        try:
            async with LiveKitAPI(
                self.livekit_url,
                self.api_key,
                self.api_secret
            ) as lkapi:
                # Create metadata payload with agent configuration
                metadata = json.dumps({
                    **agent_config,
                    "user_id": user_id,
                    "dispatched_at": datetime.now(timezone.utc).isoformat(),
                })
                
                # Note: Agent dispatch is done through agent server connection
                # This is a placeholder for when you run the agent server
                logger.info(f"Agent {agent_name} ready for room {room}")
                return True
                
        except Exception as e:
            logger.error(f"Agent dispatch failed: {str(e)}")
            return False

agent_dispatch_service = AgentDispatchService()
