from datetime import timedelta
from livekit.api import AccessToken, VideoGrants
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class TokenService:
    def __init__(self):
        self.api_key = os.getenv("LIVEKIT_API_KEY")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not self.api_key or not self.api_secret:
            logger.warning("LiveKit credentials not found in environment")
    
    def generate_token(
        self,
        room: str,
        identity: str,
        name: str,
        duration_minutes: int = 60,
        can_publish: bool = True,
        can_subscribe: bool = True
    ) -> str:
        """Generate a LiveKit access token for a participant"""
        try:
            token = AccessToken(self.api_key, self.api_secret)
            token.with_identity(identity)
            token.with_name(name)
            token.with_grants(
                VideoGrants(
                    room_join=True,
                    room=room,
                    can_publish=can_publish,
                    can_subscribe=can_subscribe,
                    can_publish_data=True,
                )
            )
            token.with_metadata(f'{{"user_id": "{identity}"}}')
            
            # Set token expiration
            token.ttl = timedelta(minutes=duration_minutes)
            
            jwt_token = token.to_jwt()
            logger.info(f"Generated token for {identity} in room {room}")
            return jwt_token
            
        except Exception as e:
            logger.error(f"Token generation failed: {str(e)}")
            raise

# Create singleton instance
token_service = TokenService()
