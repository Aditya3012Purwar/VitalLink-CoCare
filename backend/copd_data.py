"""Mock COPD + e-health vitals for comorbid Parkinson's patients (demo dataset)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

# Patient 004: Parkinson's + COPD (GOLD stage II, former smoker)
COMORBID_PATIENTS: dict[str, dict] = {
    "004": {
        "conditions": ["Parkinson's disease", "COPD (GOLD II)"],
        "copd_stage": "GOLD II",
        "smoking_history": "former — 35 pack-years, quit 2018",
        "respiratory_specialist": "Dr. Eva Richter (Pulmonology)",
        "ehealth_platform": "Swiss eHealth Connect (mock)",
    },
}

COPD_PATIENT_IDS = set(COMORBID_PATIENTS.keys())


def has_copd_comorbidity(subject_id: str) -> bool:
    return subject_id in COPD_PATIENT_IDS


def get_comorbidity_meta(subject_id: str) -> dict | None:
    return COMORBID_PATIENTS.get(subject_id)


def _days_ago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).strftime("%Y-%m-%d")


def _timestamp(hours_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()


def _spo2_trend() -> list[dict]:
    values = [93, 92, 91, 90, 91, 92, 91, 90, 89, 91, 92, 91, 90, 91]
    return [{"date": _days_ago(13 - i), "value": v} for i, v in enumerate(values)]


def _sleep_hours_trend() -> list[dict]:
    values = [5.2, 4.8, 5.5, 4.2, 5.0, 4.5, 5.8, 4.0, 4.6, 5.1, 4.3, 5.4, 4.7, 5.0]
    return [{"date": _days_ago(13 - i), "value": v} for i, v in enumerate(values)]


def _respiratory_rate_trend() -> list[dict]:
    values = [18, 19, 20, 21, 19, 22, 20, 21, 23, 19, 20, 22, 21, 20]
    return [{"date": _days_ago(13 - i), "value": v} for i, v in enumerate(values)]


def _nighttime_spo2_trend() -> list[dict]:
    values = [88, 87, 86, 85, 87, 86, 84, 85, 86, 87, 85, 86, 84, 85]
    return [{"date": _days_ago(13 - i), "value": v} for i, v in enumerate(values)]


def get_copd_vitals(subject_id: str) -> dict | None:
    meta = COMORBID_PATIENTS.get(subject_id)
    if not meta:
        return None

    spo2 = _spo2_trend()
    spo2_avg = round(sum(p["value"] for p in spo2) / len(spo2), 1)

    return {
        "subject_id": subject_id,
        "conditions": meta["conditions"],
        "ehealth_platform": meta["ehealth_platform"],
        "last_sync": _days_ago(0),
        "sync_status": "synced",
        "respiratory_specialist": meta["respiratory_specialist"],
        "summary": {
            "spo2_avg_pct": spo2_avg,
            "spo2_target_pct": 92,
            "spo2_status": "below_target",
            "sleep_efficiency_pct": 62,
            "sleep_disorder_index": 18.4,
            "sleep_disorder_label": "Moderate obstructive sleep apnea",
            "avg_sleep_hours": 4.8,
            "respiratory_rate_avg": 20.2,
            "nocturnal_desat_events": 7,
            "cough_episodes_week": 12,
            "pef_l_min": 210,
            "pef_predicted_pct": 58,
            "exacerbation_risk": "moderate",
            "gold_stage": meta["copd_stage"],
        },
        "sleep_disorder": {
            "diagnosis": "Obstructive sleep apnea (OSA) + COPD overlap syndrome",
            "severity": "moderate",
            "avg_sleep_hours": 4.8,
            "wake_after_sleep_onset_min": 78,
            "rem_sleep_pct": 14,
            "deep_sleep_pct": 9,
            "snoring_index": 42,
            "notes": (
                "Nocturnal oxygen desaturation clusters between 02:00–05:00. "
                "PD nocturia and COPD bronchospasm may compound sleep fragmentation."
            ),
        },
        "trends": {
            "spo2": spo2,
            "sleep_hours": _sleep_hours_trend(),
            "respiratory_rate": _respiratory_rate_trend(),
            "nighttime_spo2": _nighttime_spo2_trend(),
        },
        "clinical_reasoning": (
            f"14-day home pulse oximetry shows mean SpO₂ {spo2_avg}% (target ≥92% for COPD). "
            "Seven nocturnal desaturation events (<88% for >30s) correlate with poor sleep efficiency (62%) "
            "and moderate OSA (AHI 18.4). Respiratory rate averaging 20.2/min with elevated cough burden "
            "suggests suboptimal COPD control alongside Parkinson's motor fluctuations. "
            "Comorbid PD may worsen nocturnal hypoventilation via reduced chest wall mobility."
        ),
    }


def build_copd_alerts(subject_id: str) -> list[dict]:
    vitals = get_copd_vitals(subject_id)
    if not vitals:
        return []

    s = vitals["summary"]
    sleep = vitals["sleep_disorder"]
    alerts: list[dict] = []

    if s["spo2_avg_pct"] < 92:
        alerts.append({
            "event": f"Low average oxygen saturation ({s['spo2_avg_pct']}%)",
            "detail": (
                f"14-day home oximetry mean SpO₂ {s['spo2_avg_pct']}% — below COPD target ≥{s['spo2_target_pct']}%. "
                f"{s['nocturnal_desat_events']} nocturnal desaturation events recorded."
            ),
            "reason": (
                "Chronic hypoxemia in COPD indicates impaired gas exchange and raises exacerbation risk. "
                "In Parkinson's + COPD overlap, nocturnal mobility limitation and aspiration risk "
                "can worsen overnight oxygenation."
            ),
            "clinical_relevance": (
                "Review long-acting bronchodilator adherence; consider nocturnal O₂ if persistent <88%. "
                "Coordinate with pulmonology (Dr. Eva Richter)."
            ),
            "timestamp": _timestamp(4),
            "source": "e_health",
            "red_flag": s["spo2_avg_pct"] < 90,
        })

    if s["sleep_efficiency_pct"] < 70:
        alerts.append({
            "event": f"Sleep disorder — efficiency {s['sleep_efficiency_pct']}% (AHI {s['sleep_disorder_index']})",
            "detail": (
                f"{sleep['diagnosis']}. Average sleep {sleep['avg_sleep_hours']}h/night; "
                f"WASO {sleep['wake_after_sleep_onset_min']} min. REM sleep {sleep['rem_sleep_pct']}%."
            ),
            "reason": (
                "Sleep fragmentation is common in Parkinson's (REM behaviour disorder, nocturia) "
                "and amplified by COPD nocturnal desaturation and cough. "
                "Poor sleep worsens daytime cognition, falls risk, and breathlessness perception."
            ),
            "clinical_relevance": (
                "Screen for CPAP candidacy; align levodopa timing to reduce nocturnal motor symptoms. "
                "PDNMS sleep domain already positive — dual pathology likely."
            ),
            "timestamp": _timestamp(8),
            "source": "e_health",
            "red_flag": s["sleep_disorder_index"] >= 15,
        })

    if s["exacerbation_risk"] in ("moderate", "high"):
        alerts.append({
            "event": f"COPD exacerbation risk: {s['exacerbation_risk']}",
            "detail": (
                f"PEF {s['pef_l_min']} L/min ({s['pef_predicted_pct']}% predicted); "
                f"{s['cough_episodes_week']} cough episodes/week; RR avg {s['respiratory_rate_avg']}/min."
            ),
            "reason": (
                "Rescue inhaler overuse pattern from e-health medication log plus declining overnight SpO₂ "
                "suggests borderline COPD control. GOLD II patients with comorbid PD have higher "
                "hospitalisation risk when motor symptoms limit inhaler technique."
            ),
            "clinical_relevance": "Inhaler technique review with caretaker; action plan for exacerbation.",
            "timestamp": _timestamp(12),
            "source": "e_health",
            "red_flag": s["exacerbation_risk"] == "high",
        })

    return alerts
