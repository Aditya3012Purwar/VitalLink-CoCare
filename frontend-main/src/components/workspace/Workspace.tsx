import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, HeartPulse, LogOut, Share2 } from "lucide-react";
import type { AuthUser } from "@/types/auth";
import type { Prescription } from "@/types/prescription";
import { ui, t } from "@/lib/i18n";
import type { CarePlanItem, Locale, Patient } from "@/types/patient";
import type { PatientChecklistItem } from "@/types/roles";
import type { UserRole, WorkspaceTab } from "@/types/roles";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WorkspaceTabSwitcher, WorkspaceTabBadge } from "@/components/shell/RoleSwitcher";
import { ShareCarePlanModal } from "@/components/dashboard/ShareCarePlanModal";
import { CareNetworkTab } from "@/components/tabs/CareNetworkTab";
import { HealthChatTab } from "@/components/tabs/HealthChatTab";
import { DoctorWorkspace } from "@/components/workspace/DoctorWorkspace";
import { PatientWorkspace } from "@/components/workspace/PatientWorkspace";
import { DoctorRoleView } from "@/components/roles/DoctorRoleView";
import { NurseRoleView } from "@/components/roles/NurseRoleView";
import { PharmacistRoleView } from "@/components/roles/PharmacistRoleView";
import { CaretakerRoleView } from "@/components/roles/CaretakerRoleView";
import { PatientRoleView } from "@/components/roles/PatientRoleView";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface WorkspaceProps {
  patient: Patient;
  patients: Patient[];
  patientId: string;
  tab: WorkspaceTab;
  locale: Locale;
  authUser: AuthUser;
  showShareModal: boolean;
  onPatientChange: (id: string) => void;
  onTabChange: (tab: WorkspaceTab) => void;
  onLogout: () => void;
  onBackToPatients?: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
  onShare: () => void;
  onCloseShare: () => void;
  dark: boolean;
  prescription?: Prescription | null;
  onPrescriptionCreated?: (rx: Prescription) => void;
  onCarePlanChange?: (patientId: string, carePlan: CarePlanItem[]) => void;
  onChecklistChange?: (patientId: string, checklist: PatientChecklistItem[]) => void;
}

const roleViews: Record<UserRole, React.ComponentType<{ patient: Patient; locale: Locale }>> = {
  patient: PatientRoleView,
  doctor: DoctorRoleView,
  nurse: NurseRoleView,
  pharmacist: PharmacistRoleView,
  caretaker: CaretakerRoleView,
};

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

const chrome = (dark: boolean) =>
  dark ? "border-slate-800 bg-slate-900/80" : "border-slate-700/50 bg-slate-800/95";

const chromeBorder = (dark: boolean) => (dark ? "border-slate-800" : "border-slate-700/50");

const chromeText = (dark: boolean) => (dark ? "text-slate-400" : "text-slate-300");

export function Workspace({
  patient,
  patients,
  patientId,
  tab,
  locale,
  showShareModal,
  onPatientChange,
  onTabChange,
  authUser,
  onLogout,
  onBackToPatients,
  onToggleTheme,
  onToggleLocale,
  onShare,
  onCloseShare,
  dark,
  prescription,
  onPrescriptionCreated,
  onCarePlanChange,
  onChecklistChange,
}: WorkspaceProps) {
  const RoleView =
    tab !== "network" && tab !== "healthChat" ? roleViews[tab as UserRole] : null;
  const showPatientSwitcher = authUser.role === "doctor" && patients.length > 1;

  if (authUser.role === "patient" || authUser.role === "caretaker") {
    return (
      <PatientWorkspace
        patient={patient}
        locale={locale}
        dark={dark}
        authUser={authUser}
        showShareModal={showShareModal}
        prescription={prescription}
        onLogout={onLogout}
        onToggleTheme={onToggleTheme}
        onToggleLocale={onToggleLocale}
        onShare={onShare}
        onCloseShare={onCloseShare}
        onChecklistChange={onChecklistChange}
      />
    );
  }

  if (authUser.role === "doctor") {
    return (
      <DoctorWorkspace
        patient={patient}
        patients={patients}
        patientId={patientId}
        locale={locale}
        dark={dark}
        authUser={authUser}
        showShareModal={showShareModal}
        onPatientChange={onPatientChange}
        onBackToPatients={onBackToPatients}
        onLogout={onLogout}
        onToggleTheme={onToggleTheme}
        onToggleLocale={onToggleLocale}
        onShare={onShare}
        onCloseShare={onCloseShare}
        onPrescriptionCreated={onPrescriptionCreated}
        onCarePlanChange={onCarePlanChange}
      />
    );
  }

  const ehealthLabel =
    patient.ehealthSync === "synced"
      ? locale === "zh" ? "已同步" : "Synced"
      : patient.ehealthSync === "partial"
        ? locale === "zh" ? "部分同步" : "Partial"
        : locale === "zh" ? "待同步" : "Pending";

  return (
    <div className="flex min-h-screen bg-slate-clinical dark:bg-slate-950">
      <aside className={`sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r backdrop-blur-md ${chrome(dark)}`}>
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
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${dark ? "bg-cocare-600 text-white" : "bg-white text-slate-900"}`}>
              <HeartPulse className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white">{authUser.name}</p>
              <p className={`text-[10px] capitalize ${chromeText(dark)}`}>{authUser.role}</p>
            </div>
          </div>
        </div>

        <div className={`border-b p-3 ${chromeBorder(dark)}`}>
          <div className={`rounded-lg p-3 ${dark ? "bg-slate-800/60" : "bg-slate-700/60"}`}>
            <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskColors[patient.riskTier]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${riskDotColors[patient.riskTier]}`} />
              {patient.riskTier}
            </span>
            <p className="font-display text-sm font-semibold leading-tight text-white">
              {locale === "zh" ? patient.nameZh : patient.name}
            </p>
            <p className={`mt-0.5 text-[11px] ${chromeText(dark)}`}>
              {patient.age} {patient.sex} · {patient.conditions[0]}
            </p>
          </div>
        </div>

        {showPatientSwitcher && (
          <div className={`border-b p-3 ${chromeBorder(dark)}`}>
            <p className={`mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide ${chromeText(dark)}`}>
              {t(ui.switchPatient, locale)}
            </p>
            {patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPatientChange(p.id)}
                className={`mb-1 w-full rounded-clinical px-3 py-2 text-left text-xs transition-colors ${
                  patientId === p.id
                    ? "bg-cocare-600 text-white shadow-clinical"
                    : `${chromeText(dark)} hover:bg-slate-700`
                }`}
              >
                <p className="font-medium">{locale === "zh" ? p.nameZh : p.name}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 p-3">
          <p className={`mb-2 px-1 text-[10px] ${chromeText(dark)}`}>
            {locale === "zh" ? "護理團隊" : "Care team"}
          </p>
          <div className={`space-y-1 text-xs ${chromeText(dark)}`}>
            <p>{patient.familyDoctor}</p>
            <p>{patient.dhcCluster}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`sticky top-0 z-20 space-y-3 border-b px-4 py-3 backdrop-blur-md lg:px-6 ${chrome(dark)}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`gap-1.5 ${dark ? "" : "!border-slate-600 !bg-slate-700/50 !text-slate-200"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${patient.ehealthSync === "synced" ? "bg-cocare-500" : "bg-amber-500"}`} />
                PADS: {ehealthLabel}
              </Badge>
              <Badge variant="outline" className={dark ? "" : "!border-slate-600 !text-slate-200 !bg-slate-700/50"}>
                {t(ui.notForDiagnosis, locale)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className={`gap-1.5 ${dark ? "" : "!border-slate-600 !text-slate-200 !bg-slate-700/50 hover:!bg-slate-600/50"}`}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t(ui.printPlan, locale)}</span>
              </Button>
              <ThemeToggle dark={dark} onToggle={onToggleTheme} locale={locale} onLocaleToggle={onToggleLocale} onDarkHeader />
            </div>
          </div>

          <WorkspaceTabSwitcher tab={tab} locale={locale} authRole={authUser.role} onChange={onTabChange} onDarkChrome />
          <WorkspaceTabBadge tab={tab} locale={locale} />
        </header>

        <ScrollableArea locale={locale} wrapperClassName="flex-1 min-h-0" className="p-6">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${patientId}-${tab}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "network" ? (
                  <CareNetworkTab patient={patient} locale={locale} />
                ) : tab === "healthChat" ? (
                  <HealthChatTab patient={patient} locale={locale} />
                ) : tab === "doctor" ? (
                  <DoctorRoleView
                    patient={patient}
                    locale={locale}
                    doctorName={authUser.name}
                    onPrescriptionCreated={onPrescriptionCreated}
                  />
                ) : (
                  RoleView && <RoleView patient={patient} locale={locale} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollableArea>
      </div>

      {showShareModal && <ShareCarePlanModal patient={patient} locale={locale} onClose={onCloseShare} />}
    </div>
  );
}
