"""OpenRouter LLM integration for clinical explanations."""

from __future__ import annotations

import json

from llm_client import chat_completion, get_llm_model, get_llm_source, llm_configured


def _fallback_explanation(context: dict, audience: str) -> str:
    """Rule-based explanation when API key is unavailable."""
    p = context.get("patient", {})
    tasks = context.get("task_summaries", [])
    nms = context.get("nms_positive", 0)
    condition = p.get("condition", "Unknown")

    high_tasks = [t for t in tasks if (t.get("left") or {}).get("severity") == "high" or (t.get("right") or {}).get("severity") == "high"]
    rest_tasks = [t for t in tasks if t["task_id"] in ("Relaxed", "RelaxedTask")]

    lines = [
        f"**Patient overview:** {condition} patient, age {p.get('age')}, diagnosed at age {p.get('age_at_diagnosis', 'N/A')}.",
        f"**Non-motor symptoms:** {nms}/30 PDNMS items reported positive — sleep, mood, and autonomic domains should be reviewed.",
    ]

    if rest_tasks:
        rt = rest_tasks[0]
        left = rt.get("left") or {}
        right = rt.get("right") or {}
        lines.append(
            f"**Rest tremor (Relaxed task):** Left wrist ~{left.get('tremor_frequency_hz', '?')} Hz "
            f"({left.get('tremor_amplitude_g', '?')} g std); Right ~{right.get('tremor_frequency_hz', '?')} Hz. "
            "PD rest tremor typically peaks around 4–6 Hz per the PADS study (Varghese et al., npj Parkinson's Disease 2024)."
        )

    if high_tasks:
        names = ", ".join(t["label"] for t in high_tasks[:3])
        lines.append(f"**Elevated movement abnormality** detected during: {names}. Consider medication timing (on/off state) and postural vs rest tremor differentiation.")

    if audience == "caretaker":
        lines.append(
            "**For caregivers:** Encourage daily smartwatch assessments at the same time. "
            "Note if tremor worsens before medication (off-period) or during stress. "
            "Report falls, swallowing difficulty, or sudden cognitive changes to the neurologist."
        )
    else:
        lines.append(
            "**Clinical note:** Smartwatch data complements but does not replace examination. "
            "Kinetic tasks showed highest information gain for PD vs differential diagnosis in PADS ML analysis. "
            "Consider DaT scan if diagnostic uncertainty persists."
        )

    return "\n\n".join(lines)


async def generate_explanation(context: dict, audience: str = "doctor") -> dict:

    system_prompt = """You are a Parkinson's disease clinical assistant analyzing PADS (Parkinson's Disease Smartwatch) dataset measurements.
This platform is exclusively for Parkinson's disease patients — do NOT discuss COPD, asthma, cardiovascular, or other conditions.
Reference: Varghese et al. "Machine Learning in the Parkinson's disease smartwatch (PADS) dataset" (npj Parkinson's Disease, 2024).
The PADS study used Apple Watch Series 4 on both wrists during 11 neurological assessment steps, plus 30 PDNMS questionnaire items.

Guidelines:
- Focus only on Parkinson's motor symptoms (tremor, rigidity, bradykinesia) and non-motor symptoms
- Mention tremor frequency (~4 Hz rest tremor in PD), amplitude, and task-specific patterns
- Discuss levodopa on/off periods, fall risk, and PDNMS domains (sleep, mood, autonomic)
- NEVER provide definitive diagnosis — frame as monitoring support
- Use markdown formatting with headers and bullet points
- Keep response under 400 words"""

    user_prompt = f"""Analyze this patient's smartwatch and questionnaire data for a {audience}:

{json.dumps(context, indent=2)}

Provide:
1. Key movement findings from smartwatch (tremor, rigidity indicators, task-specific patterns)
2. Non-motor symptom summary by domain
3. What changed or stands out vs typical PD/HC patterns from PADS research
4. Recommended follow-up actions for the care team
5. {"Simple, reassuring guidance for the family caretaker" if audience == "caretaker" else "Clinical decision support notes for the neurologist"}"""

    if not llm_configured():
        return {
            "explanation": _fallback_explanation(context, audience),
            "model": "fallback",
            "source": "rule-based (set OPENAI_API_KEY for LLM)",
        }

    try:
        content, model, source = await chat_completion(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=800,
            temperature=0.4,
        )
        return {
            "explanation": content,
            "model": model,
            "source": source,
        }
    except Exception as e:
        return {
            "explanation": _fallback_explanation(context, audience) + f"\n\n*(LLM unavailable: {e})*",
            "model": "fallback",
            "source": "rule-based (LLM error)",
        }


def _fallback_chat_reply(question: str, context: dict, analysis: dict | None) -> str:
    q = question.lower()
    p = context.get("patient", {})
    nms = context.get("nms_positive", 0)
    tasks = context.get("task_summaries", [])

    if "tremor" in q or "shake" in q:
        rest = next((t for t in tasks if t["task_id"] in ("Relaxed", "RelaxedTask")), None)
        if rest:
            left = rest.get("left") or {}
            return (
                f"Rest tremor on the Relaxed task: left wrist ~{left.get('tremor_frequency_hz', '?')} Hz, "
                f"severity {left.get('severity', 'unknown')}. PD tremor typically appears at 4–6 Hz when the arm is at rest. "
                "If tremor worsens before the next levodopa dose, consider an off-period."
            )
        return "Tremor data comes from the Relaxed and Hold Weight smartwatch tasks. Check the acceleration and PSD charts for frequency peaks around 4 Hz."

    if "medication" in q or "levodopa" in q or "dose" in q:
        return (
            "Smartwatch monitoring helps detect on/off periods — tremor and rigidity often worsen when levodopa wears off. "
            "Review medication timing if afternoon/evening task severity is higher than morning assessments."
        )

    if "nms" in q or "non-motor" in q or "sleep" in q or "mood" in q:
        return f"This patient reported {nms}/30 positive PDNMS items. Sleep, mood, and autonomic domains are often elevated in PD and affect quality of life independently of tremor."

    if analysis:
        cond = p.get("condition", "Parkinson's")
        return (
            f"Based on current PADS data for this {cond} patient (age {p.get('age')}): "
            f"{analysis.get('executive_summary', '')} Ask specifically about tremor, NMS, medication, or individual assessment steps."
        )

    cond = p.get("condition", "Parkinson's")
    return (
        f"I can help interpret this patient's PADS smartwatch data. "
        f"They are a {cond} patient, age {p.get('age')}, with {nms}/30 non-motor symptoms. "
        "Try asking: 'Explain the rest tremor', 'Should we adjust levodopa?', or 'What do the NMS scores mean?'"
    )


async def generate_chat_reply(
    question: str,
    context: dict,
    analysis: dict | None = None,
    history: list[dict] | None = None,
) -> dict:
    history = history or []

    system_prompt = """You are a Parkinson's disease clinical assistant in a doctor's dashboard chatbot.
Answer questions about the CURRENT patient's smartwatch and questionnaire data only.
Use plain, clear language a neurologist would find helpful. Be concise (under 200 words unless asked for detail).
Reference PADS dataset findings when relevant (tremor ~4 Hz, kinetic tasks, PDNMS domains).
Never diagnose — provide monitoring support and clinical reasoning.
If asked about something not in the patient data, say what data would be needed."""

    patient_block = json.dumps({"context": context, "analysis": analysis}, indent=2)
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({
        "role": "user",
        "content": f"Patient data:\n{patient_block}\n\nDoctor's question: {question}",
    })

    if not llm_configured():
        return {
            "reply": _fallback_chat_reply(question, context, analysis),
            "model": "fallback",
            "source": "rule-based",
        }

    try:
        content, model, source = await chat_completion(
            messages,
            max_tokens=500,
            temperature=0.5,
        )
        return {"reply": content, "model": model, "source": source}
    except Exception as e:
        return {
            "reply": _fallback_chat_reply(question, context, analysis) + f"\n\n*(LLM unavailable: {e})*",
            "model": "fallback",
            "source": "rule-based",
        }
