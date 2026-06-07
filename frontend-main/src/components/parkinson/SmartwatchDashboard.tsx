import { useCallback, useEffect, useState } from "react";
import { Activity, Brain, ChevronDown, ChevronUp, Watch, Wifi, WifiOff } from "lucide-react";
import { getWearableSummary } from "@/data/mock-pads-wearables";
import { getChartSummaries, getMovementData, getPadsPatientDetail, checkApiHealth } from "@/lib/api";
import type { ChartSummaries } from "@/lib/api";
import { ChartSummaryBox } from "./ChartSummaryBox";
import type { Locale, Patient } from "@/types/patient";
import type { MovementData, PadsPatientDetail } from "@/types/parkinson";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MovementSignalChart } from "./MovementSignalChart";
import { TremorPSDChart } from "./TremorPSDChart";
import { NMSDomainChart } from "./NMSDomainChart";
import { TaskSeverityHeatmap } from "./TaskSeverityHeatmap";

interface Props {
  patient: Patient;
  locale: Locale;
  audience?: "doctor" | "caretaker" | "patient";
  /** Overview uses performance panel; this section shows detailed charts only */
  variant?: "full" | "chartsOnly";
}

const severityBadge = {
  normal: "risk-stable" as const,
  mild: "risk-moderate" as const,
  moderate: "risk-moderate" as const,
  high: "risk-high" as const,
};

export function SmartwatchDashboard({ patient, locale, audience = "doctor", variant = "full" }: Props) {
  const padsId = patient.padsId;
  const chartsOnly = variant === "chartsOnly";
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [detail, setDetail] = useState<PadsPatientDetail | null>(null);
  const [movement, setMovement] = useState<MovementData | null>(null);
  const [selectedTask, setSelectedTask] = useState("Relaxed");
  const [selectedWrist, setSelectedWrist] = useState<"Left" | "Right">("Left");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<ChartSummaries["summaries"] | null>(null);
  const [showDetails, setShowDetails] = useState(chartsOnly);

  const loadData = useCallback(async () => {
    if (!padsId) return;
    setLoading(true);
    setError(null);
    try {
      const [online, d, m, sums] = await Promise.all([
        checkApiHealth(),
        getPadsPatientDetail(padsId),
        getMovementData(padsId, selectedTask, selectedWrist),
        getChartSummaries(padsId, selectedTask, selectedWrist).catch(() => null),
      ]);
      setApiOnline(online);
      setDetail(d);
      setMovement(m);
      setSummaries(sums?.summaries ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PADS data");
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, [padsId, selectedTask, selectedWrist]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!padsId) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-slate-muted">
          {locale === "zh" ? "此患者未連接 PADS 智能手錶數據。" : "No PADS smartwatch data linked for this patient."}
        </CardContent>
      </Card>
    );
  }

  const p = detail?.patient;
  const wearable = padsId ? getWearableSummary(padsId) : null;

  return (
    <div className="space-y-6">
      {chartsOnly && (
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            {locale === "zh" ? "智能手錶圖表" : "Smartwatch charts"}
          </h2>
          <p className="mt-1 text-sm text-slate-muted dark:text-slate-400">
            {locale === "zh"
              ? "原始信號、震顫頻譜、任務嚴重度熱圖及非運動症狀領域分析"
              : "Raw signals, tremor spectra, task severity heatmap, and NMS domain analysis"}
          </p>
        </div>
      )}

      {audience === "doctor" && !chartsOnly && (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-muted">
          <Activity className="h-4 w-4 text-teal-600" />
          <span>
            {locale === "zh"
              ? "圖表分析 — 每張圖下方附簡易解讀"
              : "Chart analysis — simple explanations below each chart"}
          </span>
        </div>
      )}

      {/* Connection status */}
      <Card glass className="border-l-4 border-l-teal-500">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-clinical bg-teal-100 dark:bg-teal-900/40">
              <Watch className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                {locale === "zh" ? "PADS 智能手錶監測" : "PADS Smartwatch Monitoring"}
              </h2>
              <p className="text-xs text-slate-muted">
                {wearable
                  ? `${wearable.platform} · ${wearable.device} · ${wearable.samplingHz} Hz · ML PD ${(wearable.mlPdProbability * 100).toFixed(0)}%`
                  : "PhysioNet · Apple Watch Series 4 · 100 Hz · 11 assessment steps"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {apiOnline ? (
              <Badge variant="outline" className="gap-1 text-emerald-600">
                <Wifi className="h-3 w-3" /> API connected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-rose-600">
                <WifiOff className="h-3 w-3" /> API offline
              </Badge>
            )}
            {p && (
              <>
                <Badge variant="outline">{p.condition}</Badge>
                <Badge variant={`risk-${patient.riskTier}` as "risk-high"}>{patient.riskTier}</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-rose-200 dark:border-rose-900">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
            <p className="mt-2 text-xs text-slate-muted">
              {locale === "zh"
                ? "請啟動後端：cd backend && uvicorn main:app --reload"
                : "Start backend: cd backend && uvicorn main:app --reload"}
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !detail && (
        <div className="flex items-center justify-center py-12 text-sm text-slate-muted">
          <Activity className="mr-2 h-4 w-4 animate-pulse" />
          {locale === "zh" ? "載入智能手錶數據…" : "Loading smartwatch data…"}
        </div>
      )}

      {detail && audience === "caretaker" && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "震顫監測摘要" : "Tremor monitoring summary"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskSeverityHeatmap
              tasks={detail.task_summaries}
              locale={locale}
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
            />
          </CardContent>
        </Card>
      )}

      {detail && audience === "doctor" && (
        <>
          {!chartsOnly && summaries?.overall && (
            <Card className="border-l-4 border-l-sky-500">
              <CardContent className="p-5">
                <ChartSummaryBox
                  summary={summaries.overall}
                  locale={locale}
                  title={locale === "zh" ? "整體摘要" : "At a glance"}
                  className="mt-0"
                />
              </CardContent>
            </Card>
          )}

          {!chartsOnly && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<Watch className="h-4 w-4 text-teal-600" />}
                label={locale === "zh" ? "主治醫生" : "Neurologist"}
                value={detail.assignment.doctor ?? "—"}
              />
              <StatCard
                icon={<Brain className="h-4 w-4 text-violet-600" />}
                label={locale === "zh" ? "照顧者" : "Caretaker"}
                value={detail.assignment.caretaker ?? "—"}
              />
              <StatCard
                icon={<Activity className="h-4 w-4 text-amber-600" />}
                label={locale === "zh" ? "非運動症狀" : "NMS (PDNMS)"}
                value={`${detail.nms_items.filter((i) => i.positive).length}/30`}
              />
            </div>
          )}

          {/* Task heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "zh" ? "11 項評估步驟 — 雙腕震顫嚴重度" : "11 Assessment Steps — Bilateral Tremor Severity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskSeverityHeatmap
                tasks={detail.task_summaries}
                locale={locale}
                selectedTask={selectedTask}
                onSelectTask={setSelectedTask}
              />
              {summaries?.heatmap && (
                <ChartSummaryBox summary={summaries.heatmap} locale={locale} />
              )}
            </CardContent>
          </Card>

          {!chartsOnly && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowDetails((v) => !v)}
                className="gap-2"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showDetails
                  ? locale === "zh" ? "收起詳細圖表" : "Hide detailed charts"
                  : locale === "zh" ? "查看更多詳細圖表" : "More details — full charts"}
              </Button>
            </div>
          )}

          {(chartsOnly || showDetails) && (
          <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  {locale === "zh" ? "加速度信號" : "Acceleration Signal"}
                </CardTitle>
                <div className="flex gap-2">
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="rounded-clinical border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    {detail.assessment_steps.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedWrist}
                    onChange={(e) => setSelectedWrist(e.target.value as "Left" | "Right")}
                    className="rounded-clinical border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Left">{locale === "zh" ? "左手" : "Left"}</option>
                    <option value="Right">{locale === "zh" ? "右手" : "Right"}</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {movement ? (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs">
                      <Badge variant={severityBadge[movement.severity]}>
                        {movement.severity}
                      </Badge>
                      <span className="text-slate-muted">
                        {movement.tremor_frequency_hz} Hz · {movement.tremor_amplitude_g} g · axis {movement.dominant_axis}
                      </span>
                    </div>
                    <MovementSignalChart data={movement} locale={locale} />
                    {summaries?.acceleration && (
                      <ChartSummaryBox summary={summaries.acceleration} locale={locale} />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-muted">No movement data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === "zh" ? "功率頻譜密度 (PSD)" : "Power Spectral Density (PSD)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movement ? (
                  <>
                    <TremorPSDChart data={movement} locale={locale} />
                    {summaries?.psd && (
                      <ChartSummaryBox summary={summaries.psd} locale={locale} />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-muted">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* NMS domains */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "zh" ? "非運動症狀領域 (PDNMS)" : "Non-Motor Symptom Domains (PDNMS)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NMSDomainChart domains={detail.nms_domains} locale={locale} />
              {summaries?.nms_domains && (
                <ChartSummaryBox summary={summaries.nms_domains} locale={locale} />
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {detail.nms_items
                  .filter((i) => i.positive)
                  .slice(0, 6)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-clinical border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs dark:border-amber-900 dark:bg-amber-950/20"
                    >
                      {item.text}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-clinical border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 text-slate-muted">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
