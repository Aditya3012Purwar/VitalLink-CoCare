"""Structured Parkinson's disease performance analysis — alerts with clinical reasoning."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from copd_data import build_copd_alerts, get_copd_vitals, has_copd_comorbidity
from pads_data import get_patient_detail
from voice_chat_store import get_voice_chat_alerts

SEVERITY_SCORE = {"normal": 0, "mild": 1, "moderate": 2, "high": 3}


def _timestamp(hours_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()


def build_performance_analysis(subject_id: str) -> dict | None:
    detail = get_patient_detail(subject_id)
    if not detail:
        return None

    patient = detail["patient"]
    tasks = detail["task_summaries"]
    nms_items = detail["nms_items"]
    nms_domains = detail["nms_domains"]
    nms_positive = sum(1 for i in nms_items if i["positive"])
    years_since = (patient.get("age") or 0) - (patient.get("age_at_diagnosis") or patient.get("age") or 0)

    severities = []
    elevated_tasks = []
    rest_tremor = None
    dominant_wrist = None
    peak_freq = 0

    for t in tasks:
        left = t.get("left")
        right = t.get("right")
        for side, label in [(left, "left"), (right, "right")]:
            if not side:
                continue
            sev = side.get("severity", "normal")
            severities.append(SEVERITY_SCORE.get(sev, 0))
            if sev in ("moderate", "high"):
                elevated_tasks.append({
                    "task": t["label"],
                    "wrist": label,
                    "severity": sev,
                    "frequency_hz": side.get("tremor_frequency_hz"),
                    "amplitude_g": side.get("tremor_amplitude_g"),
                })
            if t["task_id"] in ("Relaxed", "RelaxedTask") and sev != "normal":
                rest_tremor = side
                dominant_wrist = label
                peak_freq = side.get("tremor_frequency_hz", 0)

    motor_score = 100 - min(100, int(sum(severities) / max(len(severities), 1) * 25))
    nms_score = max(0, 100 - int(nms_positive / 30 * 100))

    if motor_score >= 75 and nms_score >= 70:
        overall = "stable"
    elif motor_score >= 50 or nms_score >= 50:
        overall = "moderate"
    else:
        overall = "declining"

    top_nms = sorted(nms_domains, key=lambda d: d["score_pct"], reverse=True)[:3]
    positive_symptoms = [i for i in nms_items if i["positive"]][:5]

    kinetic_elevated = any(
        t["category"] == "kinetic"
        and (
            (t.get("left") or {}).get("severity") in ("moderate", "high")
            or (t.get("right") or {}).get("severity") in ("moderate", "high")
        )
        for t in tasks
    )

    alerts: list[dict] = []

    if rest_tremor:
        reason = (
            "Rhythmic tremor in the Parkinsonian frequency band during rest is consistent with "
            "classic PD rest tremor (PADS study: dominant peak ~4 Hz in PD vs minimal in healthy controls)."
        )
        if not (3 <= peak_freq <= 6):
            reason = (
                "Rest-period tremor detected on accelerometer/gyroscope signals during the Relaxed PADS task. "
                "Frequency and amplitude should be tracked across medication cycles."
            )
        alerts.append({
            "event": "Rest tremor detected during Relaxed assessment",
            "detail": (
                f"{dominant_wrist.capitalize()} wrist showed {rest_tremor['severity']} tremor at ~{peak_freq} Hz "
                f"(amplitude {rest_tremor.get('tremor_amplitude_g', 0)} g)."
            ),
            "reason": reason,
            "clinical_relevance": "May reflect dopaminergic deficit; worse before levodopa (off-period) is common.",
            "timestamp": _timestamp(2.5),
            "source": "wearable",
            "red_flag": rest_tremor["severity"] in ("moderate", "high"),
        })

    if elevated_tasks:
        names = ", ".join(f"{e['task']} ({e['wrist']})" for e in elevated_tasks[:3])
        if kinetic_elevated:
            reason = (
                "PADS ML analysis found kinetic tasks (Entrainment, Touch Nose) highest information gain "
                "for distinguishing PD from similar disorders — bradykinesia and rigidity surface under active movement."
            )
            clinical = "Consider physiotherapy and medication timing review."
        else:
            reason = (
                "Postural and functional PADS tasks amplify rigidity and tremor that may be subtle at rest. "
                "Elevated readings suggest active-movement motor burden."
            )
            clinical = "Review occupational therapy needs and levodopa dosing around daily activities."
        alerts.append({
            "event": "Elevated movement abnormality on kinetic/postural tasks",
            "detail": f"Abnormal readings during: {names}.",
            "reason": reason,
            "clinical_relevance": clinical,
            "timestamp": _timestamp(2.8),
            "source": "wearable",
            "red_flag": True,
        })

    if nms_positive >= 10:
        domain_label = top_nms[0]["label"] if top_nms else "multiple domains"
        alerts.append({
            "event": f"High non-motor symptom burden ({nms_positive}/30 PDNMS positive)",
            "detail": f"Most affected domains: {', '.join(d['label'] for d in top_nms)}.",
            "reason": (
                "Non-motor symptoms often precede or parallel motor decline in Parkinson's. "
                f"Sleep/fatigue and mood domains strongly differentiate pathology in PADS PD vs HC classification. "
                f"Elevated {domain_label} is a leading contributor."
            ),
            "clinical_relevance": "Targeted screening and symptomatic treatment may improve quality of life.",
            "timestamp": _timestamp(18),
            "source": "human",
            "red_flag": True,
        })
    elif nms_positive >= 5:
        alerts.append({
            "event": f"Moderate non-motor symptoms ({nms_positive}/30 PDNMS positive)",
            "detail": f"Notable domains: {', '.join(d['label'] for d in top_nms[:2])}.",
            "reason": (
                "Patient-reported PDNMS responses indicate emerging non-motor burden. "
                "These symptoms frequently affect sleep, mood, and autonomic function in mid-stage PD."
            ),
            "clinical_relevance": "Schedule focused review of sleep, mood, and autonomic symptoms at next visit.",
            "timestamp": _timestamp(36),
            "source": "human",
            "red_flag": False,
        })

    if years_since >= 5:
        alerts.append({
            "event": f"Extended disease course ({years_since} years since diagnosis)",
            "detail": (
                "Care-team review flagged longer disease duration as a factor in motor fluctuation risk "
                "and progressive non-motor burden."
            ),
            "reason": (
                "Longer disease duration correlates with motor complication risk (wearing-off, dyskinesia) "
                "and progressive non-motor burden."
            ),
            "clinical_relevance": "Monitor for motor fluctuations via home smartwatch assessments.",
            "timestamp": _timestamp(72),
            "source": "human",
            "red_flag": False,
        })

    if not alerts:
        alerts.append({
            "event": "Stable smartwatch and questionnaire profile",
            "detail": "No significant motor or non-motor flags in latest PADS assessment.",
            "reason": (
                "Combined wearable movement analysis and patient questionnaire show values within expected "
                "ranges for current treatment stage."
            ),
            "clinical_relevance": "Continue scheduled home monitoring; no immediate intervention required.",
            "timestamp": _timestamp(24),
            "source": "wearable",
            "red_flag": False,
        })

    if has_copd_comorbidity(subject_id):
        for ca in build_copd_alerts(subject_id):
            alerts.append(ca)

    voice_alerts = get_voice_chat_alerts(subject_id)
    for va in voice_alerts:
        alerts.append({
            "event": va.get("event", "Health Chat alert"),
            "detail": va.get("detail", ""),
            "reason": va.get("reason", ""),
            "clinical_relevance": va.get("clinical_relevance", ""),
            "timestamp": va.get("timestamp", _timestamp(1)),
            "source": "voice_chat",
            "red_flag": bool(va.get("red_flag", False)),
            "assigned_doctor": va.get("assigned_doctor"),
            "session_id": va.get("session_id"),
        })

    alerts.sort(key=lambda a: a["timestamp"], reverse=True)

    summary_parts = [
        f"Parkinson's patient (age {patient.get('age')}, {years_since}y since diagnosis).",
        f"Motor performance score: {motor_score}/100; NMS score: {nms_score}/100; overall: {overall}.",
    ]
    if has_copd_comorbidity(subject_id):
        copd = get_copd_vitals(subject_id)
        if copd:
            s = copd["summary"]
            summary_parts.append(
                f"COPD comorbidity: mean SpO₂ {s['spo2_avg_pct']}%, sleep efficiency {s['sleep_efficiency_pct']}%, "
                f"AHI {s['sleep_disorder_index']} — e-health data synced."
            )
    if rest_tremor:
        summary_parts.append(
            f"Smartwatch shows {rest_tremor['severity']} rest tremor ({peak_freq} Hz, {dominant_wrist} wrist)."
        )
    if nms_positive:
        summary_parts.append(
            f"{nms_positive}/30 non-motor symptoms reported — review {top_nms[0]['label'] if top_nms else 'domains'}."
        )

    return {
        "subject_id": subject_id,
        "executive_summary": " ".join(summary_parts),
        "performance": {
            "motor_score": motor_score,
            "nms_score": nms_score,
            "overall_status": overall,
            "risk_level": "high" if overall == "declining" else "moderate" if overall == "moderate" else "stable",
        },
        "alerts": alerts,
        "what_happened": alerts,
        "why_analysis": [],
        "key_metrics": {
            "nms_positive": nms_positive,
            "nms_total": 30,
            "elevated_task_count": len(elevated_tasks),
            "years_since_diagnosis": years_since,
            "dominant_tremor_hz": peak_freq if rest_tremor else None,
            **(
                {"copd": get_copd_vitals(subject_id)["summary"]}
                if has_copd_comorbidity(subject_id) and get_copd_vitals(subject_id)
                else {}
            ),
        },
        "top_nms_domains": top_nms,
        "positive_symptoms": [{"text": s["text"]} for s in positive_symptoms],
    }
