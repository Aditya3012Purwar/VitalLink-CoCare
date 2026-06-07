import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, Loader2, MessageCircle, Mic, MicOff, RotateCcw, Send } from "lucide-react";
import {
  getVoiceChatSession,
  getVoiceConfig,
  sendVoiceChatTurn,
  synthesizeVoice,
  transcribeVoiceAudio,
} from "@/lib/api";
import type { Locale } from "@/types/patient";
import type {
  ClassifiedVoiceAlert,
  StoredTranscriptEntry,
  TranscriptEntry,
  VoiceConfig,
} from "@/types/voiceChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { VoiceChatSphere } from "@/components/patient/VoiceChatSphere";
import "./PatientVoiceChat.css";

type SceneState = "" | "listening" | "speaking" | "thinking";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Pause after speech ends before sending (OpenAI Whisper STT). */
const SILENCE_BEFORE_SUBMIT_MS = 1400;
const SPEECH_LEVEL_THRESHOLD = 0.018;
const MIN_RECORDING_MS = 450;

interface Props {
  padsId: string;
  patientName: string;
  locale: Locale;
  compact?: boolean;
  layout?: "default" | "compact" | "health";
}

function sessionStorageKey(padsId: string) {
  return `pvc-session-${padsId}`;
}

function transcriptStorageKey(padsId: string) {
  return `pvc-transcript-${padsId}`;
}

function mapStoredTranscript(entries: StoredTranscriptEntry[]): TranscriptEntry[] {
  return entries.map((e) => {
    if (e.role === "user") {
      return { role: "user", text: e.content };
    }
    return {
      role: "assistant",
      text: e.content,
      emotional_support: e.emotional_support ?? "",
      question: e.question ?? "",
    };
  });
}

function saveTranscriptCache(padsId: string, entries: TranscriptEntry[]) {
  try {
    sessionStorage.setItem(transcriptStorageKey(padsId), JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function PatientVoiceChat({ padsId, patientName, locale, compact = false, layout }: Props) {
  const isHealth = layout === "health" || (!layout && !compact);
  const isCompact = layout === "compact" || (compact && layout !== "health");
  const zh = locale === "zh";
  const storageKey = sessionStorageKey(padsId);
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [maxFollowUps, setMaxFollowUps] = useState(5);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [convoMode, setConvoMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [sceneState, setSceneState] = useState<SceneState>("");
  const [statusLabel, setStatusLabel] = useState("IDLE");
  const [liveText, setLiveText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [alertsClassified, setAlertsClassified] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState<string | null>(null);
  const [matchedDoctor, setMatchedDoctor] = useState<string | null>(null);
  const [doctorMatchReason, setDoctorMatchReason] = useState<string | null>(null);
  const [classifiedAlerts, setClassifiedAlerts] = useState<ClassifiedVoiceAlert[]>([]);

  const TTS_PLAYBACK_RATE = 1.22;

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pendingTranscriptRef = useRef("");
  const finalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micCancelledRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);
  const playbackEpochRef = useRef(0);
  const pendingResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const convoModeRef = useRef(convoMode);
  const isBusyRef = useRef(isBusy);
  const isListeningRef = useRef(isListening);
  const processTurnRef = useRef<
    (message?: string, action?: "message" | "start" | "reset") => Promise<boolean>
  >(async () => false);
  const stopListeningRef = useRef<() => void>(() => {});
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordMimeRef = useRef("audio/webm");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const hadSpeechRef = useRef(false);
  const silenceStartedAtRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef(0);
  const useOpenAiSttRef = useRef(true);

  useEffect(() => {
    convoModeRef.current = convoMode;
    isBusyRef.current = isBusy;
    isListeningRef.current = isListening;
  }, [convoMode, isBusy, isListening]);

  useEffect(() => {
    getVoiceConfig()
      .then(setConfig)
      .catch(() => setConfig({ llm_configured: false, elevenlabs_configured: false, max_follow_ups: 5 }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const savedId = sessionStorage.getItem(storageKey);
        const restored = await getVoiceChatSession(padsId, savedId);
        if (cancelled) return;

        if (restored.session_id) {
          sessionIdRef.current = restored.session_id;
          setSessionId(restored.session_id);
          sessionStorage.setItem(storageKey, restored.session_id);
        }

        if (restored.transcript.length > 0) {
          const mapped = mapStoredTranscript(restored.transcript);
          setTranscript(mapped);
          saveTranscriptCache(padsId, mapped);
          const lastAssistant = [...mapped].reverse().find((e) => e.role === "assistant");
          if (lastAssistant?.text) setLiveText(lastAssistant.text);
        } else {
          const cached = sessionStorage.getItem(transcriptStorageKey(padsId));
          if (cached) setTranscript(JSON.parse(cached) as TranscriptEntry[]);
        }

        setFollowUpIndex(restored.follow_up_index ?? 0);
        setMaxFollowUps(restored.max_follow_ups ?? 5);
        setSessionComplete(!!restored.session_complete);
        if (restored.matched_doctor) {
          setMatchedDoctor(restored.matched_doctor);
          setAssignedDoctor(restored.matched_doctor);
          setDoctorMatchReason(restored.doctor_match_reason ?? null);
          setAlertSent(!!restored.alert_sent);
          setAlertsClassified(!!restored.alert_sent);
          if (restored.classified_alerts?.length) {
            setClassifiedAlerts(restored.classified_alerts);
          }
        }
      } catch {
        try {
          const savedId = sessionStorage.getItem(storageKey);
          if (savedId) {
            sessionIdRef.current = savedId;
            setSessionId(savedId);
          }
          const cached = sessionStorage.getItem(transcriptStorageKey(padsId));
          if (cached && !cancelled) setTranscript(JSON.parse(cached) as TranscriptEntry[]);
        } catch {
          /* ignore */
        }
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [padsId, storageKey]);

  const clearSpeechFinalize = useCallback(() => {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
  }, []);

  const submitPendingSpeech = useCallback(() => {
    clearSpeechFinalize();
    const text = pendingTranscriptRef.current.trim();
    pendingTranscriptRef.current = "";
    if (!text || micCancelledRef.current || isBusyRef.current) return;
    stopListeningRef.current();
    void processTurnRef.current(text);
  }, [clearSpeechFinalize]);

  const scheduleSpeechFinalize = useCallback(() => {
    clearSpeechFinalize();
    finalizeTimerRef.current = setTimeout(() => {
      finalizeTimerRef.current = null;
      if (!isListeningRef.current || isBusyRef.current || micCancelledRef.current) return;
      submitPendingSpeech();
    }, SILENCE_BEFORE_SUBMIT_MS);
  }, [clearSpeechFinalize, submitPendingSpeech]);

  const scheduleSpeechFinalizeRef = useRef(scheduleSpeechFinalize);
  scheduleSpeechFinalizeRef.current = scheduleSpeechFinalize;

  const stopAllAudio = useCallback(() => {
    playbackEpochRef.current += 1;

    if (pendingResumeTimerRef.current) {
      clearTimeout(pendingResumeTimerRef.current);
      pendingResumeTimerRef.current = null;
    }

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.src = "";
        currentAudioRef.current.load();
      } catch {
        /* ignore */
      }
      currentAudioRef.current = null;
    }

    if (ttsObjectUrlRef.current) {
      URL.revokeObjectURL(ttsObjectUrlRef.current);
      ttsObjectUrlRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const releaseMediaResources = useCallback(() => {
    if (vadFrameRef.current !== null) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const forceStop = useCallback(() => {
    micCancelledRef.current = true;
    stopAllAudio();
    clearSpeechFinalize();
    pendingTranscriptRef.current = "";
    releaseMediaResources();
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    setIsBusy(false);
    isBusyRef.current = false;
    setIsListening(false);
    isListeningRef.current = false;
    setSceneState("");
    setStatusLabel("IDLE");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  }, [clearSpeechFinalize, releaseMediaResources, stopAllAudio]);

  const speakBrowser = useCallback((text: string, epoch: number) => {
    return new Promise<void>((resolve) => {
      const stale = () => epoch !== playbackEpochRef.current || !convoModeRef.current;

      if (!window.speechSynthesis || stale()) {
        setSceneState("");
        resolve();
        return;
      }
      setSceneState("speaking");
      const utter = new SpeechSynthesisUtterance(text.slice(0, 500));
      utter.rate = 1.2;
      utter.onend = () => {
        if (!stale()) setSceneState("");
        resolve();
      };
      utter.onerror = () => {
        if (!stale()) setSceneState("");
        resolve();
      };
      window.speechSynthesis.speak(utter);
    });
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      const safe = (text ?? "").trim();
      if (!safe || !convoModeRef.current) return;

      stopAllAudio();
      const epoch = playbackEpochRef.current;
      const stale = () => epoch !== playbackEpochRef.current || !convoModeRef.current;

      const ttsText = safe.length > 2500 ? `${safe.slice(0, 2500)}...` : safe;
      if (!config?.elevenlabs_configured) {
        return speakBrowser(ttsText, epoch);
      }

      setSceneState("speaking");
      try {
        const blob = await synthesizeVoice(ttsText);
        if (stale()) return;

        const url = URL.createObjectURL(blob);
        ttsObjectUrlRef.current = url;
        await new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audio.playbackRate = TTS_PLAYBACK_RATE;
          currentAudioRef.current = audio;
          const finish = () => {
            if (currentAudioRef.current === audio) currentAudioRef.current = null;
            if (ttsObjectUrlRef.current === url) {
              URL.revokeObjectURL(url);
              ttsObjectUrlRef.current = null;
            }
            if (!stale()) setSceneState("");
            resolve();
          };
          audio.onended = finish;
          audio.onerror = finish;
          if (stale()) {
            finish();
            return;
          }
          audio.play().catch(finish);
        });
      } catch {
        if (!stale()) return speakBrowser(ttsText, epoch);
      }
    },
    [config?.elevenlabs_configured, speakBrowser, stopAllAudio]
  );

  const startListeningRef = useRef<() => void>(() => {});

  const handleRecordingStopped = useCallback(async () => {
    if (micCancelledRef.current || !convoModeRef.current) {
      releaseMediaResources();
      return;
    }

    const chunks = [...audioChunksRef.current];
    audioChunksRef.current = [];
    const mime = recordMimeRef.current;
    releaseMediaResources();

    const blob = new Blob(chunks, { type: mime });
    if (blob.size < 800) {
      if (convoModeRef.current && !isBusyRef.current && !micCancelledRef.current) {
        setTimeout(() => startListeningRef.current(), 300);
      }
      return;
    }

    setSceneState("listening");
    setStatusLabel(zh ? "Whisper 辨識中…" : "WHISPER · transcribing…");
    setLiveText(zh ? "正在轉換您的語音…" : "Converting your speech…");

    try {
      const { text } = await transcribeVoiceAudio(blob, locale);
      const trimmed = text.trim();
      if (!trimmed || micCancelledRef.current || isBusyRef.current || !convoModeRef.current) return;
      setLiveText(`"${trimmed}"`);
      void processTurnRef.current(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh ? "Whisper 語音辨識失敗" : "Whisper transcription failed");
      setSceneState("");
      setStatusLabel("IDLE");
      if (convoModeRef.current && !isBusyRef.current) {
        setTimeout(() => startListeningRef.current(), 500);
      }
    }
  }, [locale, releaseMediaResources, zh]);

  const handleRecordingStoppedRef = useRef(handleRecordingStopped);
  handleRecordingStoppedRef.current = handleRecordingStopped;

  const startWhisperListening = useCallback(async () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";
      recordMimeRef.current = mimeType;

      const audioContext = new AudioContext();
      await audioContext.resume();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      audioChunksRef.current = [];
      hadSpeechRef.current = false;
      silenceStartedAtRef.current = null;
      recordingStartedAtRef.current = Date.now();

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        void handleRecordingStoppedRef.current();
      };
      recorder.start(200);

      micCancelledRef.current = false;
      useOpenAiSttRef.current = true;
      setIsListening(true);
      isListeningRef.current = true;
      setSceneState("listening");
      setStatusLabel(zh ? "聆聽中 · Whisper" : "LISTENING · Whisper");
      setLiveText(zh ? "請說話，短暫停頓約 1 秒後送出…" : "Speak — a brief pause sends your message.");

      const runVad = () => {
        if (!isListeningRef.current || !analyserRef.current) return;

        const data = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const sample = (data[i] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / data.length);

        if (rms >= SPEECH_LEVEL_THRESHOLD) {
          hadSpeechRef.current = true;
          silenceStartedAtRef.current = null;
        } else if (hadSpeechRef.current && silenceStartedAtRef.current === null) {
          silenceStartedAtRef.current = Date.now();
        } else if (
          hadSpeechRef.current
          && silenceStartedAtRef.current !== null
          && Date.now() - silenceStartedAtRef.current >= SILENCE_BEFORE_SUBMIT_MS
          && Date.now() - recordingStartedAtRef.current >= MIN_RECORDING_MS
        ) {
          isListeningRef.current = false;
          setIsListening(false);
          if (vadFrameRef.current !== null) {
            cancelAnimationFrame(vadFrameRef.current);
            vadFrameRef.current = null;
          }
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          return;
        }

        vadFrameRef.current = requestAnimationFrame(runVad);
      };

      vadFrameRef.current = requestAnimationFrame(runVad);
    } catch {
      setError(zh ? "無法使用麥克風，請允許麥克風權限。" : "Microphone access denied — allow mic permission.");
    }
  }, [zh]);

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.continuous = false;
    r.interimResults = true;

    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const chunk = last?.[0]?.transcript?.trim() ?? "";
      if (!chunk) return;

      if (last.isFinal) {
        pendingTranscriptRef.current = chunk;
      }

      setLiveText(chunk || (zh ? "請慢慢說…" : "Take your time…"));
      if (chunk) {
        setStatusLabel(zh ? "聆聽中 · 說完請稍停" : "LISTENING · pause when done");
        if (last.isFinal) scheduleSpeechFinalizeRef.current();
      }
    };

    r.onerror = (e) => {
      if (e.error === "no-speech") {
        if (convoModeRef.current && !isBusyRef.current) {
          try {
            r.start();
          } catch {
            /* ignore */
          }
        } else {
          stopListeningRef.current();
        }
      } else if (e.error !== "aborted" && convoModeRef.current && !isBusyRef.current) {
        setTimeout(() => {
          try {
            r.start();
          } catch {
            /* ignore */
          }
        }, 500);
      }
    };

    r.onend = () => {
      if (pendingTranscriptRef.current.trim() && isListeningRef.current && !isBusyRef.current) {
        scheduleSpeechFinalizeRef.current();
      }
      if (isListeningRef.current && !isBusyRef.current) {
        setTimeout(() => {
          if (!isListeningRef.current || isBusyRef.current) return;
          try {
            r.start();
          } catch {
            /* ignore */
          }
        }, 350);
      }
    };

    recognitionRef.current = r;
    return r;
  }, [zh]);

  const startListening = useCallback(() => {
    if (config?.transcribe_configured) {
      void startWhisperListening();
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (!ensureRecognition()) {
      setError(zh ? "此瀏覽器不支援語音辨識，請使用 Chrome。" : "Speech recognition is not supported. Try Chrome.");
      return;
    }
    useOpenAiSttRef.current = false;
    micCancelledRef.current = false;
    pendingTranscriptRef.current = "";
    clearSpeechFinalize();
    setIsListening(true);
    isListeningRef.current = true;
    setSceneState("listening");
    setStatusLabel(zh ? "聆聽中 · 慢慢說" : "LISTENING · take your time");
    setLiveText(
      zh
        ? "請慢慢說完整句，說完後稍停…"
        : "Speak at your own pace — pause briefly when you're done."
    );
    try {
      recognitionRef.current?.start();
    } catch {
      /* ignore */
    }
  }, [clearSpeechFinalize, config?.transcribe_configured, ensureRecognition, startWhisperListening, zh]);

  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    clearSpeechFinalize();
    pendingTranscriptRef.current = "";
    setIsListening(false);
    isListeningRef.current = false;

    if (useOpenAiSttRef.current) {
      if (vadFrameRef.current !== null) {
        cancelAnimationFrame(vadFrameRef.current);
        vadFrameRef.current = null;
      }
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          releaseMediaResources();
        }
      } else {
        releaseMediaResources();
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    if (!isBusyRef.current) {
      setSceneState("");
      setStatusLabel("IDLE");
    }
  }, [clearSpeechFinalize, releaseMediaResources]);

  stopListeningRef.current = stopListening;

  const processTurn = useCallback(
    async (message?: string, action: "message" | "start" | "reset" = "message"): Promise<boolean> => {
      if (isBusyRef.current && action === "message") return false;
      if (isListeningRef.current) {
        micCancelledRef.current = true;
        stopListening();
      }
      setIsBusy(true);
      isBusyRef.current = true;
      setError(null);

      if (message) {
        setTranscript((prev) => {
          const next = [...prev, { role: "user" as const, text: message }];
          saveTranscriptCache(padsId, next);
          return next;
        });
        setLiveText(`"${message}"`);
      }

      setSceneState("thinking");
      const t0 = Date.now();
      thinkingTimerRef.current = setInterval(() => {
        const sec = Math.round((Date.now() - t0) / 1000);
        setStatusLabel(`${zh ? "思考中" : "THINKING"} · ${sec}s`);
      }, 500);

      let resumeListening = false;
      try {
        const turn = await sendVoiceChatTurn(padsId, {
          message,
          session_id: sessionIdRef.current,
          patient_name: patientName,
          action,
        });

        if (thinkingTimerRef.current) {
          clearInterval(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }

        if (!convoModeRef.current && action !== "start") {
          return false;
        }

        sessionIdRef.current = turn.session_id;
        setSessionId(turn.session_id);
        try {
          sessionStorage.setItem(storageKey, turn.session_id);
        } catch {
          /* ignore */
        }
        setFollowUpIndex(turn.follow_up_index ?? 0);
        setMaxFollowUps(turn.max_follow_ups ?? 5);
        setSessionComplete(!!turn.session_complete);

        const spoken =
          turn.spoken_text
          || [turn.emotional_support, turn.question].filter(Boolean).join(" ")
          || "";

        if (turn.alert_sent || turn.alerts_classified) {
          setAlertsClassified(true);
          setAlertSent(!!turn.alert_sent);
          const doctor = turn.matched_doctor ?? turn.assigned_doctor ?? null;
          setMatchedDoctor(doctor);
          setAssignedDoctor(doctor);
          setDoctorMatchReason(turn.doctor_match_reason ?? null);
          setClassifiedAlerts(Array.isArray(turn.classified_alerts) ? turn.classified_alerts : []);
        }

        setTranscript((prev) => {
          const next = [
            ...prev,
            {
              role: "assistant" as const,
              emotional_support: turn.emotional_support ?? "",
              question: turn.question ?? "",
              text: spoken,
            },
          ];
          saveTranscriptCache(padsId, next);
          return next;
        });
        setLiveText(spoken);

        if (!convoModeRef.current) {
          return false;
        }

        await speakText(spoken);

        if (!convoModeRef.current) {
          return false;
        }

        if (turn.session_complete) {
          setConvoMode(false);
          convoModeRef.current = false;
          stopListening();
        } else if (convoModeRef.current) {
          resumeListening = true;
        }
        return turn.session_complete;
      } catch (err) {
        if (thinkingTimerRef.current) {
          clearInterval(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }
        setError(err instanceof Error ? err.message : zh ? "連線失敗" : "Request failed");
        setSceneState("");
        setStatusLabel("IDLE");
        return false;
      } finally {
        if (!convoModeRef.current) {
          setIsBusy(false);
          isBusyRef.current = false;
          return;
        }
        setIsBusy(false);
        isBusyRef.current = false;
        if (resumeListening && convoModeRef.current) {
          pendingResumeTimerRef.current = setTimeout(() => {
            pendingResumeTimerRef.current = null;
            if (convoModeRef.current && !isBusyRef.current) startListening();
          }, 400);
        }
      }
    },
    [padsId, patientName, speakText, startListening, stopListening, storageKey, zh]
  );

  processTurnRef.current = processTurn;

  const endConversation = useCallback(() => {
    setConvoMode(false);
    convoModeRef.current = false;
    forceStop();
    setLiveText(zh ? "對話已結束。" : "The conversation has ended.");
    setTranscript((prev) => [
      ...prev,
      { role: "assistant", text: zh ? "對話已結束。" : "The conversation has ended." },
    ]);
  }, [forceStop, zh]);

  const toggleConvoMode = useCallback(async () => {
    if (convoMode) {
      endConversation();
      return;
    }
    micCancelledRef.current = false;
    setConvoMode(true);
    convoModeRef.current = true;
    setSessionComplete(false);
    sessionIdRef.current = null;
    setSessionId(null);
    try {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(transcriptStorageKey(padsId));
    } catch {
      /* ignore */
    }
    setTranscript([]);
    await processTurn(undefined, "start");
  }, [convoMode, endConversation, padsId, processTurn, storageKey]);

  const toggleMic = () => {
    if (convoMode) {
      endConversation();
      return;
    }
    if (isBusy) return;
    if (isListening) {
      micCancelledRef.current = true;
      stopListening();
      setLiveText("");
    } else {
      startListening();
    }
  };

  const handleReset = async () => {
    forceStop();
    sessionIdRef.current = null;
    setSessionId(null);
    try {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(transcriptStorageKey(padsId));
    } catch {
      /* ignore */
    }
    setFollowUpIndex(0);
    setSessionComplete(false);
    setTranscript([]);
    setLiveText("");
    setConvoMode(false);
    convoModeRef.current = false;
    setAlertsClassified(false);
    setAlertSent(false);
    setAssignedDoctor(null);
    setMatchedDoctor(null);
    setDoctorMatchReason(null);
    setClassifiedAlerts([]);
    await sendVoiceChatTurn(padsId, { action: "reset", patient_name: patientName });
  };

  const handleSendText = () => {
    const msg = textInput.trim();
    if (!msg || isBusy) return;
    setTextInput("");
    void processTurn(msg);
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [transcript]);

  useEffect(() => () => forceStop(), [forceStop]);

  const ambientClass = sceneState || "";
  const stageClass = sceneState === "speaking" ? "pulsing" : "";

  const sceneClass = isHealth ? "pvc-scene-health" : isCompact ? "pvc-scene-compact" : "";

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden border-sky-200/50 dark:border-slate-700/50">
      <CardHeader className={`shrink-0 ${isCompact || isHealth ? "border-b py-2 px-3" : "pb-2"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className={`text-rose-500 ${isCompact ? "h-4 w-4" : "h-5 w-5"}`} />
            <CardTitle className={isCompact || isHealth ? "text-sm" : undefined}>{zh ? "健康對話" : "Health Chat"}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-muted">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${config?.llm_configured ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            LLM
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${config?.transcribe_configured ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            Whisper
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${config?.elevenlabs_configured ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            TTS
            <span className="rounded-full bg-cocare-100 px-1.5 py-0.5 font-medium text-cocare-800 dark:bg-cocare-900/40 dark:text-cocare-300">
              {followUpIndex}/{maxFollowUps} {zh ? "題" : "Q"}
            </span>
          </div>
        </div>
        {isHealth && (
          <p className="mt-1 text-xs text-slate-muted">
            {zh
              ? "使用 OpenAI Whisper 辨識語音；說完後短暫停頓約 1 秒即送出，避免重複字詞。"
              : "OpenAI Whisper transcribes your voice — pause ~1s when done; no repeated words."}
          </p>
        )}
        {!isCompact && !isHealth && (
          <p className="text-sm text-slate-muted">
            {zh
              ? "我會先給您一句溫暖支持，再溫和地追問（最多 5 題）。可用語音或文字回覆。"
              : "A brief emotional support message, then up to 5 gentle follow-up questions. Reply by voice or text."}
          </p>
        )}
      </CardHeader>

      <CardContent className={`flex min-h-0 flex-1 flex-col overflow-hidden ${isHealth ? "gap-2 p-2" : isCompact ? "gap-2 p-2" : "gap-3 p-4"}`}>
        <div className={`shrink-0 ${isHealth ? "px-1" : ""}`}>
          <div className={`pvc-scene w-full rounded-clinical ${sceneClass}`}>
            <div className={`pvc-ambient ${ambientClass}`} />
            <div className={`pvc-sphere-stage ${stageClass}`}>
              <VoiceChatSphere state={sceneState} />
            </div>
            <p className="pvc-status">{statusLabel}</p>
            <p className="pvc-live-text">{liveText}</p>
          </div>
        </div>

        <div className={`shrink-0 space-y-2 ${isHealth ? "" : ""}`}>
        <div className={`flex flex-wrap items-center justify-center ${isCompact ? "gap-2" : "gap-3"}`}>
          <button
            type="button"
            onClick={toggleMic}
            disabled={isBusy && !convoMode && !isListening}
            className={`inline-flex items-center justify-center rounded-full border transition-colors ${
              isCompact ? "h-9 w-9" : "h-11 w-11"
            } ${
              isListening || convoMode
                ? "border-cocare-500 bg-cocare-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-cocare-400 dark:border-slate-600 dark:bg-slate-800"
            }`}
            aria-label={zh ? "麥克風" : "Microphone"}
          >
            {isListening ? <MicOff className={isCompact ? "h-4 w-4" : "h-5 w-5"} /> : <Mic className={isCompact ? "h-4 w-4" : "h-5 w-5"} />}
          </button>

          <button
            type="button"
            onClick={toggleConvoMode}
            disabled={!convoMode && isBusy}
            className={`rounded-clinical font-semibold transition-colors ${
              isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
            } ${
              convoMode
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-cocare-600 text-white hover:bg-cocare-700"
            }`}
          >
            {convoMode
              ? zh
                ? "結束對話"
                : "End conversation"
              : zh
                ? "開始對話"
                : "Start conversation"}
          </button>

          {(isHealth || !isCompact) && (
            <button
              type="button"
              onClick={handleReset}
              className={`inline-flex items-center gap-1 rounded-clinical border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 ${
                isHealth ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {zh ? "重新開始" : "Restart"}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            placeholder={zh ? "或輸入文字回覆…" : "Or type your reply…"}
            disabled={isBusy}
            className={`flex-1 rounded-clinical border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 ${
              isCompact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
            }`}
          />
          <button
            type="button"
            onClick={handleSendText}
            disabled={isBusy || !textInput.trim()}
            className={`inline-flex items-center gap-1 rounded-clinical bg-cocare-600 font-medium text-white hover:bg-cocare-700 disabled:opacity-50 ${
              isCompact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
            }`}
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>

        {error && <p className={`text-rose-600 ${isCompact ? "text-xs" : "text-sm"}`}>{error}</p>}

        </div>

        <div
          className={`pvc-transcript-panel flex min-h-0 flex-1 flex-col rounded-clinical border border-slate-200 dark:border-slate-700 ${
            isHealth ? "pvc-transcript-panel-health" : isCompact ? "pvc-transcript-panel-compact" : ""
          }`}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
              {zh ? "對話記錄" : "Transcript"}
            </p>
            {alertSent && matchedDoctor && (
              <div
                className="flex max-w-[65%] flex-col items-end gap-0.5"
                title={doctorMatchReason ?? undefined}
              >
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <BellRing className="h-3 w-3 shrink-0" />
                  {zh ? `已通知 ${matchedDoctor}` : `Alert sent to ${matchedDoctor}`}
                </span>
                {doctorMatchReason && (
                  <span className="text-right text-[9px] leading-tight text-slate-muted">
                    {doctorMatchReason}
                  </span>
                )}
              </div>
            )}
          </div>
          <ScrollableArea
            locale={locale}
            wrapperClassName="min-h-0 flex-1"
            className={`pvc-transcript min-h-0 flex-1 px-3 py-2 ${
              isHealth ? "pvc-transcript-health" : isCompact ? "pvc-transcript-compact" : ""
            }`}
          >
            {transcript.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-muted">
                {zh ? "開始對話後，完整記錄會顯示於此。" : "Your full conversation will appear here once you start."}
              </p>
            ) : (
              <div className="space-y-3">
                {transcript.map((entry, i) => (
                  <div
                    key={`${entry.role}-${i}`}
                    className={`text-sm ${entry.role === "user" ? "text-right" : "text-left"}`}
                  >
                    <span className="text-xs font-medium text-slate-muted">
                      {entry.role === "user" ? (zh ? "您" : "You") : zh ? "陪伴助手" : "Companion"}
                    </span>
                    {entry.role === "assistant" && entry.emotional_support && (
                      <p className="pvc-msg-support mt-0.5">{entry.emotional_support}</p>
                    )}
                    {entry.role === "assistant" && entry.question && (
                      <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{entry.question}</p>
                    )}
                    {entry.role === "user" && <p className="mt-0.5 text-slate-700 dark:text-slate-300">{entry.text}</p>}
                    {entry.role === "assistant" && !entry.emotional_support && !entry.question && (
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{entry.text}</p>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </ScrollableArea>
        </div>
      </CardContent>
    </Card>
  );
}
