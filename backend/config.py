import os
from dotenv import load_dotenv

# Load environment variables if a .env file exists in workspace
load_dotenv()

class Settings:
    # LLM provider selection : openai | groq | gemini
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")

    # OpenAI configurations
    OPENAI_API_KEY: str = os.getenv(
        "OPENAI_API_KEY",
        "",
    )
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Groq configurations
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama3-70b-8192")

    # Google Gemini configurations
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemini-1.5-flash")

settings = Settings()

# Ensure the selected provider API key is populated in the environment
# for langchain utilities that read it directly from os.environ
if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY and not os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
elif settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY and not os.getenv("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
elif settings.LLM_PROVIDER == "gemini" and settings.GOOGLE_API_KEY and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
