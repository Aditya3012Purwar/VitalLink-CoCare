"""In-memory + JSON file prescription store for demo."""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path

from medicines import PARKINSON_MEDICINES
from pads_data import get_patient_detail

STORE_PATH = Path(__file__).parent / "data" / "prescriptions.json"


def _load() -> dict:
    if STORE_PATH.exists():
        return json.loads(STORE_PATH.read_text())
    return {"prescriptions": {}}


def _save(data: dict) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(json.dumps(data, indent=2))


def _medicine_lookup(med_id: str) -> dict | None:
    return next((m for m in PARKINSON_MEDICINES if m["id"] == med_id), None)


def create_prescription(
    subject_id: str,
    doctor_name: str,
    items: list[dict],
    notes: str = "",
) -> dict:
    detail = get_patient_detail(subject_id)
    if not detail:
        return {}

    rx_items = []
    for item in items:
        med = _medicine_lookup(item["medicine_id"])
        if not med:
            continue
        rx_items.append({
            "medicine_id": med["id"],
            "name": med["name"],
            "generic": med["generic"],
            "category": med["category"],
            "dose": item.get("dose") or med["default_dose"],
            "frequency": item.get("frequency") or med["default_frequency"],
            "duration_days": item.get("duration_days", 30),
            "instructions": item.get("instructions") or med["notes"],
        })

    if not rx_items:
        return {}

    token = secrets.token_urlsafe(12)
    rx_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    prescription = {
        "id": rx_id,
        "token": token,
        "subject_id": subject_id,
        "patient_name": f"PD Patient {subject_id}",
        "patient_age": detail["patient"]["age"],
        "condition": detail["patient"]["condition"],
        "doctor_name": doctor_name,
        "items": rx_items,
        "notes": notes,
        "created_at": now,
        "status": "active",
    }

    data = _load()
    data["prescriptions"][token] = prescription
    by_patient = data.setdefault("by_patient", {})
    by_patient[subject_id] = token
    _save(data)
    return prescription


def get_prescription_by_token(token: str) -> dict | None:
    data = _load()
    return data["prescriptions"].get(token)


def get_prescription_for_patient(subject_id: str) -> dict | None:
    data = _load()
    token = data.get("by_patient", {}).get(subject_id)
    if not token:
        return None
    return data["prescriptions"].get(token)
