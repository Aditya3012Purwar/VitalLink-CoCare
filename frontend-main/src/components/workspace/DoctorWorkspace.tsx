import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Share2,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";
import type { Prescription } from "@/types/prescription";
import { ui, t } from "@/lib/i18n";
import type { CarePlanItem, Locale, Patient } from "@/types/patient";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CareTimeline } from "@/components/dashboard/CareTimeline";
import { SharedCarePlan } from "@/components/dashboard/SharedCarePlan";
import { MedicationList } from "@/components/dashboard/MedicationList";
import { OwnershipMatrix } from "@/components/dashboard/OwnershipMatrix";
import { ReferralFlowMap } from "@/components/dashboard/ReferralFlowMap";
import { ShareCarePlanModal } from "@/components/dashboard/ShareCarePlanModal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { VitalLinkLogo } from "@/components/brand/VitalLinkLogo";
import { ParkinsonOverviewSection } from "@/components/parkinson/ParkinsonOverviewSection";
import { ParkinsonCareContextCard } from "@/components/parkinson/ParkinsonCareContextCard";
import { DetailedReportSection } from "@/components/parkinson/DetailedReportSection";
import { PrescriptionForm } from "@/components/prescription/PrescriptionForm";
import { canEditCarePlanItem, canManageCarePlan, resolveDoctorAuthorId } from "@/lib/carePlanAuth";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

export type DoctorSection =
  | "overview"
  | "timeline"
  | "carePlan"
  | "prescription"
  | "detailedReport"
  | "ownership"
  | "referral";

interface DoctorWorkspaceProps {
  patient: Patient;
  patients: Patient[];
  patientId: string;
  locale: Locale;
  dark: boolean;
  authUser: AuthUser;
  showShareModal: boolean;
  onPatientChange: (id: string) => void;
  onBackToPatients?: () => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
  onShare: () => void;
  onCloseShare: () => void;
  onPrescriptionCreated?: (rx: Prescription) => void;
  onCarePlanChange?: (patientId: string, carePlan: CarePlanItem[]) => void;
}

const navItems: {
  id: DoctorSection;
  icon: ComponentType<{ className?: string }>;
  label: { en: string; zh: string };
}[] = [
  { id: "overview", icon: LayoutDashboard, label: { en: "Overview", zh: "概覽" } },
  { id: "timeline", icon: GitBranch, label: { en: "Care timeline", zh: "護理時間軸" } },
  { id: "carePlan", icon: ClipboardList, label: { en: "Care plan", zh: "護理計劃" } },
  { id: "prescription", icon: Pill, label: { en: "Prescription", zh: "處方藥物" } },
  { id: "detailedReport", icon: BarChart3, label: { en: "Detailed report", zh: "詳細報告" } },
  { id: "ownership", icon: Users, label: { en: "Care ownership", zh: "護理責任" } },
  { id: "referral", icon: HeartPulse, label: { en: "Referral flow", zh: "轉介流程" } },
];

const riskColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  stable: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const riskDotColors: Record<string, string> = {
  high: "bg-red-500",
  moderate: "bg-amber-500",
  stable: "bg-emerald-500",
};

const riskLabels: Record<string, { en: string; zh: string }> = {
  high: { en: "High risk", zh: "高風險" },
  moderate: { en: "Moderate risk", zh: "中等風險" },
  stable: { en: "Stable", zh: "穩定" },
};

const chrome = (dark: boolean) =>
  dark ? "border-slate-800 bg-slate-900/80" : "border-slate-700/50 bg-slate-800/95";

const chromeBorder = (dark: boolean) => (dark ? "border-slate-800" : "border-slate-700/50");

const chromeText = (dark: boolean) => (dark ? "text-slate-400" : "text-slate-300");

export function DoctorWorkspace({
  patient,
  patients,
  patientId,
  locale,
  dark,
  authUser,
  showShareModal,
  onPatientChange,
  onBackToPatients,
  onLogout,
  onToggleTheme,
  onToggleLocale,
  onShare,
  onCloseShare,
  onPrescriptionCreated,
  onCarePlanChange,
}: DoctorWorkspaceProps) {
  const [section, setSection] = useState<DoctorSection>("overview");

  const ehealthLabel =
    patient.ehealthSync === "synced"
      ? locale === "zh" ? "已同步" : "Synced"
      : patient.ehealthSync === "partial"
        ? locale === "zh" ? "部分同步" : "Partial"
        : locale === "zh" ? "待同步" : "Pending";

  const riskLabel = riskLabels[patient.riskTier]?.[locale] ?? patient.riskTier;
  const outlineBtn = dark ? "" : "!border-slate-600 !text-slate-200 !bg-slate-700/50 hover:!bg-slate-600/50";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-clinical dark:bg-slate-950">
      <aside
        aria-label={locale === "zh" ? "主導覽" : "Main navigation"}
        className={`sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r backdrop-blur-md ${chrome(dark)}`}
      >
        <div className={`border-b p-4 ${chromeBorder(dark)}`}>
          {onBackToPatients && (
            <button
              type="button"
              onClick={onBackToPatients}
              className={`mb-3 flex items-center gap-1 text-xs transition-colors hover:text-white ${chromeText(dark)}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {locale === "zh" ? "所有患者" : "All patients"}
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className={`mb-3 flex items-center gap-1 text-xs transition-colors hover:text-white ${chromeText(dark)}`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {locale === "zh" ? "登出" : "Sign out"}
          </button>
          <VitalLinkLogo locale={locale} size="sm" dark={dark} textClassName="text-white" />
        </div>

        <div className={`border-b p-3 ${chromeBorder(dark)}`}>
          <div className={`rounded-lg p-3 ${dark ? "bg-slate-800/60" : "bg-slate-700/60"}`}>
            <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskColors[patient.riskTier]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${riskDotColors[patient.riskTier]}`} />
              {riskLabel}
            </span>
            <p className="font-display text-sm font-semibold leading-tight text-white">
              {locale === "zh" ? patient.nameZh : patient.name}
            </p>
            <p className={`mt-0.5 text-[11px] ${chromeText(dark)}`}>
              {patient.age} {patient.sex} · {patient.conditions[0]}
            </p>
          </div>
        </div>

        <ScrollableArea locale={locale} wrapperClassName="flex-1 min-h-0" className="space-y-0.5 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-clinical px-3 py-2.5 text-sm font-medium transition-colors ${
                section === item.id
                  ? "bg-cocare-600 text-white shadow-clinical"
                  : `${chromeText(dark)} hover:bg-slate-700`
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.label, locale)}
            </button>
          ))}
        </ScrollableArea>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className={`sticky top-0 z-20 flex shrink-0 items-center justify-between border-b px-4 py-3 backdrop-blur-md md:px-6 ${chrome(dark)}`}>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`gap-1.5 ${outlineBtn}`}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  patient.ehealthSync === "synced" ? "bg-cocare-500" : "bg-amber-500"
                }`}
              />
              {t(ui.ehealth, locale)}: {ehealthLabel}
            </Badge>
            <span className={`hidden text-sm sm:inline ${chromeText(dark)}`}>
              {patient.familyDoctor}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShare} className={`gap-1.5 ${outlineBtn}`}>
              <Share2 className="h-4 w-4" />
              {t(ui.printPlan, locale)}
            </Button>
            <ThemeToggle
              dark={dark}
              onToggle={onToggleTheme}
              locale={locale}
              onLocaleToggle={onToggleLocale}
              onDarkHeader
            />
          </div>
        </header>

        <main
          className={`flex min-h-0 flex-1 flex-col overflow-hidden px-4 md:px-6 ${
            section === "overview" ? "py-4" : ""
          }`}
          aria-live="polite"
        >
          {section === "overview" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${patientId}-${section}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="mx-auto flex h-full min-h-0 max-w-7xl flex-col"
            >
              <ParkinsonOverviewSection
                patient={patient}
                locale={locale}
                onPrescribe={() => setSection("prescription")}
                onOpenCarePlan={() => setSection("carePlan")}
              />
            </motion.div>
          </AnimatePresence>
          ) : (
          <ScrollableArea locale={locale} wrapperClassName="min-h-0 flex-1" className="py-5 md:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${patientId}-${section}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="mx-auto max-w-7xl space-y-5 md:space-y-6"
            >

              {section === "timeline" && <CareTimeline patient={patient} locale={locale} />}

              {section === "carePlan" && (
                <SharedCarePlan
                  patient={patient}
                  locale={locale}
                  currentUser={authUser}
                  onUpdate={(item) => {
                    if (!onCarePlanChange || !canEditCarePlanItem(item, authUser)) return;
                    onCarePlanChange(
                      patient.id,
                      patient.carePlan.map((c) => (c.id === item.id ? item : c))
                    );
                  }}
                  onDelete={(itemId) => {
                    const target = patient.carePlan.find((c) => c.id === itemId);
                    if (!onCarePlanChange || !target || !canEditCarePlanItem(target, authUser)) return;
                    onCarePlanChange(
                      patient.id,
                      patient.carePlan.filter((c) => c.id !== itemId)
                    );
                  }}
                  onAdd={(item) => {
                    if (!onCarePlanChange || !canManageCarePlan(authUser)) return;
                    const owned = {
                      ...item,
                      authoredBy: resolveDoctorAuthorId(authUser),
                      authoredByName: authUser.name,
                    };
                    onCarePlanChange(patient.id, [...patient.carePlan, owned]);
                  }}
                />
              )}

              {section === "prescription" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={Pill}
                    title={locale === "zh" ? "處方藥物" : "Prescription"}
                    description={
                      locale === "zh"
                        ? "開立處方、管理左旋多巴等帕金森藥物及患者 QR 分享"
                        : "Prescribe medicines, manage levodopa regimen, and share QR with patient"
                    }
                  />
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      {patient.padsId && onPrescriptionCreated ? (
                        <PrescriptionForm
                          padsId={patient.padsId}
                          doctorName={authUser.name}
                          locale={locale}
                          onCreated={onPrescriptionCreated}
                        />
                      ) : (
                        <p className="text-sm text-slate-muted">
                          {locale === "zh" ? "此患者無法開立處方。" : "Prescription not available for this patient."}
                        </p>
                      )}
                    </div>
                    <div>
                      <MedicationList patient={patient} locale={locale} />
                    </div>
                  </div>
                </div>
              )}

              {section === "detailedReport" && (
                <DetailedReportSection patient={patient} locale={locale} />
              )}

              {section === "ownership" && (
                <OwnershipMatrix patient={patient} locale={locale} />
              )}

              {section === "referral" && (
                <>
                  <SectionHeader
                    icon={HeartPulse}
                    title={locale === "zh" ? "轉介流程" : "Referral flow"}
                    description={
                      locale === "zh"
                        ? "從懷疑帕金森到運動障礙門診及社區支援的轉介路徑"
                        : "Referral pathway from suspected PD to movement disorders clinic and community care"
                    }
                  />
                  <ParkinsonCareContextCard patient={patient} locale={locale} variant="referral" />
                  <ReferralFlowMap patient={patient} locale={locale} />
                </>
              )}

            </motion.div>
          </AnimatePresence>
          </ScrollableArea>
          )}
        </main>
      </div>

      {showShareModal && <ShareCarePlanModal patient={patient} locale={locale} onClose={onCloseShare} />}
    </div>
  );
}
