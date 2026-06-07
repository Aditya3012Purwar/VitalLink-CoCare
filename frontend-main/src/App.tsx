import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { padsToPatient } from "@/data/padsPatients";
import { applyPrescriptionToPatient } from "@/lib/prescriptionUtils";
import { getLatestPrescription } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import type { CarePlanItem, Locale, Patient } from "@/types/patient";
import type { WorkspaceTab } from "@/types/roles";
import type { PadsPatientSummary } from "@/types/parkinson";
import type { Prescription } from "@/types/prescription";
import { HeroLanding } from "@/components/landing/HeroLanding";
import { PatientSelector } from "@/components/landing/PatientSelector";
import { LoginPage } from "@/components/auth/LoginPage";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Workspace } from "@/components/workspace/Workspace";
import { ChemistRxView } from "@/components/prescription/ChemistRxView";
import { VitalLinkLogo } from "@/components/brand/VitalLinkLogo";

type View = "landing" | "login" | "patients" | "workspace" | "chemist_rx";

function getRxTokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("rx");
}

export default function App() {
  const [view, setView] = useState<View>(() => (getRxTokenFromUrl() ? "chemist_rx" : "landing"));
  const [rxToken, setRxToken] = useState<string | null>(() => getRxTokenFromUrl());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [tab, setTab] = useState<WorkspaceTab>("doctor");
  const [locale, setLocale] = useState<Locale>("en");
  const [dark, setDark] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});

  const patient = patientList.find((p) => p.id === patientId);
  const patientPrescription = patient?.padsId ? prescriptions[patient.padsId] ?? null : null;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const themeToggle = (
    <ThemeToggle
      dark={dark}
      onToggle={() => setDark((d) => !d)}
      locale={locale}
      onLocaleToggle={() => setLocale((l) => (l === "en" ? "zh" : "en"))}
      onDarkHeader
    />
  );

  const loadPrescriptions = async (mapped: Patient[]) => {
    const rxMap: Record<string, Prescription> = {};
    await Promise.all(
      mapped
        .filter((p) => p.padsId)
        .map(async (p) => {
          const rx = await getLatestPrescription(p.padsId!).catch(() => null);
          if (rx) rxMap[p.padsId!] = rx;
        })
    );
    if (Object.keys(rxMap).length > 0) {
      setPrescriptions((prev) => ({ ...prev, ...rxMap }));
      return mapped.map((p) => (p.padsId && rxMap[p.padsId] ? applyPrescriptionToPatient(p, rxMap[p.padsId]) : p));
    }
    return mapped;
  };

  const handleLogin = async (user: AuthUser, padsPatients: PadsPatientSummary[]) => {
    let mapped = padsPatients.map(padsToPatient);
    mapped = await loadPrescriptions(mapped);
    setAuthUser(user);
    setPatientList(mapped);
    setPatientId(mapped[0]?.id ?? "");
    setTab(
      user.role === "doctor" ? "doctor"
      : user.role === "patient" ? "patient"
      : user.role === "chemist" ? "pharmacist"
      : user.role === "caretaker" ? "patient"
      : "caretaker"
    );
    if (user.role === "doctor") setView("patients");
    else if (user.role === "chemist") setView("chemist_rx");
    else setView("workspace");
  };

  const handlePrescriptionCreated = (rx: Prescription) => {
    setPrescriptions((prev) => ({ ...prev, [rx.subject_id]: rx }));
    setPatientList((list) =>
      list.map((p) => (p.padsId === rx.subject_id ? applyPrescriptionToPatient(p, rx) : p))
    );
  };

  const handleCarePlanChange = (id: string, carePlan: CarePlanItem[]) => {
    setPatientList((list) => list.map((p) => (p.id === id ? { ...p, carePlan } : p)));
  };

  const handleChecklistChange = (id: string, checklist: Patient["checklist"]) => {
    setPatientList((list) => list.map((p) => (p.id === id ? { ...p, checklist } : p)));
  };

  const handleLogout = () => {
    setAuthUser(null);
    setPatientList([]);
    setPatientId("");
    setPrescriptions({});
    const token = getRxTokenFromUrl();
    setView(token ? "chemist_rx" : "landing");
    setRxToken(token);
  };

  const handlePatientChange = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setPatientId(id);
      setLoading(false);
    }, 300);
  };

  const handleTabChange = (next: WorkspaceTab) => {
    setLoading(true);
    setTimeout(() => {
      setTab(next);
      setLoading(false);
    }, 200);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HeroLanding locale={locale} dark={dark} onOpenDemo={() => setView("login")} headerRight={themeToggle} />
          </motion.div>
        ) : view === "login" ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage locale={locale} dark={dark} onLogin={handleLogin} onBack={() => setView("landing")} headerRight={themeToggle} />
          </motion.div>
        ) : view === "patients" && authUser ? (
          <motion.div key="patients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PatientSelector
              patients={patientList}
              locale={locale}
              dark={dark}
              onSelectPatient={(id) => {
                setPatientId(id);
                setView("workspace");
              }}
              onBack={() => setView("login")}
              onToggleTheme={() => setDark((d) => !d)}
              onToggleLocale={() => setLocale((l) => (l === "en" ? "zh" : "en"))}
            />
          </motion.div>
        ) : view === "chemist_rx" ? (
          <motion.div key="chemist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-slate-clinical p-6 dark:bg-slate-950">
            <div className="mb-6 flex items-center justify-between">
              <VitalLinkLogo locale={locale} size="sm" dark={dark} textClassName="text-slate-900 dark:text-white" />
              <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} locale={locale} onLocaleToggle={() => setLocale((l) => (l === "en" ? "zh" : "en"))} />
            </div>
            <ChemistRxView locale={locale} initialToken={rxToken ?? undefined} onBack={authUser ? handleLogout : () => setView("landing")} />
          </motion.div>
        ) : authUser && !patient ? (
          <motion.div key="no-patient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen items-center justify-center bg-slate-clinical p-6 dark:bg-slate-950">
            <div className="max-w-md rounded-clinical border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
              <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {locale === "zh" ? "找不到患者資料" : "No patient data found"}
              </p>
              <p className="mt-2 text-sm text-slate-muted">
                {locale === "zh" ? "請重新登入或聯絡支援。" : "Please sign in again or contact support."}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 rounded-clinical bg-cocare-600 px-4 py-2 text-sm font-medium text-white"
              >
                {locale === "zh" ? "返回登入" : "Back to sign in"}
              </button>
            </div>
          </motion.div>
        ) : patient && authUser ? (
          <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Workspace
              patient={patient}
              patients={patientList}
              patientId={patientId}
              tab={tab}
              locale={locale}
              authUser={authUser}
              dark={dark}
              showShareModal={showShareModal}
              prescription={patientPrescription}
              onPrescriptionCreated={handlePrescriptionCreated}
              onCarePlanChange={handleCarePlanChange}
              onChecklistChange={handleChecklistChange}
              onPatientChange={handlePatientChange}
              onTabChange={handleTabChange}
              onBackToPatients={authUser.role === "doctor" ? () => setView("patients") : undefined}
              onLogout={handleLogout}
              onToggleTheme={() => setDark((d) => !d)}
              onToggleLocale={() => setLocale((l) => (l === "en" ? "zh" : "en"))}
              onShare={() => setShowShareModal(true)}
              onCloseShare={() => setShowShareModal(false)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {loading && <LoadingSkeleton locale={locale} />}
    </>
  );
}

function LoadingSkeleton({ locale }: { locale: Locale }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cocare-200 border-t-cocare-600" />
        <p className="mt-4 font-display text-lg text-slate-700 dark:text-slate-300">
          {locale === "zh" ? "載入護理工作台…" : "Loading care workspace…"}
        </p>
      </div>
    </div>
  );
}
