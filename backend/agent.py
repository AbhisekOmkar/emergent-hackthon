import logging
import os
from pathlib import Path
from dotenv import load_dotenv

from livekit.agents import JobContext, WorkerOptions, cli, llm
from livekit.agents.job import AutoSubscribe
from livekit.agents.voice_assistant import VoiceAssistant
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

    # Initialize Voice Assistant (formerly VoicePipelineAgent)
    agent = VoiceAssistant(
        vad=ctx.proc.userdata.get("vad") or silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=elevenlabs.TTS(),
        chat_ctx=llm.ChatContext().append(
            role="system",
            text=(
                "You are a helpful and friendly AI assistant. "
                "You are concise in your responses and speak in a conversational tone. "
                "You can help with scheduling, answering questions, and general assistance."
            ),
        ),
    )

    # Start the agent
    agent.start(ctx.room, participant)

    await agent.say("Hello! I am your AI assistant. How can I help you today?", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
