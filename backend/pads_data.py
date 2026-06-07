"""Load PADS (Parkinson's Disease Smartwatch) dataset from PhysioNet."""

from __future__ import annotations

import json
import os
from pathlib import Path

from copd_data import get_comorbidity_meta, has_copd_comorbidity
from signal_analysis import analyze_movement, score_task_severity

# Dataset root relative to project
DATA_ROOT = Path(__file__).resolve().parent.parent / "physionet.org/files/parkinsons-disease-smartwatch/1.0.0"

ASSESSMENT_STEPS = [
    {"id": "Relaxed", "label": "Relaxed (rest)", "category": "rest", "duration_s": 10},
    {"id": "Entrainment", "label": "Entrainment", "category": "kinetic", "duration_s": 10},
    {"id": "CrossArms", "label": "Cross Arms", "category": "postural", "duration_s": 10},
    {"id": "StretchHold", "label": "Stretch & Hold", "category": "postural", "duration_s": 20},
    {"id": "LiftHold", "label": "Lift & Hold", "category": "postural", "duration_s": 10},
    {"id": "PointFinger", "label": "Point Finger", "category": "kinetic", "duration_s": 10},
    {"id": "TouchIndex", "label": "Touch Index", "category": "kinetic", "duration_s": 10},
    {"id": "HoldWeight", "label": "Hold Weight", "category": "postural", "duration_s": 10},
    {"id": "DrinkGlas", "label": "Drink from Glass", "category": "functional", "duration_s": 10},
    {"id": "TouchNose", "label": "Touch Nose", "category": "kinetic", "duration_s": 10},
    {"id": "RelaxedTask", "label": "Relaxed Task", "category": "rest", "duration_s": 10},
]

NMS_DOMAINS = {
    "autonomic": ["01", "03", "05", "06", "07", "08", "09"],
    "sleep_fatigue": ["19", "20", "21", "22", "23", "24"],
    "mood_cognition": ["12", "13", "14", "15", "16", "17", "18"],
    "sensory_pain": ["02", "10", "11"],
    "gastrointestinal": ["04"],
}

# Demo cohort — 3 Parkinson's patients with local movement timeseries
DEMO_PATIENT_IDS = ["004", "006", "019"]

DOCTOR_ASSIGNMENTS = {
    "004": {"doctor": "Dr. Sarah Müller", "caretaker": "Anna Weber (daughter)"},
    "006": {"doctor": "Dr. Sarah Müller", "caretaker": "Klaus Richter (son)"},
    "019": {"doctor": "Dr. James Chen", "caretaker": "Maria Lopez (spouse)"},
}

PATIENT_DISPLAY_NAMES = {
    "004": {"en": "Mr. Hans Keller", "zh": "漢斯·凱勒先生"},
    "006": {"en": "Mrs. Petra Richter", "zh": "佩特拉·里希特女士"},
    "019": {"en": "Mr. Miguel Torres", "zh": "米格爾·托雷斯先生"},
}


def _patient_path(subject_id: str) -> Path:
    return DATA_ROOT / "patients" / f"patient_{subject_id}.json"


def _questionnaire_path(subject_id: str) -> Path:
    return DATA_ROOT / "questionnaire" / f"questionnaire_response_{subject_id}.json"


def _movement_path(subject_id: str, task: str, wrist: str) -> Path:
    return DATA_ROOT / "movement/timeseries" / f"{subject_id}_{task}_{wrist}Wrist.txt"


def load_patient(subject_id: str) -> dict | None:
    path = _patient_path(subject_id)
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def load_questionnaire(subject_id: str) -> dict | None:
    path = _questionnaire_path(subject_id)
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def parse_nms_domains(questionnaire: dict) -> list[dict]:
    items = {item["link_id"]: item for item in questionnaire.get("item", [])}
    domains = []
    for domain_id, link_ids in NMS_DOMAINS.items():
        positive = sum(1 for lid in link_ids if items.get(lid, {}).get("answer"))
        total = len(link_ids)
        domains.append({
            "id": domain_id,
            "label": domain_id.replace("_", " ").title(),
            "positive_count": positive,
            "total_count": total,
            "score_pct": round(100 * positive / total) if total else 0,
        })
    return domains


def list_patients() -> list[dict]:
    patients = []
    for sid in DEMO_PATIENT_IDS:
        p = load_patient(sid)
        if not p or p.get("condition") != "Parkinson's":
            continue
        q = load_questionnaire(sid)
        nms_positive = 0
        if q:
            nms_positive = sum(1 for item in q.get("item", []) if item.get("answer"))
        assignment = DOCTOR_ASSIGNMENTS.get(sid, {})
        names = PATIENT_DISPLAY_NAMES.get(sid, {})
        comorbid = get_comorbidity_meta(sid)
        patients.append({
            "id": sid,
            "display_name": names.get("en", f"Patient {sid}"),
            "display_name_zh": names.get("zh", f"患者 {sid}"),
            "condition": p.get("condition", "Unknown"),
            "comorbidities": comorbid.get("conditions", []) if comorbid else [],
            "has_copd": has_copd_comorbidity(sid),
            "disease_comment": p.get("disease_comment", "-"),
            "age": p.get("age"),
            "gender": p.get("gender"),
            "age_at_diagnosis": p.get("age_at_diagnosis"),
            "handedness": p.get("handedness"),
            "nms_positive_count": nms_positive,
            "nms_total": 30,
            "doctor": assignment.get("doctor", "Unassigned"),
            "caretaker": assignment.get("caretaker", "—"),
            "risk_level": _risk_level(p, nms_positive),
        })
    return patients


def _risk_level(patient: dict, nms_positive: int) -> str:
    if nms_positive >= 15:
        return "high"
    if nms_positive >= 8:
        return "moderate"
    return "stable"


def get_patient_detail(subject_id: str) -> dict | None:
    p = load_patient(subject_id)
    if not p or p.get("condition") != "Parkinson's":
        return None
    q = load_questionnaire(subject_id)
    assignment = DOCTOR_ASSIGNMENTS.get(subject_id, {})
    nms_items = []
    nms_domains = []
    if q:
        nms_items = [
            {"id": item["link_id"], "text": item["text"], "positive": bool(item.get("answer"))}
            for item in q.get("item", [])
        ]
        nms_domains = parse_nms_domains(q)

    task_summaries = []
    for step in ASSESSMENT_STEPS:
        task_id = step["id"]
        left_path = _movement_path(subject_id, task_id, "Left")
        right_path = _movement_path(subject_id, task_id, "Right")
        left_metrics = right_metrics = None
        if left_path.exists():
            left_metrics = analyze_movement(str(left_path))
            left_metrics["severity"] = score_task_severity(left_metrics, task_id)
        if right_path.exists():
            right_metrics = analyze_movement(str(right_path))
            right_metrics["severity"] = score_task_severity(right_metrics, task_id)

        if left_metrics or right_metrics:
            task_summaries.append({
                "task_id": task_id,
                "label": step["label"],
                "category": step["category"],
                "left": _compact_metrics(left_metrics) if left_metrics else None,
                "right": _compact_metrics(right_metrics) if right_metrics else None,
            })

    comorbid = get_comorbidity_meta(subject_id)
    return {
        "patient": p,
        "assignment": assignment,
        "comorbidities": comorbid.get("conditions", []) if comorbid else [],
        "has_copd": has_copd_comorbidity(subject_id),
        "nms_items": nms_items,
        "nms_domains": nms_domains,
        "task_summaries": task_summaries,
        "assessment_steps": ASSESSMENT_STEPS,
    }


def _compact_metrics(m: dict) -> dict:
    return {
        "tremor_frequency_hz": m["tremor_frequency_hz"],
        "tremor_amplitude_g": round(m["tremor_amplitude_g"], 4),
        "max_amplitude_g": round(m["max_amplitude_g"], 4),
        "dominant_axis": m["dominant_axis"],
        "severity": m.get("severity", "normal"),
    }


def get_movement_data(subject_id: str, task: str, wrist: str = "Left", downsample: int = 4) -> dict | None:
    path = _movement_path(subject_id, task, wrist)
    if not path.exists():
        return None
    metrics = analyze_movement(str(path))
    metrics["severity"] = score_task_severity(metrics, task)

    # Downsample for frontend charts
    step = max(1, downsample)
    time_ms = metrics["time_ms"][::step]
    channels = {}
    for axis, ch in metrics["channels"].items():
        channels[axis] = {
            "acceleration": ch["acceleration"][::step],
            "psd_frequencies": ch["psd_frequencies"],
            "psd_values": ch["psd_values"],
            "peak_frequency_hz": ch["peak_frequency_hz"],
            "std": round(ch["std"], 4),
            "max_amplitude": round(ch["max_amplitude"], 4),
        }

    return {
        "subject_id": subject_id,
        "task": task,
        "wrist": wrist,
        "time_ms": time_ms,
        "channels": channels,
        "tremor_frequency_hz": metrics["tremor_frequency_hz"],
        "tremor_amplitude_g": round(metrics["tremor_amplitude_g"], 4),
        "dominant_axis": metrics["dominant_axis"],
        "severity": metrics["severity"],
    }


def build_llm_context(subject_id: str) -> dict:
    detail = get_patient_detail(subject_id)
    if not detail:
        return {}
    return {
        "patient": detail["patient"],
        "assignment": detail["assignment"],
        "nms_domains": detail["nms_domains"],
        "nms_positive": sum(1 for i in detail["nms_items"] if i["positive"]),
        "task_summaries": detail["task_summaries"],
    }
