# Cardio-Lung CoCare Navigator

Care-coordination MVP for Hong Kong patients at the overlap of smoking history, COPD, hypertension, diabetes, heart disease, and recurrent hospital use.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Demo flow

1. Review the landing hero — note the four role perspectives
2. Click **Open demo patient** to enter the coordination workspace
3. Use the tab bar: **Care network** (shared context) · **Patient** · **Doctor** · **Nurse** · **Pharmacist**
4. Switch between 3 demo patients via the sidebar
5. Toggle **EN / 中** and dark mode from the header
6. Use **Share care plan** to preview a printable summary

## Role views

| Tab | Focus |
|-----|--------|
| **Care network** | Shared alerts, timeline, referral flow, ownership, and HK care-network explanation (shown once, not repeated per role) |
| **Patient** | Today's checklist, simple condition explainers, medicines, red flags, care team |
| **Doctor** | Clinical summary, problem cards, overdue actions, referrals, shared care plan |
| **Nurse** | Follow-up queue, self-management status, barriers, coaching, outreach notes |
| **Pharmacist** | Med reconciliation, risk flags, adherence, counseling tasks, interventions |

## Stack

React · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts

## Note

MVP demo inspired by Hong Kong primary healthcare reform — not an official government system. AI summary is coordination support only, not for diagnosis.
