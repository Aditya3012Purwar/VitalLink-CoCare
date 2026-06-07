"""ElevenLabs text-to-speech proxy — keeps API key server-side."""

from __future__ import annotations

import os

import httpx

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"


def voice_configured() -> bool:
    return bool(os.getenv("ELEVENLABS_API_KEY") and os.getenv("ELEVENLABS_VOICE_ID"))


async def synthesize_speech(text: str) -> tuple[bytes, str]:
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "")
    if not api_key or not voice_id:
        raise ValueError("ElevenLabs not configured — set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID")

    tts_text = text[:2500] + ("..." if len(text) > 2500 else "")
    url = ELEVENLABS_TTS_URL.format(voice_id=voice_id)

    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(
            url,
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": tts_text,
                "model_id": os.getenv("ELEVENLABS_MODEL", "eleven_multilingual_v2"),
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.78,
                    "style": 0.25,
                    "use_speaker_boost": True,
                    "speed": float(os.getenv("ELEVENLABS_SPEED", "1.18")),
                },
            },
        )
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "audio/mpeg")
        return resp.content, content_type
