# VitalLink — Honest Data & Integration Disclosure

This document explains **what is real**, **what is open-source**, **what is simulated**, and **what we could not connect** in the VitalLink (Eurotech Hackathon) prototype.

VitalLink is a **research and demonstration platform**. It is **not** a certified medical device, **not** connected to production Hong Kong eHealth systems, and **not** intended for clinical diagnosis or treatment decisions.

---

## Summary

| Area | Status |
|------|--------|
| Parkinson smartwatch signals | **Real** — from PhysioNet PADS open dataset |
| Parkinson research methodology | **Grounded in peer-reviewed literature** |
| COPD / hospital EHR patterns | **Derived from open Kaggle-style US hospital data** (`archive/`) |
| Hong Kong eHealth API | **Not integrated** — regulatory and access restrictions |
| Demo patient identities, care plans, appointments | **Synthetic / demo** — for UX and workflow only |
| LLM / voice features | **Optional cloud APIs** — not part of clinical record systems |

---

## 1. Parkinson’s disease — real open data (PhysioNet)

### Source

We use the **PADS (Parkinson’s Disease Smartwatch) dataset v1.0.0** from PhysioNet:

- Dataset home: [https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/](https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/)
- Preprocessing scripts & file layout: [https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/scripts/#files-panel](https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/scripts/#files-panel)
- Local copy in this repo: `physionet.org/files/parkinsons-disease-smartwatch/1.0.0/`

### Research paper

Movement analysis, assessment steps, and ML context follow the published study:

- **Varghese, J., Brenner, A., Fujarski, M., van Alen, C.M., Plagwitz, L., & Warnecke, T. (2024).** *Machine Learning in the Parkinson’s disease smartwatch (PADS) dataset.* **npj Parkinson’s Disease**, 10, 9.  
  [https://www.nature.com/articles/s41531-023-00625-7](https://www.nature.com/articles/s41531-023-00625-7)

This article is also indexed in biomedical literature databases (including **PubMed**), and we used it to align our signal processing and interpretation with the authors’ methods (e.g. Apple Watch Series 4 sampling, assessment tasks, tremor frequency bands).

### What we actually process

The backend (`backend/pads_data.py`, `backend/signal_analysis.py`) loads **real accelerometer and gyroscope time series** from PADS movement files and computes:

- Tremor-related frequency content (PSD / Welch analysis)
- Task-specific severity scoring across neurological assessment steps
- Non-motor symptom (PDNMS) questionnaire domains where present in the dataset

Our demo cohort uses PADS subject IDs **004**, **006**, and **019** with **authentic movement recordings** from the dataset.

### What is still demo around Parkinson

- Display names (e.g. “Hans Keller”), Hong Kong–style care-team labels, and some timeline entries are **fabricated for storytelling**
- Doctor–patient assignments and shared care-plan authorship are **workflow demos**, not hospital exports
- AI-generated explanations (OpenAI / OpenRouter) are **decision-support text only**, not validated clinical outputs

---

## 2. COPD — analysis from open US hospital data (Kaggle / `archive/`)

### Source

COPD comorbidity patterns, vitals concepts (SpO₂, respiratory rate, sleep disruption), and population-level chronic-disease structure were informed by an **open-source synthetic US hospital dataset** stored in:

```
archive/
├── patients.csv      # ~100k synthetic patients, comorbidity flags (incl. dx_copd)
├── diagnoses.csv     # ICD-10-coded visit diagnoses
├── medications.csv
├── lab_results.csv
└── outcomes.csv      # admissions, readmissions, charges (US hospital style)
```

This data reflects **American hospital / insurance conventions** (e.g. Medicare, Medicaid, DRG codes, USD charges) — **not** Hong Kong Hospital Authority or eHealth record formats.

We obtained and used this material from **public Kaggle open-data releases** of synthetic EHR/hospital patient records (commonly used for ML and epidemiology exercises). It allowed us to:

- Study **COPD prevalence and comorbidity clustering** alongside other chronic conditions
- Model **exacerbation-risk style signals** (low SpO₂ trends, rescue inhaler patterns, sleep fragmentation)
- Design the **comorbid Parkinson + COPD** storyline for demo patient **004**

### What is simulated in the app

The live COPD panels (`backend/copd_data.py`, caretaker alerts) expose **mock time-series vitals** and e-health sync labels for demo purposes. They are **statistically plausible** and informed by our `archive/` analysis, but they are **not live feeds** from any real patient or hospital.

---

## 3. PubMed & open literature

We did **not** scrape or bulk-import PubMed patient records (PubMed is a **literature** database, not an EHR source).

We **did** use open scientific literature — including the PADS paper above and standard Parkinson’s / COPD clinical knowledge — to:

- Choose relevant biomarkers and monitoring concepts
- Frame non-motor symptom domains and comorbidity risk
- Write clinically plausible alert copy for doctors and caretakers

---

## 4. Hong Kong eHealth — not integrated (by design / restriction)

We **did not** connect to:

- Hong Kong **eHealth Record (eHRSS)** production APIs
- Hospital Authority live patient portals
- Any government-issued OAuth / FHIR endpoints for real citizens

**Reasons:**

1. **Access restrictions** — eHealth integration requires authorised data-sharing agreements, patient consent workflows, and approved system accounts not available in a hackathon timeframe.
2. **Legal & privacy** — handling real HK patient data would require compliance with the *Personal Data (Privacy) Ordinance (PDPO)*, eHR governance rules, and institutional ethics approval.
3. **Prototype scope** — VitalLink demonstrates **workflow and analytics UX**, not a deployed integration.

In the UI you may see labels like “eHealth synced” or “PADS synced”. These indicate **demo sync state** for storytelling unless explicitly tied to PhysioNet PADS files (which are real for movement data only).

---

## 5. Other components (transparent)

| Component | Nature |
|-----------|--------|
| Authentication & demo logins | Local mock users (`pads2024`) |
| Prescriptions & QR chemist flow | Demo JSON store |
| Health Talk voice chat | OpenAI Whisper + LLM + optional ElevenLabs TTS |
| Caretaker emergency ringtone | Client-side demo alerts from rule-based risk flags |
| ngrok / local hosting | Development tunneling only |

---

## 6. How to cite our data sources

If you reuse or reference this project, please cite the underlying datasets and paper:

**PhysioNet PADS**

```bibtex
@article{PhysioNet-parkinsons-disease-smartwatch-1.0.0,
  author  = {Varghese, Julian and Brenner, Alexander and Plagwitz, Lucas and {van Alen}, Catharina and Fujarski, Michael and Warnecke, Tobias},
  title   = {{PADS - Parkinsons Disease Smartwatch dataset}},
  journal = {{PhysioNet}},
  year    = {2024},
  doi     = {10.13026/m0w9-zx22}
}
```

**PADS research article**

```bibtex
@article{varghese2024machine,
  title   = {Machine Learning in the Parkinson's disease smartwatch (PADS) dataset},
  author  = {Varghese, Julian and Brenner, Alexander and Fujarski, Michael and van Alen, Catharina Marie and Plagwitz, Lucas and Warnecke, Tobias},
  journal = {npj Parkinson's Disease},
  volume  = {10},
  number  = {1},
  pages   = {9},
  year    = {2024},
  publisher = {Nature Publishing Group}
}
```

---

## 7. Bottom line

**VitalLink is honest about its foundations:**

- **Parkinson movement analytics** → real PhysioNet PADS open data, interpreted via published research ([Nature npj paper](https://www.nature.com/articles/s41531-023-00625-7), [PhysioNet scripts](https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/scripts/#files-panel)).
- **COPD & hospital comorbidity thinking** → informed by open **Kaggle / `archive/`** US synthetic hospital datasets, with **mock vitals** in the UI.
- **Hong Kong eHealth** → **not connected**; labels and sync badges are demonstrative except where PADS files are genuinely loaded.
- **The product value shown is integration UX and multi-role care workflow**, not a live production deployment on HK clinical infrastructure.

For questions about data provenance in this repository, contact the VitalLink team or inspect:

- `physionet.org/files/parkinsons-disease-smartwatch/1.0.0/` — Parkinson signals  
- `archive/` — COPD / US hospital synthetic EHR analysis inputs  
- `backend/pads_data.py`, `backend/copd_data.py` — how each stream is wired in code  

---

*Last updated: June 2026 — VitalLink / Eurotech Hackathon prototype*
