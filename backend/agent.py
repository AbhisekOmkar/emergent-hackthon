import logging
import os
from pathlib import Path
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, deepgram, elevenlabs, silero

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    
    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait for participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice agent for participant {participant.identity}")

    # Initialize Agent (Configuration)
    agent = Agent(
        vad=ctx.proc.userdata.get("vad") or silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=elevenlabs.TTS(),
        instructions=(
            "You are a helpful and friendly AI assistant. "
            "You are concise in your responses and speak in a conversational tone. "
            "You can help with scheduling, answering questions, and general assistance."
        )
    )

    # Initialize Session (Runtime)
    session = AgentSession()
    
    # Start the agent session
    await session.start(agent, room=ctx.room)

    # Initial greeting
    await session.say("Hello! I am your AI assistant. How can I help you today?", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
