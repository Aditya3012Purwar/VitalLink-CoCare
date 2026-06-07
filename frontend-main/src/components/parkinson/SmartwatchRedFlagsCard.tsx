import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Watch } from "lucide-react";
import { getPerformanceAnalysis } from "@/lib/api";
import type { Locale } from "@/types/patient";
import type { PerformanceAnalysis } from "@/types/parkinson";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Props {
  padsId: string;
  locale: Locale;
}

export function SmartwatchRedFlagsCard({ padsId, locale }: Props) {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const isZh = locale === "zh";

  useEffect(() => {
    getPerformanceAnalysis(padsId).then(setAnalysis).catch(() => setAnalysis(null));
  }, [padsId]);

  const alerts = analysis?.alerts ?? analysis?.what_happened ?? [];
  const flags = alerts.filter((w) => w.red_flag);

  return (
    <Card className="border-l-4 border-l-rose-400">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Watch className="h-4 w-4 text-rose-500" />
          {isZh ? "智能手錶紅旗信號" : "Smartwatch red-flag signals"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {flags.length === 0 ? (
          <p className="text-sm text-slate-muted">
            {isZh ? "最新 PADS 評估未檢測到嚴重紅旗。" : "No critical red flags in the latest PADS assessment."}
          </p>
        ) : (
          flags.map((item, i) => (
            <div
              key={`${item.timestamp}-${i}`}
              className="rounded-clinical border border-rose-200/70 bg-rose-50/50 p-3 dark:border-rose-900/50 dark:bg-rose-950/25"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.event}</p>
              </div>
              {item.timestamp && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-muted">
                  <Clock className="h-3 w-3" />
                  {new Date(item.timestamp).toLocaleString(isZh ? "zh-HK" : "en-GB")}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-muted dark:text-slate-400">{item.detail}</p>
              {item.reason && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{item.reason}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
