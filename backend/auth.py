"""Demo login for doctors, patients, and chemists."""

from __future__ import annotations

DEMO_USERS = [
    {
        "id": "doc-mueller",
        "email": "doctor.mueller",
        "password": "pads2024",
        "role": "doctor",
        "name": "Dr. Sarah Müller",
        "title": "Movement Disorders Neurologist",
    },
    {
        "id": "doc-chen",
        "email": "doctor.chen",
        "password": "pads2024",
        "role": "doctor",
        "name": "Dr. James Chen",
        "title": "Movement Disorders Neurologist",
    },
    {
        "id": "car-anna",
        "email": "anna.weber",
        "password": "pads2024",
        "role": "caretaker",
        "name": "Anna Weber (daughter)",
        "title": "Family Caretaker",
    },
    {
        "id": "car-thomas",
        "email": "thomas.klein",
        "password": "pads2024",
        "role": "caretaker",
        "name": "Thomas Klein (son)",
        "title": "Family Caretaker",
    },
    {
        "id": "car-maria",
        "email": "maria.lopez",
        "password": "pads2024",
        "role": "caretaker",
        "name": "Maria Lopez (spouse)",
        "title": "Family Caretaker",
    },
    {
        "id": "car-peter",
        "email": "peter.hoffmann",
        "password": "pads2024",
        "role": "caretaker",
        "name": "Peter Hoffmann (brother)",
        "title": "Family Caretaker",
    },
    {
        "id": "car-elena",
        "email": "elena.schmidt",
        "password": "pads2024",
        "role": "caretaker",
        "name": "Elena Schmidt (daughter)",
        "title": "Family Caretaker",
    },
    {
        "id": "pat-004",
        "email": "patient.004",
        "password": "pads2024",
        "role": "patient",
        "name": "PD Patient 004",
        "title": "Parkinson's Patient",
        "pads_id": "004",
    },
    {
        "id": "chem-lam",
        "email": "chemist.lam",
        "password": "pads2024",
        "role": "chemist",
        "name": "Mr. Lam",
        "title": "Community Chemist",
    },
]


def authenticate(email: str, password: str, role: str | None = None) -> dict:
    """Open demo login — any email/password works."""
    email = email.strip().lower() or "guest"

    for user in DEMO_USERS:
        if user["email"] == email:
            return {k: v for k, v in user.items() if k != "password"}

    if role == "patient" or email.startswith("patient") or email.startswith("pat."):
        pads_id = "004"
        for suffix in ("004", "006", "019"):
            if suffix in email:
                pads_id = suffix
                break
        return {
            "id": f"guest-patient-{pads_id}",
            "email": email,
            "role": "patient",
            "name": f"PD Patient {pads_id}",
            "title": "Parkinson's Patient",
            "pads_id": pads_id,
        }

    if role == "chemist" or "chemist" in email or "pharmac" in email:
        return {
            "id": "guest-chemist",
            "email": email,
            "role": "chemist",
            "name": "Mr. Lam",
            "title": "Community Chemist",
        }

    is_caretaker = (
        role == "caretaker"
        or "caretaker" in email
        or email.startswith("car.")
        or email.startswith("anna")
        or email.startswith("maria")
        or email.startswith("thomas")
    )
    if is_caretaker:
        return {
            "id": "guest-caretaker",
            "email": email,
            "role": "caretaker",
            "name": "Anna Weber (daughter)",
            "title": "Family Caretaker",
        }
    return {
        "id": "guest-doctor",
        "email": email,
        "role": "doctor",
        "name": "Dr. Sarah Müller",
        "title": "Movement Disorders Neurologist",
    }


def get_user_by_id(user_id: str) -> dict | None:
    for user in DEMO_USERS:
        if user["id"] == user_id:
            return {k: v for k, v in user.items() if k != "password"}
    return None
