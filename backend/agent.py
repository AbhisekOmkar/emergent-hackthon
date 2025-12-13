import logging
from pathlib import Path
from dotenv import load_dotenv
from typing import Annotated

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, llm
from livekit.plugins import openai, deepgram, elevenlabs, silero

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are a helpful and friendly AI assistant. "
                "You are concise in your responses and speak in a conversational tone. "
                "You can help with scheduling, answering questions, and general assistance."
            ),
        )
    
    @llm.ai_callable(description="Get the current weather for a location")
    def get_weather(
        self, 
        location: Annotated[str, llm.TypeInfo(description="The city and state, e.g. San Francisco, CA")]
    ):
        logger.info(f"getting weather for {location}")
        return f"The weather in {location} is sunny and 72 degrees."

server = AgentServer()

@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    
    # Preload VAD
    vad = await silero.VAD.load()
    
    session = AgentSession(
        vad=vad,
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=elevenlabs.TTS(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )

if __name__ == "__main__":
    agents.cli.run_app(server)
