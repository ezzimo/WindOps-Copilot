"""
Factory for creating the configured LLM chat model.

Supports OpenAI, Groq and Google Gemini via environment variables.
Default provider is OpenAI for backward compatibility.
"""
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config import settings


def get_llm(temperature: float = 0.1):
    """
    Returns a LangChain chat model instance based on the LLM_PROVIDER setting.

    Supported providers:
      - openai  -> ChatOpenAI
      - groq    -> ChatGroq
      - gemini  -> ChatGoogleGenerativeAI
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "groq":
        return ChatGroq(
            model=settings.GROQ_MODEL,
            temperature=temperature,
            api_key=settings.GROQ_API_KEY,
        )

    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=settings.GOOGLE_MODEL,
            temperature=temperature,
            api_key=settings.GOOGLE_API_KEY,
        )

    # Default: OpenAI
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=temperature,
        api_key=settings.OPENAI_API_KEY,
    )
