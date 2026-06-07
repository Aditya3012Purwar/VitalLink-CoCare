import { AlertTriangle, Bell, BellOff, X } from "lucide-react";
import { useCaretakerEmergencyAlerts } from "@/hooks/useCaretakerEmergencyAlerts";
import type { Locale } from "@/types/patient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Props {
  padsId: string;
  patientName: string;
  locale: Locale;
}

export function CaretakerEmergencyBanner({ padsId, patientName, locale }: Props) {
  const isZh = locale === "zh";
  const {
    alerts,
    hasActiveEmergency,
    soundEnabled,
    toggleSound,
    dismiss,
    acknowledgeAll,
  } = useCaretakerEmergencyAlerts(padsId, true);

  if (alerts.length === 0) return null;

  const top = alerts[0];
  const isParkinson = top.attack_type === "parkinson";

  return (
    <div
      className={`shrink-0 border-b px-3 py-1.5 ${
        hasActiveEmergency
          ? "border-rose-400/70 bg-rose-100/95 animate-pulse dark:border-rose-800 dark:bg-rose-950/70"
          : "border-amber-300/60 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
        </span>

        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-rose-900 dark:text-rose-100">
            {hasActiveEmergency
              ? isZh
                ? `緊急 — ${patientName}`
                : `Emergency — ${patientName}`
              : isZh
                ? `警報 — ${patientName}`
                : `Alert — ${patientName}`}
            {": "}
            {top.event}
          </p>
          <p className="truncate text-[10px] text-rose-800/80 dark:text-rose-200/80">
            {isParkinson
              ? isZh ? "帕金森（智能手錶）" : "Parkinson (smartwatch)"
              : isZh ? "慢阻肺（電子健康）" : "COPD (e-health)"}
            {alerts.length > 1 && (isZh ? ` · 另有 ${alerts.length - 1} 則` : ` · +${alerts.length - 1} more`)}
          </p>
        </div>

        <Badge variant={top.severity === "critical" ? "risk-high" : "risk-moderate"} className="shrink-0 text-[9px]">
          {top.severity === "critical" ? (isZh ? "緊急" : "URGENT") : (isZh ? "警告" : "WARN")}
        </Badge>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleSound}
            className="rounded p-1 text-rose-700 hover:bg-rose-200/50 dark:text-rose-200"
            aria-label={soundEnabled ? (isZh ? "關閉鈴聲" : "Mute") : (isZh ? "開啟鈴聲" : "Unmute")}
          >
            {soundEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
          </button>
          <Button variant="outline" size="sm" onClick={acknowledgeAll} className="h-7 px-2 text-[10px]">
            {isZh ? "確認" : "OK"}
          </Button>
          <button
            type="button"
            onClick={() => dismiss(top.id)}
            className="rounded p-1 text-rose-700 hover:bg-rose-200/50 dark:text-rose-200"
            aria-label={isZh ? "關閉" : "Dismiss"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
