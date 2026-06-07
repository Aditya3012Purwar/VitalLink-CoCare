import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowLeft, Brain, Search, Watch } from "lucide-react";
import { VitalLinkLogo } from "@/components/brand/VitalLinkLogo";
import { patientMatchesNameSearch } from "@/data/patientNames";
import { getWearableSummary } from "@/data/mock-pads-wearables";
import type { Locale, Patient, RiskTier } from "@/types/patient";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HighlightedText } from "@/components/ui/HighlightedText";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface PatientSelectorProps {
  patients: Patient[];
  locale: Locale;
  dark: boolean;
  onSelectPatient: (id: string) => void;
  onBack: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
}

const riskConfig: Record<
  RiskTier,
  { label: { en: string; zh: string }; badgeCls: string; borderCls: string; dotCls: string; hoverCls: string }
> = {
  high: {
    label: { en: "High tremor burden", zh: "震顫負擔高" },
    badgeCls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    borderCls: "border-red-200 dark:border-red-800/60",
    dotCls: "bg-red-500",
    hoverCls: "hover:border-red-400 dark:hover:border-red-600 hover:shadow-red-100/80",
  },
  moderate: {
    label: { en: "Moderate", zh: "中等" },
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    borderCls: "border-amber-200 dark:border-amber-800/60",
    dotCls: "bg-amber-500",
    hoverCls: "hover:border-amber-400 dark:hover:border-amber-600",
  },
  stable: {
    label: { en: "Stable monitoring", zh: "監測穩定" },
    badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    borderCls: "border-emerald-200 dark:border-emerald-800/60",
    dotCls: "bg-emerald-500",
    hoverCls: "hover:border-emerald-400 dark:hover:border-emerald-600",
  },
};

export function PatientSelector({
  patients,
  locale,
  dark,
  onSelectPatient,
  onBack,
  onToggleTheme,
  onToggleLocale,
}: PatientSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => patients.filter((p) => patientMatchesNameSearch(p.name, p.nameZh, search)),
    [patients, search],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-clinical dark:bg-slate-950">
      <header
        className={`flex shrink-0 items-center justify-between border-b px-6 py-4 backdrop-blur-md ${
          dark ? "border-slate-800 bg-slate-900/80" : "border-slate-700/50 bg-slate-800/95"
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1.5 text-sm transition-colors hover:text-white ${dark ? "text-slate-400" : "text-slate-300"}`}
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "zh" ? "返回" : "Back"}
          </button>
          <div className={`h-4 w-px ${dark ? "bg-slate-700" : "bg-slate-600"}`} />
          <VitalLinkLogo locale={locale} size="sm" dark={dark} textClassName="text-white" />
        </div>
        <ThemeToggle dark={dark} onToggle={onToggleTheme} locale={locale} onLocaleToggle={onToggleLocale} onDarkHeader />
      </header>

      <ScrollableArea locale={locale} wrapperClassName="flex flex-1 min-h-0 flex-col" className="flex flex-col items-center px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6 w-full max-w-5xl text-center">
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            {locale === "zh" ? "搜尋患者" : "Find a patient"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-muted dark:text-slate-400">
            {locale === "zh"
              ? "按患者姓名搜尋，點擊開啟分析儀表板"
              : "Search by patient name, then open their analysis dashboard"}
          </p>
        </motion.div>

        <div className="mb-8 w-full max-w-xl">
          <label className="sr-only" htmlFor="patient-search">
            {locale === "zh" ? "搜尋患者姓名" : "Search patient name"}
          </label>
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
              dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
            }`}
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "zh" ? "輸入患者姓名…" : "Type a patient name…"}
              autoFocus
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-muted dark:text-slate-400">
            {locale === "zh" ? "找不到符合的患者" : "No patients match your search"}
          </p>
        ) : (
          <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((patient, i) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                locale={locale}
                index={i}
                search={search}
                onSelect={() => onSelectPatient(patient.id)}
              />
            ))}
          </div>
        )}
      </ScrollableArea>
    </div>
  );
}

function PatientCard({
  patient,
  locale,
  index,
  search,
  onSelect,
}: {
  patient: Patient;
  locale: Locale;
  index: number;
  search: string;
  onSelect: () => void;
}) {
  const risk = riskConfig[patient.riskTier];
  const wearable = patient.padsId ? getWearableSummary(patient.padsId) : null;
  const name = locale === "zh" ? patient.nameZh : patient.name;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className={`group w-full cursor-pointer rounded-xl border-2 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-slate-900 ${risk.borderCls} ${risk.hoverCls}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${risk.badgeCls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${risk.dotCls}`} />
          {risk.label[locale]}
        </span>
        <span className="text-xs text-slate-muted">{patient.age} {patient.sex}</span>
      </div>

      <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
        <HighlightedText text={name} query={search} />
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-muted">{patient.familyDoctor}</p>

      {wearable && (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-muted">
          <span className="flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 dark:bg-teal-950/30">
            <Watch className="h-3 w-3" />
            {wearable.dominantTremorHz} Hz
          </span>
          <span className="flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 dark:bg-violet-950/30">
            <Brain className="h-3 w-3" />
            ML {(wearable.mlPdProbability * 100).toFixed(0)}%
          </span>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 dark:bg-amber-950/30">
            NMS {wearable.nmsPositive}/{wearable.nmsTotal}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-muted">
        <span className="flex items-center gap-1">
          <Activity className="h-3.5 w-3.5" />
          {patient.kpis.openTasks} {locale === "zh" ? "待辦" : "tasks"}
        </span>
        {patient.kpis.redFlags > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            {patient.kpis.redFlags} {locale === "zh" ? "警報" : "alerts"}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] text-slate-muted">
          <span>{locale === "zh" ? "依從性" : "Adherence"}</span>
          <span className="font-medium">{patient.adherenceScore}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-1.5 rounded-full ${
              patient.adherenceScore >= 75 ? "bg-cocare-500" : patient.adherenceScore >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${patient.adherenceScore}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs font-medium text-cocare-600 group-hover:underline dark:text-cocare-400">
          {locale === "zh" ? "開啟分析儀表板" : "Open analysis dashboard"}
        </span>
        <span className="text-cocare-400 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </motion.button>
  );
}
