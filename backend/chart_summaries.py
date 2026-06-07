"""Generate simple plain-language summaries for dashboard charts."""

from __future__ import annotations

from performance_analysis import build_performance_analysis
from pads_data import get_patient_detail


def build_chart_summaries(subject_id: str, task: str = "Relaxed", wrist: str = "Left") -> dict:
    detail = get_patient_detail(subject_id)
    analysis = build_performance_analysis(subject_id)
    if not detail or not analysis:
        return {}

    tasks = detail["task_summaries"]
    nms_positive = analysis["key_metrics"]["nms_positive"]
    top_nms = analysis.get("top_nms_domains", [])

    selected = next((t for t in tasks if t["task_id"] == task), tasks[0] if tasks else None)
    side = selected.get("left" if wrist == "Left" else "right") if selected else None

    heatmap_elevated = sum(
        1 for t in tasks
        if (t.get("left") or {}).get("severity") in ("moderate", "high")
        or (t.get("right") or {}).get("severity") in ("moderate", "high")
    )

    accel_summary = (
        f"During the **{selected['label'] if selected else task}** task ({wrist} wrist), "
        f"the watch recorded arm acceleration on X, Y, Z axes. "
    )
    if side:
        accel_summary += (
            f"Tremor severity is **{side['severity']}** at **{side['tremor_frequency_hz']} Hz** "
            f"(amplitude {side['tremor_amplitude_g']} g). "
        )
        if 3 <= side.get("tremor_frequency_hz", 0) <= 6:
            accel_summary += "Rhythmic wavy lines in the 4–6 Hz band are typical of Parkinson's rest tremor."
        else:
            accel_summary += "Movement pattern should be compared across tasks and medication timing."
    else:
        accel_summary += "Select a task to view wrist-specific tremor patterns."

    psd_summary = (
        "The PSD chart converts shaking into frequency peaks. "
        "The **tallest bar** is the dominant tremor speed. "
    )
    if side and 3 <= side.get("tremor_frequency_hz", 0) <= 6:
        psd_summary += (
            f"This patient peaks near **{side['tremor_frequency_hz']} Hz** — within the classic PD tremor range (4–6 Hz). "
            "Higher bars = stronger rhythmic tremor at that frequency."
        )
    else:
        psd_summary += "Healthy controls show flat/low PSD; PD patients often show a clear 4 Hz peak during rest."

    heatmap_summary = (
        f"Each row is one of 11 PADS assessment steps. "
        f"**{heatmap_elevated}** steps show moderate-to-high tremor on at least one wrist. "
        "Green = normal, amber = mild, orange = moderate, red = high. "
        "Compare left vs right columns for side-dominant tremor — common in PD."
    )

    nms_summary = (
        f"**{nms_positive}/30** non-motor symptom questions were answered 'yes'. "
    )
    if top_nms:
        nms_summary += (
            f"Highest affected area: **{top_nms[0]['label']}** ({top_nms[0]['score_pct']}% positive). "
            "These symptoms often appear before or alongside motor decline in Parkinson's."
        )

    return {
        "subject_id": subject_id,
        "task": task,
        "wrist": wrist,
        "summaries": {
            "acceleration": accel_summary,
            "psd": psd_summary,
            "heatmap": heatmap_summary,
            "nms_domains": nms_summary,
            "overall": analysis["executive_summary"],
        },
    }
