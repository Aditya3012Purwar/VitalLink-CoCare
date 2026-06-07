"""Match patient Health Chat concerns to the best doctor on their care team."""

from __future__ import annotations

import json
import re
from typing import Any

from llm_client import chat_completion, llm_configured

# Care team available per demo patient (primary + consulting specialists)
PATIENT_CARE_TEAMS: dict[str, list[dict[str, str]]] = {
    "004": [
        {
            "name": "Dr. Sarah Müller",
            "title": "Movement Disorders Neurologist",
            "expertise": "Parkinson tremor, stiffness, medication timing, motor fluctuations",
        },
        {
            "name": "Dr. James Chen",
            "title": "Pulmonologist",
            "expertise": "COPD, breathlessness, cough, oxygen use, pulmonary rehab",
        },
        {
            "name": "Dr. Anna Richter",
            "title": "Orthopedics & Rehabilitation",
            "expertise": "Leg pain, joint injury, falls, mobility, physiotherapy",
        },
        {
            "name": "Dr. Stefan Vogel",
            "title": "Neuropsychiatry",
            "expertise": "Mood, anxiety, sleep, cognition, emotional distress",
        },
    ],
    "006": [
        {
            "name": "Dr. Sarah Müller",
            "title": "Movement Disorders Neurologist",
            "expertise": "Parkinson tremor, stiffness, dyskinesia, levodopa management",
        },
        {
            "name": "Dr. Anna Richter",
            "title": "Orthopedics & Rehabilitation",
            "expertise": "Pain, balance, falls, daily function at home",
        },
        {
            "name": "Dr. Stefan Vogel",
            "title": "Neuropsychiatry",
            "expertise": "Sleep, fatigue, mood, caregiver stress",
        },
    ],
    "019": [
        {
            "name": "Dr. James Chen",
            "title": "Movement Disorders Neurologist",
            "expertise": "Parkinson motor symptoms, smartwatch monitoring, care planning",
        },
        {
            "name": "Dr. Sarah Müller",
            "title": "Movement Disorders Neurologist",
            "expertise": "Tremor, rigidity, medication adherence",
        },
        {
            "name": "Dr. Anna Richter",
            "title": "Orthopedics & Rehabilitation",
            "expertise": "Leg pain, injury, falls, home safety",
        },
    ],
}

_KEYWORD_DOCTOR: list[tuple[tuple[str, ...], str]] = [
    (("leg", "knee", "ankle", "foot", "hip", "hurt", "injur", "pain", "ache", "swell"), "Dr. Anna Richter"),
    (("breath", "copd", "wheeze", "cough", "chest", "oxygen", "lung"), "Dr. James Chen"),
    (("sleep", "anx", "worry", "sad", "depress", "mood", "lonely", "stress"), "Dr. Stefan Vogel"),
    (("tremor", "shake", "stiff", "freeze", "dyskines", "levodopa", "med", "pill"), "Dr. Sarah Müller"),
]


def get_patient_care_team(subject_id: str) -> list[dict[str, str]]:
    return list(PATIENT_CARE_TEAMS.get(subject_id, PATIENT_CARE_TEAMS.get("004", [])))


def _fallback_match(subject_id: str, main_concern: str, transcript: list[dict[str, Any]]) -> dict[str, str]:
    team = get_patient_care_team(subject_id)
    text = f"{main_concern} " + " ".join(
        e.get("content", "") for e in transcript if e.get("role") == "user"
    ).lower()

    for keywords, doctor_name in _KEYWORD_DOCTOR:
        if any(k in text for k in keywords):
            doc = next((d for d in team if d["name"] == doctor_name), team[0] if team else None)
            if doc:
                return {
                    "matched_doctor": doc["name"],
                    "doctor_title": doc["title"],
                    "match_reason": f"Best fit for the concern raised: {main_concern[:120] or 'check-in topics'}.",
                }

    primary = team[0] if team else {"name": "Care team", "title": "Physician"}
    return {
        "matched_doctor": primary["name"],
        "doctor_title": primary.get("title", "Physician"),
        "match_reason": "Primary care neurologist for ongoing Parkinson monitoring.",
    }


def _parse_match_json(raw: str, team: list[dict[str, str]]) -> dict[str, str] | None:
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None

    name = str(data.get("matched_doctor", data.get("doctor_name", ""))).strip()
    if not name:
        return None

    doc = next((d for d in team if d["name"].lower() == name.lower()), None)
    if not doc:
        doc = next((d for d in team if name.split()[-1].lower() in d["name"].lower()), team[0])

    return {
        "matched_doctor": doc["name"],
        "doctor_title": doc["title"],
        "match_reason": str(data.get("match_reason", data.get("reason", ""))).strip()
        or f"Matched to {doc['title']} for next-visit follow-up.",
    }


async def match_doctor_for_session(
    subject_id: str,
    transcript: list[dict[str, Any]],
    main_concern: str = "",
) -> dict[str, str]:
    team = get_patient_care_team(subject_id)
    if not team:
        return _fallback_match(subject_id, main_concern, transcript)

    patient_lines = [
        e.get("content", "") for e in transcript if e.get("role") == "user" and e.get("content")
    ]
    summary = main_concern or (patient_lines[0] if patient_lines else "Routine health check-in")

    if not llm_configured():
        return _fallback_match(subject_id, summary, transcript)

    roster = json.dumps(team, indent=2)
    system = """You route patient Health Chat summaries to the best doctor on their care team for the NEXT clinic visit.
Return JSON only:
{
  "matched_doctor": "exact name from roster",
  "match_reason": "one short sentence why this doctor fits the patient's main issue"
}
Pick the doctor whose expertise best matches the patient's reported problem — not the default neurologist unless motor/Parkinson issues dominate."""

    prompt = (
        f"Patient main concern: {summary}\n\n"
        f"Patient messages:\n{json.dumps(patient_lines, indent=2)}\n\n"
        f"Care team roster:\n{roster}\n\n"
        "Choose the single best doctor."
    )

    try:
        content, _, _ = await chat_completion(
            [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.2,
            json_mode=True,
        )
        parsed = _parse_match_json(content, team)
        if parsed:
            return parsed
    except Exception:
        pass

    return _fallback_match(subject_id, summary, transcript)
