"""PADS Parkinson Care API — connects doctors, caretakers, and patients via smartwatch data."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel

from auth import authenticate
from caretaker_alerts import build_caretaker_emergency_alerts
from copd_data import get_copd_vitals
from pads_data import (
    ASSESSMENT_STEPS,
    build_llm_context,
    get_movement_data,
    get_patient_detail,
    list_patients,
)
from chart_summaries import build_chart_summaries
from performance_analysis import build_performance_analysis
from llm_service import generate_chat_reply, generate_explanation
from patient_voice_chat import process_voice_turn
from llm_client import get_llm_model, llm_configured
from voice_chat_store import (
    get_latest_active_session,
    get_patient_transcripts,
    get_session_restore_payload,
    get_voice_chat_alerts,
)
from elevenlabs_tts import synthesize_speech, voice_configured
from openai_stt import get_transcribe_model, transcribe_audio, transcribe_configured
from medicines import list_medicines
from prescriptions import create_prescription, get_prescription_by_token, get_prescription_for_patient


class LoginRequest(BaseModel):
    email: str = ""
    password: str = ""
    role: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class PrescriptionItem(BaseModel):
    medicine_id: str
    dose: str = ""
    frequency: str = ""
    duration_days: int = 30
    instructions: str = ""


class PrescriptionRequest(BaseModel):
    doctor_name: str
    items: list[PrescriptionItem]
    notes: str = ""

class VoiceChatRequest(BaseModel):
    message: str = ""
    session_id: str | None = None
    patient_name: str = ""
    action: str = "message"

class TtsRequest(BaseModel):
    text: str

load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(
    title="VitalLink API",
    description="Parkinson's disease doctor–patient smartwatch monitoring using PhysioNet PADS dataset",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "dataset": "PADS v1.0.0 (PhysioNet)",
        "llm_model": get_llm_model(),
        "llm_configured": llm_configured(),
        "elevenlabs_configured": voice_configured(),
    }


@app.get("/api/voice/config")
def voice_config():
    return {
        "llm_configured": llm_configured(),
        "elevenlabs_configured": voice_configured(),
        "transcribe_configured": transcribe_configured(),
        "transcribe_model": get_transcribe_model(),
        "max_follow_ups": 5,
    }


@app.post("/api/voice/transcribe")
async def voice_transcribe(
    audio: UploadFile = File(...),
    language: str | None = Form(None),
):
    if not transcribe_configured():
        raise HTTPException(503, "OpenAI transcription not configured — set OPENAI_API_KEY")
    raw = await audio.read()
    if not raw:
        raise HTTPException(400, "Empty audio")
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(413, "Audio too large (max 12 MB)")
    lang = (language or "").strip().lower() or None
    if lang not in (None, "en", "zh", "de"):
        lang = None
    try:
        result = await transcribe_audio(
            raw,
            filename=audio.filename or "speech.webm",
            content_type=audio.content_type or "audio/webm",
            language=lang,
        )
    except ValueError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        raise HTTPException(502, f"Transcription failed: {e}") from e
    return result


@app.get("/api/patients/{subject_id}/voice-chat/session")
def voice_chat_session(subject_id: str, session_id: str | None = Query(None)):
    detail = get_patient_detail(subject_id)
    if not detail:
        raise HTTPException(404, f"Patient {subject_id} not found")
    if session_id:
        payload = get_session_restore_payload(session_id, subject_id)
        if not payload:
            raise HTTPException(404, f"Session {session_id} not found")
        return payload
    active = get_latest_active_session(subject_id)
    if not active:
        return {"session_id": None, "transcript": [], "follow_up_index": 0, "session_complete": False}
    return active


@app.post("/api/auth/login")
def login(body: LoginRequest):
    user = authenticate(body.email, body.password, body.role)
    all_pts = list_patients()
    if user["role"] == "doctor":
        assigned = [p for p in all_pts if p.get("doctor") == user["name"]]
        if not assigned:
            assigned = all_pts
    elif user["role"] == "patient":
        pads_id = user.get("pads_id", "004")
        assigned = [p for p in all_pts if p["id"] == pads_id]
        if not assigned:
            assigned = all_pts[:1] if all_pts else []
    elif user["role"] == "chemist":
        assigned = []
    else:
        assigned = [p for p in all_pts if p.get("caretaker") == user["name"]]
        if not assigned:
            assigned = all_pts[:1] if all_pts else []
    return {"user": user, "patients": assigned}


@app.get("/api/patients")
def patients(doctor: str | None = None, caretaker: str | None = None):
    all_pts = list_patients()
    if doctor:
        from urllib.parse import unquote
        name = unquote(doctor)
        return {"patients": [p for p in all_pts if p.get("doctor") == name]}
    if caretaker:
        from urllib.parse import unquote
        name = unquote(caretaker)
        return {"patients": [p for p in all_pts if p.get("caretaker") == name]}
    return {"patients": all_pts}


@app.get("/api/patients/{subject_id}")
def patient_detail(subject_id: str):
    detail = get_patient_detail(subject_id)
    if not detail:
        raise HTTPException(404, f"Patient {subject_id} not found")
    return detail


@app.get("/api/patients/{subject_id}/movement")
def movement(
    subject_id: str,
    task: str = Query("Relaxed"),
    wrist: str = Query("Left", pattern="^(Left|Right)$"),
    downsample: int = Query(4, ge=1, le=20),
):
    data = get_movement_data(subject_id, task, wrist, downsample)
    if not data:
        raise HTTPException(404, f"Movement data not found for {subject_id}/{task}/{wrist}")
    return data


@app.get("/api/assessment-steps")
def assessment_steps():
    return {"steps": ASSESSMENT_STEPS}


@app.get("/api/patients/{subject_id}/analysis")
def patient_analysis(subject_id: str):
    analysis = build_performance_analysis(subject_id)
    if not analysis:
        raise HTTPException(404, f"Patient {subject_id} not found")
    return analysis


@app.get("/api/patients/{subject_id}/copd-vitals")
def copd_vitals(subject_id: str):
    data = get_copd_vitals(subject_id)
    if not data:
        raise HTTPException(404, f"No COPD vitals for patient {subject_id}")
    return data


@app.get("/api/patients/{subject_id}/caretaker-emergency-alerts")
def caretaker_emergency_alerts(subject_id: str):
    detail = get_patient_detail(subject_id)
    if not detail:
        raise HTTPException(404, f"Patient {subject_id} not found")
    return build_caretaker_emergency_alerts(subject_id)


@app.get("/api/patients/{subject_id}/chart-summaries")
def chart_summaries(
    subject_id: str,
    task: str = Query("Relaxed"),
    wrist: str = Query("Left", pattern="^(Left|Right)$"),
):
    data = build_chart_summaries(subject_id, task, wrist)
    if not data:
        raise HTTPException(404, f"Patient {subject_id} not found")
    return data


@app.post("/api/patients/{subject_id}/voice-chat")
async def patient_voice_chat(subject_id: str, body: VoiceChatRequest):
    try:
        result = await process_voice_turn(
            subject_id,
            body.session_id,
            body.message.strip() or None,
            body.patient_name,
            body.action,
        )
    except ValueError as e:
        raise HTTPException(404, str(e)) from e
    except Exception as e:
        raise HTTPException(500, f"Voice chat error: {e}") from e
    return {"subject_id": subject_id, **result}


@app.get("/api/patients/{subject_id}/voice-chat/transcripts")
def voice_chat_transcripts(subject_id: str):
    detail = get_patient_detail(subject_id)
    if not detail:
        raise HTTPException(404, f"Patient {subject_id} not found")
    return {
        "subject_id": subject_id,
        "sessions": get_patient_transcripts(subject_id),
    }


@app.get("/api/patients/{subject_id}/voice-chat/alerts")
def voice_chat_alerts(subject_id: str):
    detail = get_patient_detail(subject_id)
    if not detail:
        raise HTTPException(404, f"Patient {subject_id} not found")
    return {
        "subject_id": subject_id,
        "alerts": get_voice_chat_alerts(subject_id),
    }


@app.post("/api/voice/tts")
async def voice_tts(body: TtsRequest):
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Empty text")
    try:
        audio, content_type = await synthesize_speech(text)
    except ValueError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        raise HTTPException(502, f"TTS failed: {e}") from e
    return Response(content=audio, media_type=content_type)


@app.post("/api/patients/{subject_id}/chat")
async def patient_chat(subject_id: str, body: ChatRequest):
    context = build_llm_context(subject_id)
    if not context:
        raise HTTPException(404, f"Patient {subject_id} not found")
    analysis = build_performance_analysis(subject_id)
    history = [{"role": m.role, "content": m.content} for m in body.history]
    result = await generate_chat_reply(body.message, context, analysis, history)
    return {"subject_id": subject_id, "question": body.message, **result}


@app.post("/api/patients/{subject_id}/explain")
async def explain(
    subject_id: str,
    audience: str = Query("doctor", pattern="^(doctor|caretaker|patient)$"),
):
    context = build_llm_context(subject_id)
    if not context:
        raise HTTPException(404, f"Patient {subject_id} not found")
    result = await generate_explanation(context, audience)
    return {"subject_id": subject_id, "audience": audience, **result}


@app.get("/api/medicines")
def medicines():
    return {"medicines": list_medicines()}


@app.post("/api/patients/{subject_id}/prescriptions")
def issue_prescription(subject_id: str, body: PrescriptionRequest):
    rx = create_prescription(
        subject_id,
        body.doctor_name,
        [item.model_dump() for item in body.items],
        body.notes,
    )
    if not rx:
        raise HTTPException(404, f"Could not create prescription for {subject_id}")
    return rx


@app.get("/api/patients/{subject_id}/prescriptions/latest")
def latest_prescription(subject_id: str):
    rx = get_prescription_for_patient(subject_id)
    if not rx:
        return {"prescription": None}
    return {"prescription": rx}


@app.get("/api/prescriptions/{token}")
def prescription_by_token(token: str):
    rx = get_prescription_by_token(token)
    if not rx:
        raise HTTPException(404, "Prescription not found")
    return rx


@app.get("/api/doctors/{doctor_name}/patients")
def doctor_patients(doctor_name: str):
    """List patients assigned to a doctor."""
    all_pts = list_patients()
    # URL decode: Dr.%20Sarah%20Müller -> Dr. Sarah Müller
    from urllib.parse import unquote
    name = unquote(doctor_name)
    matched = [p for p in all_pts if p.get("doctor") == name]
    return {"doctor": name, "patients": matched, "count": len(matched)}


# --- Production: serve built React app from same origin (single public URL) ---
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend-main" / "dist"
if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(404, "Not found")
        candidate = FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
