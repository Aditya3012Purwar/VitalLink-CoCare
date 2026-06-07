"""Classify Health Chat transcripts into doctor dashboard alerts."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

from llm_client import chat_completion, llm_configured
from pads_data import build_llm_context
from performance_analysis import build_performance_analysis


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _format_transcript_for_llm(transcript: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for entry in transcript:
        role = entry.get("role", "unknown")
        if role == "assistant":
            parts = []
            if entry.get("emotional_support"):
                parts.append(f"[Support] {entry['emotional_support']}")
            if entry.get("question"):
                parts.append(f"[Question] {entry['question']}")
            if not parts:
                parts.append(entry.get("content", ""))
            lines.append(f"Companion: {' '.join(parts)}")
        else:
            lines.append(f"Patient: {entry.get('content', '')}")
    return "\n".join(lines)


def _parse_alerts_json(raw: str) -> list[dict[str, Any]]:
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []

    alerts = data if isinstance(data, list) else data.get("alerts", [])
    if not isinstance(alerts, list):
        return []

    normalized: list[dict[str, Any]] = []
    for item in alerts:
        if not isinstance(item, dict):
            continue
        event = str(item.get("event", "")).strip()
        if not event:
            continue
        normalized.append({
            "event": event,
            "detail": str(item.get("detail", "")).strip(),
            "reason": str(item.get("reason", "")).strip(),
            "clinical_relevance": str(item.get("clinical_relevance", "")).strip(),
            "timestamp": _now_iso(),
            "source": "voice_chat",
            "red_flag": bool(item.get("red_flag", False)),
            "urgency": str(item.get("urgency", "this_week")),
        })
    return normalized


def _fallback_classify(transcript: list[dict[str, Any]], subject_id: str) -> list[dict[str, Any]]:
    patient_text = " ".join(
        e.get("content", "") for e in transcript if e.get("role") == "user"
    ).lower()

    alerts: list[dict[str, Any]] = []
    rules = [
        (
            any(w in patient_text for w in ("leg", "knee", "ankle", "foot", "hurt", "injur", "pain", "ache")),
            "Musculoskeletal pain or injury reported in Health Chat",
            "Patient described limb or joint pain during voice check-in.",
            "Orthopedic or rehab review before next visit — assess falls risk and mobility aids.",
            "hurt" in patient_text or "injur" in patient_text,
            "today",
        ),
        (
            any(w in patient_text for w in ("fall", "fell", "freeze", "stiff", "tremor", "shake", "worse")),
            "Patient reports worsening motor symptoms at home",
            "Voice check-in captured concern about tremor, stiffness, falls, or freezing.",
            "May indicate off-periods or medication timing issues — review levodopa schedule.",
            True,
            "today",
        ),
        (
            any(w in patient_text for w in ("sleep", "tired", "fatigue", "insomnia", "night")),
            "Sleep or fatigue concern raised in Health Chat",
            "Patient mentioned sleep disruption or fatigue during voice companion session.",
            "Non-motor burden affects quality of life; screen mood and autonomic symptoms.",
            False,
            "this_week",
        ),
        (
            any(w in patient_text for w in ("medicine", "medication", "pill", "dose", "missed", "forget")),
            "Medication adherence concern from patient conversation",
            "Patient discussed medicine timing, missed doses, or difficulty taking medications.",
            "Adherence gaps can worsen motor fluctuations — pharmacist or nurse follow-up advised.",
            "missed" in patient_text or "forget" in patient_text,
            "this_week",
        ),
        (
            any(w in patient_text for w in ("worry", "anxious", "sad", "depress", "lonely", "scared")),
            "Emotional distress noted during Health Chat",
            "Patient expressed worry, low mood, or anxiety in conversational responses.",
            "Psychosocial support and mood screening may be appropriate at next visit.",
            False,
            "this_week",
        ),
    ]

    for matched, event, reason, clinical, red_flag, urgency in rules:
        if matched:
            alerts.append({
                "event": event,
                "detail": f"Classified from Health Chat transcript for patient {subject_id}.",
                "reason": reason,
                "clinical_relevance": clinical,
                "timestamp": _now_iso(),
                "source": "voice_chat",
                "red_flag": red_flag,
                "urgency": urgency,
            })

    if not alerts:
        alerts.append({
            "event": "Routine Health Chat check-in completed",
            "detail": "Patient completed a voice companion session without urgent red flags.",
            "reason": "Transcript reviewed — no acute motor, medication, or mood crises detected.",
            "clinical_relevance": "Continue scheduled monitoring; incorporate themes at next clinic visit.",
            "timestamp": _now_iso(),
            "source": "voice_chat",
            "red_flag": False,
            "urgency": "preventive",
        })

    return alerts


async def classify_session_alerts(
    subject_id: str,
    transcript: list[dict[str, Any]],
    doctor_name: str,
) -> list[dict[str, Any]]:
    context = build_llm_context(subject_id) or {}
    analysis = build_performance_analysis(subject_id) or {}
    transcript_text = _format_transcript_for_llm(transcript)

    system = f"""You are a clinical triage assistant for Parkinson's disease care.
Review a completed patient Health Chat transcript and produce alerts for the assigned doctor ({doctor_name}).

Return JSON only — an array of 1-4 alert objects:
[
  {{
    "event": "short alert title",
    "detail": "what the patient said or implied",
    "reason": "why this matters clinically",
    "clinical_relevance": "suggested doctor action",
    "red_flag": true/false,
    "urgency": "today" | "this_week" | "preventive"
  }}
]

Rules:
- Base alerts ONLY on patient answers in the transcript
- Flag red_flag for falls, hallucinations, severe confusion, chest pain, missed levodopa 2+ days
- urgency "today" only for urgent safety issues
- Do not diagnose — triage for doctor review
- If routine check-in with no concerns, return one preventive alert"""

    if not llm_configured():
        return _fallback_classify(transcript, subject_id)

    prompt = (
        f"Patient context:\n{json.dumps({'context': context, 'wearable_summary': analysis.get('executive_summary')}, indent=2)}\n\n"
        f"Health Chat transcript:\n{transcript_text}\n\n"
        "Classify alerts for the doctor dashboard. JSON array only."
    )

    try:
        content, _, _ = await chat_completion(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.3,
            json_mode=True,
        )
        parsed = _parse_alerts_json(content)
        if parsed:
            for a in parsed:
                a["assigned_doctor"] = doctor_name
            return parsed
    except Exception:
        pass

    return _fallback_classify(transcript, subject_id)
