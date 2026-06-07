import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, LogIn, Pill, Stethoscope, User } from "lucide-react";
import { VitalLinkLogo } from "@/components/brand/VitalLinkLogo";
import type { Locale } from "@/types/patient";
import type { AuthRole, AuthUser } from "@/types/auth";
import type { PadsPatientSummary } from "@/types/parkinson";
import { getPatientDisplayName } from "@/data/patientNames";
import { getPadsPatients, login } from "@/lib/api";
import { unlockCaretakerAudio } from "@/lib/alertSound";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface LoginPageProps {
  locale: Locale;
  dark: boolean;
  onLogin: (user: AuthUser, patients: PadsPatientSummary[]) => void;
  onBack?: () => void;
  headerRight?: React.ReactNode;
}

const ROLES: { id: AuthRole; icon: React.ComponentType<{ className?: string }>; en: string; zh: string; descEn: string; descZh: string }[] = [
  { id: "doctor", icon: Stethoscope, en: "Doctor", zh: "醫生", descEn: "Analyze · prescribe · LLM chat", descZh: "分析 · 開處方 · AI 問答" },
  { id: "patient", icon: User, en: "Patient", zh: "患者", descEn: "Overview · tasks · meds · appointments", descZh: "概覽 · 任務 · 藥物 · 預約" },
  { id: "caretaker", icon: Heart, en: "Caretaker", zh: "照顧者", descEn: "Same view as patient — manage care", descZh: "與患者相同視圖 — 管理護理" },
  { id: "chemist", icon: Pill, en: "Chemist", zh: "藥劑師", descEn: "Scan QR · dispense", descZh: "掃描 QR · 配藥" },
];

export function LoginPage({ locale, dark, onLogin, onBack, headerRight }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AuthRole>("doctor");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "caretaker") unlockCaretakerAudio();
      const res = await login(email, password, role);
      onLogin(res.user, res.patients);
    } catch {
      const pads = await getPadsPatients().catch(() => []);
      const padsId = email.match(/\d{3}/)?.[0] ?? "004";
      const user: AuthUser =
        role === "patient"
          ? { id: `guest-patient-${padsId}`, email: email || "guest", role: "patient", name: getPatientDisplayName(padsId, "en"), title: "Parkinson's Patient", pads_id: padsId }
          : role === "caretaker"
            ? { id: "guest-caretaker", email: email || "guest", role: "caretaker", name: "Anna Weber (daughter)", title: "Family Caretaker" }
            : role === "chemist"
              ? { id: "guest-chemist", email: email || "guest", role: "chemist", name: "Mr. Lam", title: "Community Chemist" }
              : { id: "guest-doctor", email: email || "guest", role: "doctor", name: "Dr. Sarah Müller", title: "Movement Disorders Neurologist" };
      const patients =
        role === "doctor" ? pads
        : role === "patient" ? (pads.filter((p) => p.id === padsId).length ? pads.filter((p) => p.id === padsId) : pads.slice(0, 1))
        : role === "caretaker" ? (pads.filter((p) => p.id === "004").length ? pads.filter((p) => p.id === "004") : pads.slice(0, 1))
        : [];
      if (role === "chemist" || role === "caretaker" || role === "patient" || patients.length > 0) {
        if (role === "caretaker") unlockCaretakerAudio();
        onLogin(user, patients);
      }
    } finally {
      setLoading(false);
    }
  };

  const chrome = dark ? "border-slate-800 bg-slate-900/80" : "border-slate-700/50 bg-slate-800/95";

  return (
    <div className="min-h-screen bg-slate-clinical dark:bg-slate-950">
      <header className={`flex items-center justify-between border-b px-6 py-5 backdrop-blur-md ${chrome}`}>
        <div className="flex items-center gap-4">
          {onBack && (
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {locale === "zh" ? "返回" : "Back"}
            </button>
          )}
          <VitalLinkLogo
            locale={locale}
            size="lg"
            dark={dark}
            subtitle={locale === "zh" ? "醫生 · 患者 · 照顧者 · 藥劑師" : "Doctor · Patient · Caretaker · Chemist"}
            textClassName="text-white"
            subtitleClassName="text-slate-300"
          />
        </div>
        {headerRight}
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-12 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center lg:text-left">
          <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white lg:text-4xl">
            {locale === "zh" ? "登入示範平台" : "Sign in to demo"}
          </h1>
          <p className="mt-4 text-slate-muted">
            {locale === "zh"
              ? "智能手錶數據 → 醫生分析 → 開處方 → 患者 QR → 藥劑師配藥"
              : "Smartwatch data → doctor analysis → prescription → patient QR → chemist dispense"}
          </p>
          <div className="mt-8 grid gap-3">
            {ROLES.map(({ id, icon: Icon, en, zh, descEn, descZh }) => (
              <div key={id} className="rounded-clinical border border-cocare-200/60 bg-white/70 p-4 text-left dark:border-cocare-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-cocare-600" />
                  <p className="text-sm font-semibold">{locale === "zh" ? zh : en}</p>
                </div>
                <p className="mt-1 text-xs text-slate-muted">{locale === "zh" ? descZh : descEn}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="w-full min-w-[320px] max-w-md shadow-clinical-lg">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold">{locale === "zh" ? "登入" : "Sign in"}</h2>
              <div className="mt-4 flex gap-1 rounded-clinical border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
                {ROLES.map(({ id, en, zh }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                      role === id ? "bg-cocare-600 text-white" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {locale === "zh" ? zh : en}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-muted">{locale === "zh" ? "電郵（任意）" : "Email (any)"}</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    placeholder={
                      role === "patient" ? "patient.004"
                      : role === "caretaker" ? "anna.weber"
                      : role === "chemist" ? "chemist.lam"
                      : "doctor.mueller"
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-muted">{locale === "zh" ? "密碼（任意）" : "Password (any)"}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <LogIn className="h-4 w-4" />
                  {loading ? (locale === "zh" ? "登入中…" : "Signing in…") : locale === "zh" ? "登入" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
