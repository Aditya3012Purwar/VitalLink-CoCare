import { useEffect, useState } from "react";
import { Loader2, Pill, QrCode, Search } from "lucide-react";
import { getPrescriptionByToken } from "@/lib/api";
import type { Locale } from "@/types/patient";
import type { Prescription } from "@/types/prescription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface Props {
  locale: Locale;
  initialToken?: string;
  onBack?: () => void;
}

export function ChemistRxView({ locale, initialToken, onBack }: Props) {
  const [token, setToken] = useState(initialToken ?? "");
  const [rx, setRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(!!initialToken);
  const [error, setError] = useState<string | null>(null);

  const load = async (t: string) => {
    if (!t.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPrescriptionByToken(t.trim());
      setRx(data);
    } catch {
      setError(locale === "zh" ? "找不到處方，請檢查 QR 碼或代碼" : "Prescription not found — check QR code or token");
      setRx(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) load(initialToken);
  }, [initialToken]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-clinical border border-violet-200/60 bg-violet-50/30 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-violet-700" />
          <h1 className="font-display text-xl font-semibold">
            {locale === "zh" ? "藥劑師 · 處方查看" : "Chemist · Prescription viewer"}
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-muted">
          {locale === "zh"
            ? "掃描患者 QR 碼或輸入處方代碼以查看並配藥。"
            : "Scan the patient's QR code or enter the prescription token to dispense."}
        </p>
      </div>

      {!initialToken && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" />
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={locale === "zh" ? "輸入處方代碼…" : "Enter prescription token…"}
                className="w-full rounded-clinical border border-slate-200 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <Button onClick={() => load(token)} disabled={loading || !token.trim()} className="gap-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {locale === "zh" ? "查看處方" : "View prescription"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading && !rx && (
        <div className="flex justify-center py-8 text-sm text-slate-muted">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {locale === "zh" ? "載入處方…" : "Loading prescription…"}
        </div>
      )}

      {rx && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle>{locale === "zh" ? "處方詳情" : "Prescription details"}</CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{rx.patient_name}</Badge>
              <Badge variant="outline">{rx.condition}</Badge>
              <Badge variant="outline">Age {rx.patient_age}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-slate-muted">{locale === "zh" ? "醫生" : "Prescriber"}: </span>{rx.doctor_name}</p>
              <p><span className="text-slate-muted">{locale === "zh" ? "日期" : "Issued"}: </span>{formatDate(rx.created_at.slice(0, 10), locale)}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-muted">
                  <th className="pb-2 pr-3">{locale === "zh" ? "藥物" : "Medicine"}</th>
                  <th className="pb-2 pr-3">{locale === "zh" ? "劑量" : "Dose"}</th>
                  <th className="pb-2 pr-3">{locale === "zh" ? "頻率" : "Frequency"}</th>
                  <th className="pb-2">{locale === "zh" ? "天數" : "Days"}</th>
                </tr>
              </thead>
              <tbody>
                {rx.items.map((item) => (
                  <tr key={item.medicine_id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-slate-muted">{item.generic} · {item.category}</p>
                      <p className="mt-1 text-xs text-cocare-700">{item.instructions}</p>
                    </td>
                    <td className="py-3 pr-3">{item.dose}</td>
                    <td className="py-3 pr-3">{item.frequency}</td>
                    <td className="py-3">{item.duration_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rx.notes && (
              <div className="rounded-clinical bg-slate-50 p-3 text-sm dark:bg-slate-800/40">
                <p className="text-xs font-semibold uppercase text-slate-muted">{locale === "zh" ? "備註" : "Notes"}</p>
                <p className="mt-1">{rx.notes}</p>
              </div>
            )}

            <div className="rounded-clinical border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
              {locale === "zh"
                ? "✓ 處方已驗證 — 可按指示配藥"
                : "✓ Prescription verified — ready to dispense"}
            </div>
          </CardContent>
        </Card>
      )}

      {onBack && (
        <Button variant="outline" onClick={onBack}>
          {locale === "zh" ? "返回登入" : "Back to login"}
        </Button>
      )}
    </div>
  );
}
