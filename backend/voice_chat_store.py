"""Health Chat transcripts and classified doctor alerts — persisted to disk."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pads_data import DOCTOR_ASSIGNMENTS

_STORE_PATH = Path(__file__).parent / "data" / "voice_chat_store.json"
_voice_alerts: dict[str, list[dict[str, Any]]] = {}
_session_records: dict[str, dict[str, Any]] = {}
_patient_sessions: dict[str, list[str]] = {}


def _load_store() -> None:
    global _voice_alerts, _session_records, _patient_sessions
    if not _STORE_PATH.exists():
        return
    try:
        raw = json.loads(_STORE_PATH.read_text(encoding="utf-8"))
        _voice_alerts = raw.get("voice_alerts", {})
        _session_records = raw.get("session_records", {})
        _patient_sessions = raw.get("patient_sessions", {})
    except (json.JSONDecodeError, OSError):
        pass


def _save_store() -> None:
    try:
        _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _STORE_PATH.write_text(
            json.dumps(
                {
                    "voice_alerts": _voice_alerts,
                    "session_records": _session_records,
                    "patient_sessions": _patient_sessions,
                },
                indent=2,
            ),
            encoding="utf-8",
        )
    except OSError:
        pass


_load_store()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_assigned_doctor(subject_id: str) -> str:
    return DOCTOR_ASSIGNMENTS.get(subject_id, {}).get("doctor", "Care team")


def register_session(session_id: str, subject_id: str) -> dict[str, Any]:
    if session_id not in _session_records:
        _session_records[session_id] = {
            "session_id": session_id,
            "subject_id": subject_id,
            "doctor": get_assigned_doctor(subject_id),
            "started_at": _now_iso(),
            "transcript": [],
            "user_turns": 0,
            "complete": False,
            "classified": False,
        }
        _patient_sessions.setdefault(subject_id, []).append(session_id)
        _save_store()
    return _session_records[session_id]


def append_transcript(
    session_id: str,
    subject_id: str,
    role: str,
    content: str,
    *,
    emotional_support: str = "",
    question: str = "",
) -> None:
    record = register_session(session_id, subject_id)
    entry: dict[str, Any] = {
        "role": role,
        "content": content,
        "timestamp": _now_iso(),
    }
    if emotional_support:
        entry["emotional_support"] = emotional_support
    if question:
        entry["question"] = question
    record["transcript"].append(entry)
    if role == "user" and content.strip():
        record["user_turns"] += 1
    _save_store()


def mark_session_complete(session_id: str) -> dict[str, Any] | None:
    record = _session_records.get(session_id)
    if not record:
        return None
    record["complete"] = True
    record["completed_at"] = _now_iso()
    _save_store()
    return record


def get_session_record(session_id: str) -> dict[str, Any] | None:
    return _session_records.get(session_id)


def get_session_restore_payload(session_id: str, subject_id: str) -> dict[str, Any] | None:
    """Return saved transcript + progress for frontend session restore."""
    record = get_session_record(session_id)
    if not record or record.get("subject_id") != subject_id:
        return None

    llm = record.get("llm_state") or {}
    return {
        "session_id": session_id,
        "subject_id": subject_id,
        "transcript": list(record.get("transcript", [])),
        "follow_up_index": int(llm.get("follow_ups_asked", 0)),
        "max_follow_ups": 5,
        "session_complete": bool(record.get("complete", False)),
        "user_turns": int(record.get("user_turns", 0)),
        "matched_doctor": record.get("matched_doctor"),
        "doctor_match_reason": record.get("doctor_match_reason", ""),
        "alert_sent": bool(record.get("classified")),
        "classified_alerts": list(record.get("alerts_generated", [])),
    }


def get_latest_active_session(subject_id: str) -> dict[str, Any] | None:
    """Most recent incomplete session for a patient."""
    ids = list(reversed(_patient_sessions.get(subject_id, [])))
    for sid in ids:
        record = _session_records.get(sid)
        if record and not record.get("complete"):
            return get_session_restore_payload(sid, subject_id)
    return None


def sync_llm_session_state(session_id: str, state: dict[str, Any]) -> None:
    """Persist in-memory LLM session so context survives backend reloads."""
    record = _session_records.get(session_id)
    if not record:
        return
    record["llm_state"] = {
        "history": list(state.get("history", [])),
        "follow_ups_asked": int(state.get("follow_ups_asked", 0)),
        "questions_log": list(state.get("questions_log", [])),
        "complete": bool(state.get("complete", False)),
        "greeting_done": bool(state.get("greeting_done", False)),
        "main_concern": str(state.get("main_concern", "")),
    }
    _save_store()


def load_llm_session_state(session_id: str, subject_id: str) -> dict[str, Any] | None:
    record = _session_records.get(session_id)
    if not record or record.get("subject_id") != subject_id:
        return None

    saved = record.get("llm_state")
    if saved and saved.get("history"):
        return {
            "subject_id": subject_id,
            "history": list(saved.get("history", [])),
            "follow_ups_asked": int(saved.get("follow_ups_asked", 0)),
            "questions_log": list(saved.get("questions_log", [])),
            "complete": bool(saved.get("complete", False)),
            "greeting_done": bool(saved.get("greeting_done", True)),
            "main_concern": str(saved.get("main_concern", "")),
        }

    history: list[dict[str, str]] = []
    questions_log: list[str] = []
    for entry in record.get("transcript", []):
        role = entry.get("role", "")
        content = str(entry.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            history.append({"role": role, "content": content})
        if role == "assistant":
            question = str(entry.get("question", "")).strip()
            if question and question not in questions_log:
                questions_log.append(question)

    if not history:
        return None

    has_user = any(e.get("role") == "user" for e in record.get("transcript", []))
    first_user = next(
        (str(e.get("content", "")).strip() for e in record.get("transcript", []) if e.get("role") == "user"),
        "",
    )
    return {
        "subject_id": subject_id,
        "history": history,
        "follow_ups_asked": len(questions_log),
        "questions_log": questions_log,
        "complete": bool(record.get("complete", False)),
        "greeting_done": has_user or len(history) > 0,
        "main_concern": first_user[:240] if first_user else "",
    }


def get_patient_transcripts(subject_id: str) -> list[dict[str, Any]]:
    ids = _patient_sessions.get(subject_id, [])
    return [
        _session_records[sid]
        for sid in ids
        if sid in _session_records
    ]


def get_voice_chat_alerts(subject_id: str) -> list[dict[str, Any]]:
    return list(_voice_alerts.get(subject_id, []))


def store_session_doctor_match(session_id: str, match: dict[str, str]) -> None:
    record = _session_records.get(session_id)
    if not record:
        return
    record["matched_doctor"] = match.get("matched_doctor", "")
    record["doctor_title"] = match.get("doctor_title", "")
    record["doctor_match_reason"] = match.get("match_reason", "")
    record["doctor"] = match.get("matched_doctor", record.get("doctor"))
    _save_store()


def store_classified_alerts(
    subject_id: str,
    session_id: str,
    alerts: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    record = _session_records.get(session_id)
    if record:
        record["classified"] = True
        record["alerts_generated"] = alerts

    existing = _voice_alerts.setdefault(subject_id, [])
    for alert in alerts:
        alert.setdefault("session_id", session_id)
        alert.setdefault("assigned_doctor", get_assigned_doctor(subject_id))
        existing.append(alert)
    existing.sort(key=lambda a: a.get("timestamp", ""), reverse=True)
    _save_store()
    return alerts


def has_sufficient_information(record: dict[str, Any]) -> bool:
    """Enough patient answers to classify alerts for the doctor dashboard."""
    user_turns = record.get("user_turns", 0)
    transcript = record.get("transcript", [])
    assistant_questions = sum(1 for t in transcript if t.get("role") == "assistant" and t.get("question"))
    return user_turns >= 2 or (record.get("complete") and user_turns >= 1 and assistant_questions >= 3)
