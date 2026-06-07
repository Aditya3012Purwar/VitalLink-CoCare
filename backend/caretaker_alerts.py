"""Caretaker emergency alerts — Parkinson / COPD attack risk from smart wearables & e-health."""

from __future__ import annotations

import hashlib

from copd_data import get_copd_vitals, has_copd_comorbidity
from pads_data import get_patient_detail
from performance_analysis import build_performance_analysis, _timestamp

WEARABLE_SOURCES = frozenset({"wearable"})
EHEALTH_SOURCES = frozenset({"e_health"})


def _alert_id(event: str, timestamp: str, source: str) -> str:
    raw = f"{event}|{timestamp}|{source}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _classify_attack(alert: dict) -> str | None:
    source = alert.get("source", "")
    event = (alert.get("event") or "").lower()
    detail = (alert.get("detail") or "").lower()

    if source == "e_health" or "copd" in event or "spo2" in event or "oxygen" in event or "exacerbation" in event:
        return "copd"
    if source == "wearable" or "tremor" in event or "movement" in event or "parkinson" in event:
        return "parkinson"
    if "sleep" in event and has_copd_in_detail(detail):
        return "copd"
    return "parkinson" if source in WEARABLE_SOURCES else "copd" if source in EHEALTH_SOURCES else None


def has_copd_in_detail(detail: str) -> bool:
    return any(k in detail for k in ("spo2", "oxygen", "copd", "desaturation", "respiratory"))


def _live_parkinson_attack_alerts(subject_id: str) -> list[dict]:
    """Real-time style alerts from latest PADS smartwatch signals."""
    detail = get_patient_detail(subject_id)
    if not detail:
        return []

    emergencies: list[dict] = []
    tasks = detail.get("task_summaries", [])

    high_sev = [
        t for t in tasks
        if (t.get("left") or {}).get("severity") == "high"
        or (t.get("right") or {}).get("severity") == "high"
    ]
    if high_sev:
        names = ", ".join(t["label"] for t in high_sev[:2])
        ts = _timestamp(0.08)
        event = "Possible Parkinson motor crisis — smartwatch detected severe tremor"
        emergencies.append({
            "id": _alert_id(event, ts, "wearable"),
            "attack_type": "parkinson",
            "severity": "critical",
            "event": event,
            "detail": f"Severe accelerometer readings during: {names}. Off-period or medication gap suspected.",
            "action": "Check levodopa timing; assist patient to safe seated position; contact neurologist if sustained >15 min.",
            "timestamp": ts,
            "source": "wearable",
        })

    for t in tasks:
        if t["task_id"] not in ("Relaxed", "RelaxedTask"):
            continue
        for side_key in ("left", "right"):
            m = t.get(side_key)
            if m and m.get("severity") in ("moderate", "high"):
                ts = _timestamp(0.12)
                event = "Parkinson attack risk — rest tremor surge on smartwatch"
                emergencies.append({
                    "id": _alert_id(event, ts, "wearable"),
                    "attack_type": "parkinson",
                    "severity": "critical" if m["severity"] == "high" else "warning",
                    "event": event,
                    "detail": (
                        f"{side_key.capitalize()} wrist {m['severity']} tremor at ~{m.get('tremor_frequency_hz', 0)} Hz "
                        f"during Relaxed task — classic PD off-period pattern."
                    ),
                    "action": "Administer scheduled levodopa if due; monitor for fall risk; notify doctor if no improvement.",
                    "timestamp": ts,
                    "source": "wearable",
                })
                break
        break

    return emergencies


def _live_copd_attack_alerts(subject_id: str) -> list[dict]:
    """Real-time style alerts from e-health oximetry & respiratory monitoring."""
    if not has_copd_comorbidity(subject_id):
        return []

    vitals = get_copd_vitals(subject_id)
    if not vitals:
        return []

    s = vitals["summary"]
    emergencies: list[dict] = []

    if s["spo2_avg_pct"] < 92 or s["nocturnal_desat_events"] >= 5:
        ts = _timestamp(0.05)
        critical = s["spo2_avg_pct"] < 90
        event = "Possible COPD attack — low oxygen on home oximeter"
        emergencies.append({
            "id": _alert_id(event, ts, "e_health"),
            "attack_type": "copd",
            "severity": "critical" if critical else "warning",
            "event": event,
            "detail": (
                f"Mean SpO₂ {s['spo2_avg_pct']}% with {s['nocturnal_desat_events']} nocturnal desaturation events. "
                f"Respiratory rate {s['respiratory_rate_avg']}/min."
            ),
            "action": "Use rescue inhaler; sit upright; administer supplemental O₂ if prescribed; call emergency services if SpO₂ <88%.",
            "timestamp": ts,
            "source": "e_health",
        })

    if s["respiratory_rate_avg"] >= 20 or s["exacerbation_risk"] in ("moderate", "high"):
        ts = _timestamp(0.15)
        event = "COPD exacerbation risk — e-health respiratory distress pattern"
        emergencies.append({
            "id": _alert_id(event, ts, "e_health"),
            "attack_type": "copd",
            "severity": "warning" if s["exacerbation_risk"] == "moderate" else "critical",
            "event": event,
            "detail": (
                f"RR {s['respiratory_rate_avg']}/min, PEF {s['pef_l_min']} L/min ({s['pef_predicted_pct']}% predicted), "
                f"cough {s['cough_episodes_week']}/week."
            ),
            "action": "Confirm rescue inhaler use; check nebuliser; contact pulmonologist if breathlessness worsens.",
            "timestamp": ts,
            "source": "e_health",
        })

    return emergencies


def build_caretaker_emergency_alerts(subject_id: str) -> dict:
    """Aggregate wearable + e-health attack-risk alerts for caretaker instant notification."""
    seen_ids: set[str] = set()
    emergencies: list[dict] = []

    def add(alert: dict) -> None:
        aid = alert.get("id") or _alert_id(alert["event"], alert["timestamp"], alert["source"])
        if aid in seen_ids:
            return
        seen_ids.add(aid)
        emergencies.append({**alert, "id": aid})

    for a in _live_parkinson_attack_alerts(subject_id):
        add(a)
    for a in _live_copd_attack_alerts(subject_id):
        add(a)

    analysis = build_performance_analysis(subject_id)
    if analysis:
        for a in analysis.get("alerts", []):
            if a.get("source") not in WEARABLE_SOURCES | EHEALTH_SOURCES:
                continue
            attack = _classify_attack(a)
            if not attack:
                continue
            if not a.get("red_flag") and attack != "copd":
                continue
            if a.get("red_flag") or (attack == "copd" and a.get("source") == "e_health"):
                add({
                    "id": _alert_id(a["event"], a["timestamp"], a["source"]),
                    "attack_type": attack,
                    "severity": "critical" if a.get("red_flag") else "warning",
                    "event": a["event"],
                    "detail": a.get("detail", ""),
                    "action": a.get("clinical_relevance", ""),
                    "timestamp": a["timestamp"],
                    "source": a["source"],
                })

    emergencies.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "subject_id": subject_id,
        "has_active_emergency": any(e["severity"] == "critical" for e in emergencies),
        "poll_interval_seconds": 20,
        "emergencies": emergencies,
    }
