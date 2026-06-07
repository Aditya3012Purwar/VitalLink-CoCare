import { useCallback, useEffect, useRef, useState } from "react";
import { getCaretakerEmergencyAlerts } from "@/lib/api";
import {
  playCaretakerRingtone,
  startCaretakerAlarmLoop,
  stopCaretakerAlarmLoop,
} from "@/lib/alertSound";
import type { CaretakerEmergencyAlert } from "@/types/caretakerAlert";

const POLL_MS = 20_000;

export function useCaretakerEmergencyAlerts(padsId: string | undefined, enabled: boolean) {
  const [alerts, setAlerts] = useState<CaretakerEmergencyAlert[]>([]);
  const [hasActiveEmergency, setHasActiveEmergency] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const notifyNew = useCallback((incoming: CaretakerEmergencyAlert[]) => {
    const fresh = incoming.filter((a) => !seenIdsRef.current.has(a.id));
    incoming.forEach((a) => seenIdsRef.current.add(a.id));

    if (!soundEnabledRef.current || fresh.length === 0) return;

    if (fresh.some((a) => a.severity === "critical")) {
      startCaretakerAlarmLoop();
    } else {
      playCaretakerRingtone();
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!padsId || !enabled) return;
    try {
      const data = await getCaretakerEmergencyAlerts(padsId);
      setHasActiveEmergency(data.has_active_emergency);
      setAlerts(data.emergencies);

      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        data.emergencies.forEach((a) => seenIdsRef.current.add(a.id));
        if (soundEnabledRef.current && data.has_active_emergency) {
          startCaretakerAlarmLoop();
        }
      } else {
        notifyNew(data.emergencies);
      }
    } catch {
      /* silent retry on next poll */
    }
  }, [padsId, enabled, notifyNew]);

  useEffect(() => {
    if (!enabled || !padsId) return;
    initialLoadRef.current = true;
    seenIdsRef.current = new Set();
    setDismissedIds(new Set());
    void fetchAlerts();
    const id = setInterval(() => void fetchAlerts(), POLL_MS);
    return () => {
      clearInterval(id);
      stopCaretakerAlarmLoop();
    };
  }, [padsId, enabled, fetchAlerts]);

  useEffect(() => {
    if (!soundEnabled) stopCaretakerAlarmLoop();
  }, [soundEnabled]);

  const dismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(id);
      const stillCritical = alerts.some((a) => !next.has(a.id) && a.severity === "critical");
      if (!stillCritical) stopCaretakerAlarmLoop();
      return next;
    });
  };

  const acknowledgeAll = () => {
    setDismissedIds(new Set(alerts.map((a) => a.id)));
    stopCaretakerAlarmLoop();
  };

  const toggleSound = () => {
    setSoundEnabled((v) => {
      if (v) stopCaretakerAlarmLoop();
      return !v;
    });
  };

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  return {
    alerts: visibleAlerts,
    hasActiveEmergency,
    soundEnabled,
    toggleSound,
    dismiss,
    acknowledgeAll,
    refresh: fetchAlerts,
  };
}
