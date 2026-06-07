"""Shared LLM client — prefers OpenAI, falls back to OpenRouter."""

from __future__ import annotations

import os
from typing import Any

import httpx

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free"


def llm_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY"))


def get_llm_model() -> str:
    if os.getenv("OPENAI_API_KEY"):
        return os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
    return os.getenv("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)


def get_llm_source() -> str:
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("OPENROUTER_API_KEY"):
        return "openrouter"
    return "fallback"


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 800,
    temperature: float = 0.4,
    timeout: float = 60.0,
    json_mode: bool = False,
) -> tuple[str, str, str]:
    """Returns (content, model, source). Raises on HTTP errors."""
    openai_key = os.getenv("OPENAI_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    if openai_key:
        model = os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
        url = OPENAI_URL
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json",
        }
        source = "openai"
    elif openrouter_key:
        model = os.getenv("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)
        url = OPENROUTER_URL
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "PADS Care Platform",
        }
        source = "openrouter"
    else:
        raise ValueError("No LLM API key configured")

    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if source == "openai" and json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return content, model, source
