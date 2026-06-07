import { PatientVoiceChat } from "@/components/patient/PatientVoiceChat";
import type { Locale, Patient } from "@/types/patient";

interface Props {
  patient: Patient;
  locale: Locale;
}

export function HealthChatTab({ patient, locale }: Props) {
  const zh = locale === "zh";

  if (!patient.padsId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-muted">
        {zh ? "此帳戶尚未連結 PADS 患者資料。" : "No PADS patient record is linked to this account."}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PatientVoiceChat
        padsId={patient.padsId}
        patientName={patient.name}
        locale={locale}
        layout="health"
      />
    </div>
  );
}
