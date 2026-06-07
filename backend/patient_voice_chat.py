"""Patient voice companion — emotional support + up to 5 follow-up questions."""

from __future__ import annotations

import json
import re
import uuid
from typing import Any

from llm_client import chat_completion, get_llm_model, get_llm_source, llm_configured
from pads_data import build_llm_context
from performance_analysis import build_performance_analysis
from doctor_matcher import get_patient_care_team, match_doctor_for_session
from voice_chat_classifier import classify_session_alerts
from voice_chat_store import (
    append_transcript,
    get_assigned_doctor,
    load_llm_session_state,
    mark_session_complete,
    register_session,
    store_classified_alerts,
    sync_llm_session_state,
)

MAX_FOLLOW_UPS = 5
MAX_SUPPORT_WORDS = 18
MAX_QUESTION_WORDS = 14
SESSION_CLOSING = "I'll forward this to your doctor for your next visit."

COVERAGE_TOPICS = [
    "overall symptoms (tremor, stiffness, breathlessness, mood)",
    "medication timing and adherence",
    "sleep and energy",
    "home safety, falls, or daily function",
    "concerns for doctor or caretaker",
]

_sessions: dict[str, dict[str, Any]] = {}


def _new_session(subject_id: str) -> dict[str, Any]:
    return {
        "subject_id": subject_id,
        "history": [],
        "follow_ups_asked": 0,
        "questions_log": [],
        "complete": False,
        "greeting_done": False,
        "main_concern": "",
    }


def _ensure_session_shape(session: dict[str, Any]) -> dict[str, Any]:
    session.setdefault("questions_log", [])
    session.setdefault("follow_ups_asked", 0)
    session.setdefault("history", [])
    session.setdefault("complete", False)
    session.setdefault("greeting_done", bool(session.get("history")))
    session.setdefault("main_concern", "")
    return session


def _user_turn_count(session: dict[str, Any]) -> int:
    return sum(1 for h in session.get("history", []) if h.get("role") == "user")


def _ensure_main_concern(session: dict[str, Any], user_message: str) -> str:
    concern = (session.get("main_concern") or "").strip()
    if concern:
        return concern
    text = user_message.strip()
    if text:
        session["main_concern"] = text[:240]
        return session["main_concern"]
    return ""


def _concern_followup_questions(main_concern: str) -> list[str]:
    c = main_concern.lower()
    if any(w in c for w in ("leg", "knee", "ankle", "foot", "hip", "hurt", "injur", "pain", "ache")):
        return [
            "When did that pain start?",
            "Does it hurt more when walking?",
            "Any swelling or trouble putting weight on it?",
            "Did a fall or bump cause it?",
            "Should we flag this urgently for your doctor?",
        ]
    if any(w in c for w in ("breath", "copd", "wheeze", "cough", "chest", "oxygen")):
        return [
            "When is breathlessness worst for you?",
            "Any chest tightness or new cough?",
            "Are you using inhalers as prescribed?",
            "Can you manage stairs at home?",
            "Should your doctor review this soon?",
        ]
    if any(w in c for w in ("tremor", "shake", "stiff", "rigid")):
        return [
            "When is the tremor or stiffness worst?",
            "Which side bothers you more?",
            "Does it change around medicine times?",
            "Is it affecting eating or dressing?",
            "Anything else about the shaking?",
        ]
    if any(w in c for w in ("sleep", "tired", "fatigue", "energy", "insomnia")):
        return [
            "How many hours are you sleeping?",
            "Do you wake often at night?",
            "Do you feel rested in the morning?",
            "Is fatigue worse at certain times?",
            "Has sleep changed this week?",
        ]
    if any(w in c for w in ("med", "pill", "dose", "forget", "adherence")):
        return [
            "Which doses are hardest to remember?",
            "What time do you usually take them?",
            "Any side effects after doses?",
            "Who helps you with medicines?",
            "Should we tell your doctor about this?",
        ]
    if any(w in c for w in ("fall", "balance", "dizzy", "trip")):
        return [
            "When did the fall or near-fall happen?",
            "Were you injured at all?",
            "Where at home did it happen?",
            "Are you worried about balance now?",
            "Should your caretaker know today?",
        ]
    return [
        "Can you tell me a bit more about that?",
        "When did you first notice it?",
        "How is it affecting your day?",
        "Has it been getting better or worse?",
        "What should your care team know?",
    ]


def get_or_create_session(session_id: str | None, subject_id: str) -> tuple[str, dict[str, Any]]:
    if session_id and session_id in _sessions:
        return session_id, _ensure_session_shape(_sessions[session_id])

    if session_id:
        restored = load_llm_session_state(session_id, subject_id)
        if restored:
            _sessions[session_id] = _ensure_session_shape(restored)
            return session_id, _sessions[session_id]

    sid = session_id or str(uuid.uuid4())
    _sessions[sid] = _new_session(subject_id)
    return sid, _sessions[sid]


def _parse_llm_json(raw: str) -> dict[str, str | bool]:
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {
            "emotional_support": text[:280],
            "question": "",
            "session_complete": True,
            "is_reask": False,
        }
    return {
        "emotional_support": str(data.get("emotional_support", "")).strip(),
        "question": str(data.get("question", "")).strip(),
        "session_complete": bool(data.get("session_complete", False)),
        "is_reask": bool(data.get("is_reask", False)),
    }


def _prior_support_phrases(session: dict[str, Any]) -> list[str]:
    phrases: list[str] = []
    for h in session["history"]:
        if h["role"] != "assistant":
            continue
        content = h["content"]
        first = content.split(".")[0].strip()
        if first and first not in phrases:
            phrases.append(first[:120])
    return phrases[-6:]


def _opening_greeting(patient_name: str) -> str:
    name = patient_name.strip()
    return f"Good day, {name}." if name else "Good day."


def _clamp_words(text: str, max_words: int) -> str:
    cleaned = " ".join(text.split())
    if not cleaned:
        return ""
    words = cleaned.split()
    if len(words) <= max_words:
        return cleaned
    return " ".join(words[:max_words]).rstrip(".,;:!?") + "."


def _trim_turn(emotional: str, question: str) -> tuple[str, str]:
    return (
        _clamp_words(emotional, MAX_SUPPORT_WORDS),
        _clamp_words(question, MAX_QUESTION_WORDS),
    )


_EARLY_WRAP_PHRASES = (
    "no other issue", "no other problem", "no other concerns", "no other concern",
    "nothing else", "nothing more", "that's all", "thats all", "that is all",
    "that's it", "thats it", "that is it", "only issue", "only problem",
    "just this", "just that", "no more issue", "no more problems",
    "don't have anything else", "do not have anything else",
    "nothing more to add", "nothing else to report", "nothing else to say",
    "i'm done", "im done", "i am done", "that covers it", "that's everything",
    "not anything else", "no further", "no additional",
    "that's the only", "that is the only",
)

_DIRECT_DOCTOR_PHRASES = (
    "report to", "report this to", "tell my doctor", "tell the doctor",
    "tell dr", "send to doctor", "send to dr", "forward to doctor",
    "forward to dr", "forward this", "let my doctor know", "let the doctor know",
    "inform dr", "inform doctor", "notify dr", "notify doctor",
    "pass this to", "speak to dr", "reach out to dr", "contact dr",
    "alert dr", "alert doctor", "message dr", "message doctor",
)


def _wants_early_wrap_up(text: str) -> bool:
    t = text.strip().lower()
    if not t:
        return False
    if any(p in t for p in _EARLY_WRAP_PHRASES):
        return True
    if any(p in t for p in _DIRECT_DOCTOR_PHRASES):
        return True
    if re.search(r"\b(report|tell|send|forward|notify|inform|contact|alert)\b.{0,40}\b(doctor|dr\.?)\b", t):
        return True
    if re.search(r"\b(doctor|dr\.?).{0,40}\b(report|know|tell|send|forward)\b", t):
        return True
    if re.search(r"\b(that'?s? all|nothing else|no other|only (issue|problem|concern))\b", t):
        return True
    return False


def _extract_requested_doctor(text: str, subject_id: str) -> str | None:
    t = text.lower().replace("müller", "mueller").replace("ü", "u")
    for doc in get_patient_care_team(subject_id):
        name = doc["name"]
        norm = name.lower().replace("müller", "mueller").replace("ü", "u")
        tokens = [tok for tok in re.sub(r"[^a-z\s]", "", norm).split() if tok not in ("dr", "doctor")]
        if tokens and tokens[-1] in t:
            return name
        if len(tokens) >= 2 and tokens[-2] in t:
            return name
    return None


def _is_vague_answer(text: str) -> bool:
    if _wants_early_wrap_up(text):
        return False
    t = text.strip().lower()
    if len(t) < 8:
        return True
    vague = (
        "i don't know", "not sure", "maybe", "fine", "ok", "okay", "good",
        "same", "nothing", "no", "yes", "idk", "unsure",
    )
    return t in vague or (len(t.split()) <= 3 and any(v in t for v in vague))


def _fallback_turn(
    session: dict[str, Any],
    user_message: str | None,
    patient_name: str,
    subject_id: str = "",
) -> dict[str, str | bool]:
    if not user_message:
        return {
            "emotional_support": _opening_greeting(patient_name),
            "question": "",
            "session_complete": False,
            "is_reask": False,
        }

    if _wants_early_wrap_up(user_message):
        return {
            "emotional_support": SESSION_CLOSING,
            "question": "",
            "session_complete": True,
            "is_reask": False,
        }

    asked = session["follow_ups_asked"]
    prior_q = session.get("questions_log", [])
    name_bit = f", {patient_name}" if patient_name else ""

    if _is_vague_answer(user_message) and prior_q:
        return {
            "emotional_support": "I want to understand — take your time.",
            "question": prior_q[-1],
            "session_complete": False,
            "is_reask": True,
        }

    main_concern = _ensure_main_concern(session, user_message)
    supports = [
        f"I hear you{name_bit} — let's focus on that.",
        "Thanks — that helps me understand.",
        "Got it — I'm following your concern.",
        "Noted — still on what you raised.",
    ]
    support = supports[asked % len(supports)]

    questions = _concern_followup_questions(main_concern)
    next_q = questions[min(asked, len(questions) - 1)]
    while next_q in prior_q and asked < len(questions) - 1:
        asked += 1
        next_q = questions[min(asked, len(questions) - 1)]

    if asked >= MAX_FOLLOW_UPS:
        return {
            "emotional_support": (
                f"{support} We've covered the key areas — your care team will review this."
            ),
            "question": "",
            "session_complete": True,
            "is_reask": False,
        }

    return {
        "emotional_support": support,
        "question": next_q,
        "session_complete": False,
        "is_reask": False,
    }


async def _llm_turn(
    session: dict[str, Any],
    user_message: str | None,
    context: dict,
    analysis: dict | None,
    patient_name: str,
    subject_id: str = "",
) -> dict[str, str | bool]:
    asked = session["follow_ups_asked"]
    remaining = MAX_FOLLOW_UPS - asked
    prior_questions = session.get("questions_log", [])
    prior_support = _prior_support_phrases(session)
    main_concern = (session.get("main_concern") or "").strip()
    user_turns = _user_turn_count(session)
    topics_list = "\n".join(f"- {t}" for t in COVERAGE_TOPICS)

    system = f"""You are a warm, concise health companion speaking DIRECTLY to {patient_name or "the patient"}.
Parkinson's and possibly COPD. Listen first — follow the patient's own issue, not a generic script.

PATIENT'S MAIN CONCERN (anchor the whole chat): "{main_concern or "not yet stated — use their latest message"}"
User messages so far: {user_turns}. NEW follow-ups asked: {asked}/{MAX_FOLLOW_UPS}. Remaining: {remaining}.
Prior questions (do NOT repeat): {json.dumps(prior_questions)}
Prior support phrases (do NOT repeat): {json.dumps(prior_support)}

Respond with JSON only:
{{
  "emotional_support": "one brief sentence",
  "question": "one short follow-up OR empty when ending",
  "session_complete": false,
  "is_reask": false
}}

TOPIC PRIORITY (critical — follow in order):
1. FIRST reply after the patient states an issue: acknowledge THEIR exact words; ask ONE clarifying question about THAT issue only. Do NOT ask about tremor, sleep, meds, or checklist items they did not mention.
2. Next 2–3 questions: stay on the main concern — timing, severity, triggers, daily impact, safety.
3. Only if slots remain AND the main concern is clear, ask ONE brief question from secondary areas: {topics_list}
4. NEVER pivot to an unrelated screening question while the patient is reporting pain, injury, breathlessness, falls, or another active problem.

BREVITY:
- emotional_support: max {MAX_SUPPORT_WORDS} words, ONE sentence referencing what they said.
- question: max {MAX_QUESTION_WORDS} words, ONE question tied to main concern.
- No lectures or chart recitation.

RULES:
1. emotional_support must echo their issue (e.g. leg pain → mention leg pain briefly).
2. Exactly ONE question per turn unless ending.
3. Vague answer → re-ask SAME concern, is_reask true.
4. Clear answer on main concern → deeper follow-up on SAME topic before changing subject.
5. Health-related only. No diagnosis or prescriptions.
6. No slots left → one-sentence close, session_complete true, question "".
7. Patient wants to stop OR says there is nothing else / no other issues OR asks to report directly to a doctor → session_complete true, question "", emotional_support brief ack only.
8. Do NOT ask another question if the patient has clearly finished reporting."""

    messages = [{"role": "system", "content": system}]
    for h in session["history"][-14:]:
        messages.append({"role": h["role"], "content": h["content"]})

    patient_block = json.dumps(
        {
            "context": context,
            "analysis_summary": (analysis or {}).get("executive_summary"),
            "alerts": (analysis or {}).get("alerts", [])[:4],
        },
        indent=2,
    )

    if user_message:
        if _wants_early_wrap_up(user_message):
            vague_hint = (
                "\n\nPatient wants to END the check-in now (nothing else / report to doctor). "
                "Set session_complete true, question empty string, brief ack — do NOT ask another question."
            )
        elif _is_vague_answer(user_message) and prior_questions:
            vague_hint = (
                "\nThe patient's reply seems brief or unclear — consider is_reask true "
                f"and gently re-ask about: {prior_questions[-1]}"
            )
        else:
            vague_hint = ""
        focus_hint = ""
        if not _wants_early_wrap_up(user_message):
            first_report = asked == 0 and user_turns == 1
            if first_report:
                focus_hint = (
                    "\n\nTHIS IS THEIR FIRST REPORT — main concern. "
                    f"Your question MUST dig into: \"{user_message}\" only. "
                    "Do NOT ask unrelated tremor/sleep/meds questions."
                )
            elif main_concern:
                focus_hint = (
                    f"\n\nStay focused on main concern: \"{main_concern}\". "
                    "Next question should deepen understanding of that — not change topic."
                )
        prompt = (
            f"Patient record (background only — do not recite, do not override patient's words):\n{patient_block}\n\n"
            f"Patient just said: \"{user_message}\"{vague_hint}{focus_hint}\n\n"
            f"Reply in JSON. Questions so far: {asked}/{MAX_FOLLOW_UPS}."
        )
    else:
        prompt = (
            f"Patient record (use for topic choice only):\n{patient_block}\n\n"
            f"Greet {patient_name or 'the patient'} with ONLY \"Good day, <name>.\" — question must be empty string."
        )
    messages.append({"role": "user", "content": prompt})

    if not llm_configured():
        return _fallback_turn(session, user_message, patient_name, subject_id)

    try:
        content, _, _ = await chat_completion(
            messages,
            max_tokens=180,
            temperature=0.45,
            json_mode=True,
        )
        parsed = _parse_llm_json(content)
        if user_message and _wants_early_wrap_up(user_message):
            parsed["session_complete"] = True
            parsed["question"] = ""
        emotional, question = _trim_turn(
            str(parsed["emotional_support"]),
            str(parsed.get("question", "")),
        )
        return {
            **parsed,
            "emotional_support": emotional,
            "question": question,
        }
    except Exception:
        return _fallback_turn(session, user_message, patient_name, subject_id)


async def _finalize_session(
    sid: str,
    subject_id: str,
    session: dict[str, Any],
    *,
    preferred_doctor: str | None = None,
    source: str = "local",
) -> dict[str, Any]:
    spoken = SESSION_CLOSING
    session["complete"] = True
    session["history"].append({"role": "assistant", "content": spoken})
    append_transcript(sid, subject_id, "assistant", spoken, emotional_support=spoken, question="")
    mark_session_complete(sid)
    sync_llm_session_state(sid, session)
    try:
        classified = await _maybe_classify_session(sid, subject_id, preferred_doctor=preferred_doctor)
    except Exception:
        classified = {
            "alerts_classified": False,
            "classified_alerts": [],
            "assigned_doctor": preferred_doctor or get_assigned_doctor(subject_id),
            "alert_sent": False,
        }
    return {
        "session_id": sid,
        "emotional_support": spoken,
        "question": "",
        "spoken_text": spoken,
        "follow_up_index": session["follow_ups_asked"],
        "max_follow_ups": MAX_FOLLOW_UPS,
        "session_complete": True,
        "model": get_llm_model(),
        "source": source,
        **classified,
    }


def _compose_spoken(emotional_support: str, question: str) -> str:
    parts = [p for p in (emotional_support.strip(), question.strip()) if p]
    return " ".join(parts)


async def process_voice_turn(
    subject_id: str,
    session_id: str | None,
    user_message: str | None,
    patient_name: str = "",
    action: str = "message",
) -> dict[str, Any]:
    context = build_llm_context(subject_id)
    if not context:
        raise ValueError(f"Patient {subject_id} not found")

    analysis = build_performance_analysis(subject_id)
    sid, session = get_or_create_session(session_id, subject_id)
    register_session(sid, subject_id)

    if action == "reset":
        _sessions[sid] = _new_session(subject_id)
        session = _sessions[sid]
        register_session(sid, subject_id)
        sync_llm_session_state(sid, session)

    if action == "start" and session.get("complete"):
        sid = str(uuid.uuid4())
        _sessions[sid] = _new_session(subject_id)
        session = _sessions[sid]
        register_session(sid, subject_id)

    if session["complete"]:
        return {
            "session_id": sid,
            "emotional_support": "This check-in is complete. You can start a new conversation anytime.",
            "question": "",
            "spoken_text": "This check-in is complete. You can start a new conversation anytime.",
            "follow_up_index": session["follow_ups_asked"],
            "max_follow_ups": MAX_FOLLOW_UPS,
            "session_complete": True,
            "model": "session",
            "source": "local",
        }

    needs_greeting = (
        not session.get("greeting_done")
        and not user_message
        and (action == "start" or not session["history"])
    )

    if needs_greeting:
        greeting = _opening_greeting(patient_name)
        session["greeting_done"] = True
        session["history"].append({"role": "assistant", "content": greeting})
        append_transcript(sid, subject_id, "assistant", greeting, emotional_support=greeting, question="")
        sync_llm_session_state(sid, session)
        return {
            "session_id": sid,
            "emotional_support": greeting,
            "question": "",
            "spoken_text": greeting,
            "follow_up_index": session["follow_ups_asked"],
            "max_follow_ups": MAX_FOLLOW_UPS,
            "session_complete": False,
            "model": "local",
            "source": "greeting",
        }

    if user_message:
        _ensure_main_concern(session, user_message)
        session["history"].append({"role": "user", "content": user_message})
        append_transcript(sid, subject_id, "user", user_message)

        if _wants_early_wrap_up(user_message):
            preferred = _extract_requested_doctor(user_message, subject_id)
            if preferred:
                session["requested_doctor"] = preferred
            return await _finalize_session(
                sid,
                subject_id,
                session,
                preferred_doctor=preferred,
                source="early_wrap",
            )

    if session["follow_ups_asked"] >= MAX_FOLLOW_UPS and user_message:
        session["complete"] = True
        closing = SESSION_CLOSING
        session["history"].append({"role": "assistant", "content": closing})
        append_transcript(sid, subject_id, "assistant", closing)
        mark_session_complete(sid)
        sync_llm_session_state(sid, session)
        try:
            classified = await _maybe_classify_session(sid, subject_id)
        except Exception:
            classified = {
                "alerts_classified": False,
                "classified_alerts": [],
                "assigned_doctor": get_assigned_doctor(subject_id),
            }
        return {
            "session_id": sid,
            "emotional_support": closing,
            "question": "",
            "spoken_text": closing,
            "follow_up_index": MAX_FOLLOW_UPS,
            "max_follow_ups": MAX_FOLLOW_UPS,
            "session_complete": True,
            "model": "local",
            "source": "limit",
            **classified,
        }

    turn = await _llm_turn(
        session,
        user_message,
        context,
        analysis,
        patient_name,
        subject_id,
    )

    emotional, question = _trim_turn(
        str(turn["emotional_support"]),
        str(turn.get("question", "")),
    )
    is_reask = bool(turn.get("is_reask", False))
    complete = bool(turn.get("session_complete"))

    if user_message and _wants_early_wrap_up(user_message):
        complete = True
        question = ""

    if question and not complete:
        qlog = session.setdefault("questions_log", [])
        if is_reask:
            if qlog:
                question = question or qlog[-1]
        else:
            if question not in qlog:
                session["follow_ups_asked"] = session.get("follow_ups_asked", 0) + 1
                qlog.append(question)
            if session["follow_ups_asked"] >= MAX_FOLLOW_UPS:
                complete = True

    if complete or (not question and session["follow_ups_asked"] >= MAX_FOLLOW_UPS):
        complete = True
        question = ""
        emotional = SESSION_CLOSING

    spoken = _compose_spoken(emotional, question) if not complete else SESSION_CLOSING
    session["history"].append({"role": "assistant", "content": spoken})
    append_transcript(
        sid,
        subject_id,
        "assistant",
        spoken,
        emotional_support=emotional,
        question=question,
    )

    classified: dict[str, Any] = {}
    preferred_doctor = _extract_requested_doctor(user_message, subject_id) if user_message else None
    if complete:
        session["complete"] = True
        mark_session_complete(sid)
        try:
            classified = await _maybe_classify_session(
                sid, subject_id, preferred_doctor=preferred_doctor
            )
        except Exception:
            classified = {
                "alerts_classified": False,
                "classified_alerts": [],
                "assigned_doctor": get_assigned_doctor(subject_id),
            }

    sync_llm_session_state(sid, session)

    return {
        "session_id": sid,
        "emotional_support": emotional,
        "question": question,
        "spoken_text": spoken,
        "follow_up_index": session["follow_ups_asked"],
        "max_follow_ups": MAX_FOLLOW_UPS,
        "session_complete": complete,
        "is_reask": is_reask,
        "model": get_llm_model(),
        "source": get_llm_source() if llm_configured() else "fallback",
        **classified,
    }


async def _maybe_classify_session(
    session_id: str,
    subject_id: str,
    preferred_doctor: str | None = None,
) -> dict[str, Any]:
    from voice_chat_store import get_session_record, store_session_doctor_match

    record = get_session_record(session_id)
    if not record or record.get("classified"):
        matched = record.get("matched_doctor") if record else None
        return {
            "alerts_classified": bool(record and record.get("classified")),
            "classified_alerts": record.get("alerts_generated", []) if record else [],
            "assigned_doctor": matched or get_assigned_doctor(subject_id),
            "matched_doctor": matched,
            "doctor_match_reason": record.get("doctor_match_reason", "") if record else "",
            "alert_sent": bool(record and record.get("classified")),
            "transcript_entries": len(record.get("transcript", [])) if record else 0,
        }

    if record.get("user_turns", 0) < 1:
        return {
            "alerts_classified": False,
            "classified_alerts": [],
            "assigned_doctor": get_assigned_doctor(subject_id),
            "alert_sent": False,
            "transcript_entries": len(record.get("transcript", [])),
        }

    llm_state = record.get("llm_state") or {}
    main_concern = llm_state.get("main_concern", "")

    if preferred_doctor:
        team = get_patient_care_team(subject_id)
        doc = next((d for d in team if d["name"] == preferred_doctor), None)
        match = {
            "matched_doctor": preferred_doctor,
            "doctor_title": doc["title"] if doc else "Physician",
            "match_reason": "Patient asked to report directly to this doctor.",
        }
    else:
        match = await match_doctor_for_session(subject_id, record["transcript"], main_concern)

    doctor = match["matched_doctor"]
    store_session_doctor_match(session_id, match)

    alerts = await classify_session_alerts(subject_id, record["transcript"], doctor)
    for a in alerts:
        a["assigned_doctor"] = doctor
    store_classified_alerts(subject_id, session_id, alerts)

    return {
        "alerts_classified": True,
        "classified_alerts": alerts,
        "assigned_doctor": doctor,
        "matched_doctor": doctor,
        "doctor_title": match.get("doctor_title", ""),
        "doctor_match_reason": match.get("match_reason", ""),
        "alert_sent": True,
        "transcript_entries": len(record["transcript"]),
    }
