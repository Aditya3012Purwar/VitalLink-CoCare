"""OpenAI Whisper speech-to-text for Health Chat."""

from __future__ import annotations

import os

import httpx

OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions"
DEFAULT_TRANSCRIBE_MODEL = "whisper-1"


def transcribe_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def get_transcribe_model() -> str:
    return os.getenv("OPENAI_TRANSCRIBE_MODEL", DEFAULT_TRANSCRIBE_MODEL)


async def transcribe_audio(
    audio_bytes: bytes,
    *,
    filename: str = "speech.webm",
    content_type: str = "audio/webm",
    language: str | None = None,
) -> dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OpenAI API key not configured — set OPENAI_API_KEY for speech transcription")

    model = get_transcribe_model()
    data: dict[str, str] = {
        "model": model,
        "response_format": "json",
    }
    if language:
        data["language"] = language

    files = {"file": (filename, audio_bytes, content_type)}

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            OPENAI_TRANSCRIBE_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            data=data,
            files=files,
        )
        if response.status_code >= 400:
            detail = response.text[:500]
            raise RuntimeError(f"Transcription failed ({response.status_code}): {detail}")

        payload = response.json()
        text = (payload.get("text") or "").strip()
        return {"text": text, "model": model, "source": "openai"}
