# PADS Parkinson Care Platform

Doctor–patient–caretaker monitoring dashboard built on the **PhysioNet PADS** (Parkinson's Disease Smartwatch) dataset, with AI-powered clinical explanations via **OpenRouter**.

## Data source

- [PhysioNet PADS v1.0.0](https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/)
- Research paper: [Varghese et al., npj Parkinson's Disease (2024)](https://www.nature.com/articles/s41531-023-00625-7)

## Features

- **Doctor dashboard**: Tremor heatmaps, acceleration signals, PSD analysis, NMS questionnaire domains
- **Patient / caretaker views**: Simplified smartwatch insights and AI guidance
- **Doctor–patient linking**: Neurologist and caretaker assignments per PADS subject
- **LLM explanations**: OpenRouter `openai/gpt-oss-120b:free` (with rule-based fallback)

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Optional: enable LLM
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend-main
npm install
npm run dev
```

Open http://localhost:5173 → pick **Doctor** or **Caretaker** → click **Sign in** (any email/password works in demo mode).

**Doctor view** includes disease performance summary, what happened & why, smartwatch charts, and auto AI analysis.

### API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/patients` | List demo PADS patients |
| `GET /api/patients/{id}` | Patient detail + task summaries |
| `GET /api/patients/{id}/movement?task=Relaxed&wrist=Left` | Smartwatch signal data |
| `POST /api/patients/{id}/explain?audience=doctor` | AI clinical explanation |

## Demo patients (Parkinson's only)

| ID | Condition | Neurologist |
|----|-----------|-------------|
| 004 | Parkinson's | Dr. Sarah Müller |
| 006 | Parkinson's | Dr. Sarah Müller |
| 019 | Parkinson's | Dr. James Chen |
| 022 | Parkinson's | Dr. James Chen |
| 038 | Parkinson's | Dr. James Chen |
