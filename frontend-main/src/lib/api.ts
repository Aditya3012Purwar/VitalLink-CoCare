import type { LoginResponse } from "@/types/auth";
import type { MedicineCatalogItem, Prescription } from "@/types/prescription";
import type {
  AssessmentStep,
  LlmExplanation,
  MovementData,
  PadsPatientDetail,
  PadsPatientSummary,
  PerformanceAnalysis,
} from "@/types/parkinson";
import type { CaretakerEmergencyResponse } from "@/types/caretakerAlert";
import type { CopdVitals } from "@/types/copd";
import type { VoiceChatSessionRestore, VoiceChatTurn, VoiceConfig } from "@/types/voiceChat";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string,
  role?: "doctor" | "patient" | "caretaker" | "chemist"
): Promise<LoginResponse> {
  return fetchJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
}

export async function getPerformanceAnalysis(id: string): Promise<PerformanceAnalysis> {
  return fetchJson<PerformanceAnalysis>(`/api/patients/${id}/analysis`);
}

export async function getCopdVitals(id: string): Promise<CopdVitals> {
  return fetchJson<CopdVitals>(`/api/patients/${id}/copd-vitals`);
}

export async function getCaretakerEmergencyAlerts(id: string): Promise<CaretakerEmergencyResponse> {
  return fetchJson<CaretakerEmergencyResponse>(`/api/patients/${id}/caretaker-emergency-alerts`);
}

export interface ChartSummaries {
  summaries: {
    acceleration: string;
    psd: string;
    heatmap: string;
    nms_domains: string;
    overall: string;
  };
}

export async function getChartSummaries(
  id: string,
  task: string,
  wrist: string
): Promise<ChartSummaries> {
  return fetchJson<ChartSummaries>(
    `/api/patients/${id}/chart-summaries?task=${encodeURIComponent(task)}&wrist=${wrist}`
  );
}

export async function sendChatMessage(
  id: string,
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ reply: string; model: string; source: string }> {
  return fetchJson(`/api/patients/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
}

export async function getPadsPatients(): Promise<PadsPatientSummary[]> {
  const data = await fetchJson<{ patients: PadsPatientSummary[] }>("/api/patients");
  return data.patients;
}

export async function getPadsPatientDetail(id: string): Promise<PadsPatientDetail> {
  return fetchJson<PadsPatientDetail>(`/api/patients/${id}`);
}

export async function getMovementData(
  id: string,
  task: string,
  wrist: "Left" | "Right" = "Left"
): Promise<MovementData> {
  return fetchJson<MovementData>(
    `/api/patients/${id}/movement?task=${encodeURIComponent(task)}&wrist=${wrist}`
  );
}

export async function getAssessmentSteps(): Promise<AssessmentStep[]> {
  const data = await fetchJson<{ steps: AssessmentStep[] }>("/api/assessment-steps");
  return data.steps;
}

export async function getLlmExplanation(
  id: string,
  audience: "doctor" | "caretaker" | "patient" = "doctor"
): Promise<LlmExplanation> {
  return fetchJson<LlmExplanation>(`/api/patients/${id}/explain?audience=${audience}`, {
    method: "POST",
  });
}

export async function getMedicineCatalog(): Promise<MedicineCatalogItem[]> {
  const data = await fetchJson<{ medicines: MedicineCatalogItem[] }>("/api/medicines");
  return data.medicines;
}

export async function createPrescription(
  subjectId: string,
  doctorName: string,
  items: Array<{
    medicine_id: string;
    dose: string;
    frequency: string;
    duration_days: number;
    instructions: string;
  }>,
  notes: string
): Promise<Prescription> {
  return fetchJson<Prescription>(`/api/patients/${subjectId}/prescriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doctor_name: doctorName, items, notes }),
  });
}

export async function getLatestPrescription(subjectId: string): Promise<Prescription | null> {
  const data = await fetchJson<{ prescription: Prescription | null }>(
    `/api/patients/${subjectId}/prescriptions/latest`
  );
  return data.prescription;
}

export async function getPrescriptionByToken(token: string): Promise<Prescription> {
  return fetchJson<Prescription>(`/api/prescriptions/${token}`);
}

export async function getVoiceConfig(): Promise<VoiceConfig> {
  return fetchJson<VoiceConfig>("/api/voice/config");
}

export async function getVoiceChatSession(
  subjectId: string,
  sessionId?: string | null
): Promise<VoiceChatSessionRestore> {
  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return fetchJson<VoiceChatSessionRestore>(`/api/patients/${subjectId}/voice-chat/session${query}`);
}

export async function sendVoiceChatTurn(
  subjectId: string,
  payload: {
    message?: string;
    session_id?: string | null;
    patient_name?: string;
    action?: "message" | "start" | "reset";
  }
): Promise<VoiceChatTurn> {
  return fetchJson<VoiceChatTurn>(`/api/patients/${subjectId}/voice-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function transcribeVoiceAudio(
  audio: Blob,
  locale: "en" | "zh" = "en"
): Promise<{ text: string; model: string; source: string }> {
  const form = new FormData();
  const ext = audio.type.includes("mp4") ? "m4a" : "webm";
  form.append("audio", audio, `speech.${ext}`);
  form.append("language", locale === "zh" ? "zh" : "en");
  const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Transcription error ${res.status}`);
  }
  return res.json();
}

export async function synthesizeVoice(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `TTS error ${res.status}`);
  }
  return res.blob();
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await fetchJson("/api/health");
    return true;
  } catch {
    return false;
  }
}
