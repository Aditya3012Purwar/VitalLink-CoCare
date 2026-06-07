"""Mock Parkinson's disease medicine catalog for prescribing."""

PARKINSON_MEDICINES = [
    {
        "id": "med-levodopa",
        "name": "Levodopa/Carbidopa",
        "generic": "levodopa + carbidopa",
        "category": "dopaminergic",
        "default_dose": "100/25 mg",
        "default_frequency": "TID",
        "notes": "Take 30 min before meals; monitor off-periods",
    },
    {
        "id": "med-pramipexole",
        "name": "Pramipexole",
        "generic": "pramipexole",
        "category": "dopamine agonist",
        "default_dose": "0.5 mg",
        "default_frequency": "BID",
        "notes": "Titrate slowly; watch for impulse control issues",
    },
    {
        "id": "med-rasagiline",
        "name": "Rasagiline",
        "generic": "rasagiline",
        "category": "MAO-B inhibitor",
        "default_dose": "1 mg",
        "default_frequency": "OD",
        "notes": "Once daily morning; avoid tyramine-rich foods",
    },
    {
        "id": "med-ropinirole",
        "name": "Ropinirole",
        "generic": "ropinirole",
        "category": "dopamine agonist",
        "default_dose": "2 mg",
        "default_frequency": "TID",
        "notes": "Extended-release option for evening dosing",
    },
    {
        "id": "med-entacapone",
        "name": "Entacapone",
        "generic": "entacapone",
        "category": "COMT inhibitor",
        "default_dose": "200 mg",
        "default_frequency": "With each levodopa dose",
        "notes": "Adjunct to levodopa for wearing-off",
    },
    {
        "id": "med-amantadine",
        "name": "Amantadine",
        "generic": "amantadine",
        "category": "antidyskinetic",
        "default_dose": "100 mg",
        "default_frequency": "BID",
        "notes": "Useful for dyskinesia; avoid in renal impairment",
    },
    {
        "id": "med-trihexyphenidyl",
        "name": "Trihexyphenidyl",
        "generic": "trihexyphenidyl",
        "category": "anticholinergic",
        "default_dose": "2 mg",
        "default_frequency": "BID",
        "notes": "Younger patients; caution in elderly (cognition)",
    },
    {
        "id": "med-madopar",
        "name": "Madopar (Levodopa/Benserazide)",
        "generic": "levodopa + benserazide",
        "category": "dopaminergic",
        "default_dose": "100/25 mg",
        "default_frequency": "TID",
        "notes": "Alternative levodopa formulation",
    },
]


def list_medicines() -> list[dict]:
    return PARKINSON_MEDICINES
