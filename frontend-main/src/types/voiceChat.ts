export interface ClassifiedVoiceAlert {
  event: string;
  detail: string;
  reason: string;
  clinical_relevance: string;
  timestamp: string;
  source: string;
  red_flag: boolean;
  urgency?: string;
  assigned_doctor?: string;
  session_id?: string;
}

export interface VoiceChatTurn {
  subject_id: string;
  session_id: string;
  emotional_support: string;
  question: string;
  spoken_text: string;
  follow_up_index: number;
  max_follow_ups: number;
  session_complete: boolean;
  model: string;
  source: string;
  alerts_classified?: boolean;
  classified_alerts?: ClassifiedVoiceAlert[];
  assigned_doctor?: string;
  matched_doctor?: string;
  doctor_title?: string;
  doctor_match_reason?: string;
  alert_sent?: boolean;
  transcript_entries?: number;
}

export interface VoiceConfig {
  llm_configured: boolean;
  elevenlabs_configured: boolean;
  transcribe_configured?: boolean;
  transcribe_model?: string;
  max_follow_ups: number;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  emotional_support?: string;
  question?: string;
  text: string;
}

export interface StoredTranscriptEntry {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  emotional_support?: string;
  question?: string;
}

export interface VoiceChatSessionRestore {
  session_id: string | null;
  subject_id?: string;
  transcript: StoredTranscriptEntry[];
  follow_up_index: number;
  max_follow_ups?: number;
  session_complete: boolean;
  user_turns?: number;
  matched_doctor?: string | null;
  doctor_match_reason?: string;
  alert_sent?: boolean;
  classified_alerts?: ClassifiedVoiceAlert[];
}
