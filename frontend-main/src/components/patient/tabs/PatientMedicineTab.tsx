import { useState } from "react";
import { CreditCard, Pill, ShoppingCart } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import type { Prescription } from "@/types/prescription";
import { Card, CardContent } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PrescriptionQR } from "@/components/prescription/PrescriptionQR";

interface Props {
  patient: Patient;
  locale: Locale;
  prescription?: Prescription | null;
}

const DEMO_STOCK: Record<string, { pillsLeft: number; daysLeft: number }> = {
  "Levodopa/Carbidopa": { pillsLeft: 18, daysLeft: 6 },
  Pramipexole: { pillsLeft: 24, daysLeft: 12 },
  Rasagiline: { pillsLeft: 28, daysLeft: 28 },
  "Tiotropium/Olodaterol": { pillsLeft: 8, daysLeft: 5 },
  Salbutamol: { pillsLeft: 42, daysLeft: 21 },
};

function stockFor(name: string) {
  return DEMO_STOCK[name] ?? { pillsLeft: 30, daysLeft: 14 };
}

export function PatientMedicineTab({ patient, locale, prescription }: Props) {
  const ext = getRoleExtensions(patient.id);
  const isZh = locale === "zh";
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const meds = patient.medications.length > 0
    ? patient.medications
    : ext.patientMedCards.map((m) => ({
        id: m.id,
        name: m.name,
        dose: lt(m.whenToTake, locale),
        frequency: "",
        prescriber: "",
        adherence: 80,
        flag: lt(m.refillStatus, locale),
      }));

  const handlePay = (id: string) => {
    setOrderingId(id);
    setTimeout(() => {
      setPaidIds((prev) => new Set(prev).add(id));
      setOrderingId(null);
    }, 1200);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          {isZh ? "我的藥物" : "My medicine"}
        </h2>
        <p className="text-xs text-slate-muted">
          {isZh ? "處方 QR、付款，然後查看藥物庫存" : "Prescription QR & payment, then your medicine stock"}
        </p>
      </div>

      <div className={`grid shrink-0 gap-2 ${prescription ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {prescription && <PrescriptionQR prescription={prescription} locale={locale} compact />}
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="flex items-center justify-between gap-3 p-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <CreditCard className="h-3.5 w-3.5 text-cocare-600" />
                {isZh ? "示範付款" : "Demo payment"}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-muted">
                {isZh ? "一次付款所有偏低藥物" : "Pay for all low-stock medicines"}
              </p>
            </div>
            <Button size="sm" className="h-7 shrink-0 gap-1 text-[10px]" onClick={() => meds.forEach((m) => handlePay(m.id))}>
              <CreditCard className="h-3 w-3" />
              {isZh ? "付款" : "Pay all"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="shrink-0 text-xs font-medium text-slate-muted">
        {isZh ? "藥物庫存" : "Medicine stock"}
      </p>

      <ScrollableArea locale={locale} className="min-h-0 flex-1">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {meds.map((med) => {
          const stock = stockFor(med.name);
          const low = stock.daysLeft <= 7;
          const paid = paidIds.has(med.id);
          const ordering = orderingId === med.id;

          return (
            <Card
              key={med.id}
              className={`flex min-h-0 flex-col overflow-hidden ${low ? "border-amber-200/80 dark:border-amber-900/50" : ""}`}
            >
              <CardContent className="flex min-h-0 flex-1 flex-col p-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1">
                    <Pill className="h-3.5 w-3.5 shrink-0 text-cocare-600" />
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{med.name}</p>
                  </div>
                  {low && <Badge variant="risk-moderate" className="shrink-0 text-[9px]">{isZh ? "偏低" : "Low"}</Badge>}
                </div>
                <p className="mt-0.5 text-[10px] text-cocare-700 dark:text-cocare-400">
                  {med.dose}{med.frequency ? ` · ${med.frequency}` : ""}
                </p>
                <div className="mt-1.5 flex gap-3 text-[10px]">
                  <span><span className="text-slate-muted">{isZh ? "剩" : "Left"}: </span><strong>{stock.pillsLeft}</strong></span>
                  <span><span className="text-slate-muted">{isZh ? "天" : "Days"}: </span><strong className={low ? "text-amber-600" : ""}>{stock.daysLeft}</strong></span>
                  {"adherence" in med && (
                    <span><span className="text-slate-muted">{isZh ? "依從" : "Adh."}: </span><strong>{med.adherence}%</strong></span>
                  )}
                </div>
                {paid ? (
                  <p className="mt-auto pt-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                    {isZh ? "✓ 已付款" : "✓ Paid"}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    className="mt-auto h-7 w-full gap-1 text-[10px]"
                    disabled={ordering}
                    onClick={() => handlePay(med.id)}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    {ordering ? (isZh ? "付款中…" : "Paying…") : (isZh ? "補充" : "Reorder")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      </ScrollableArea>
    </div>
  );
}
