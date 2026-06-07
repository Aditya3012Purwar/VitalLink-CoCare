import { QRCodeSVG } from "qrcode.react";
import { QrCode, Share2 } from "lucide-react";
import type { Locale } from "@/types/patient";
import type { Prescription } from "@/types/prescription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface Props {
  prescription: Prescription;
  locale: Locale;
  compact?: boolean;
}

export function PrescriptionQR({ prescription, locale, compact = false }: Props) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?rx=${prescription.token}`;
  const isZh = locale === "zh";

  if (compact) {
    return (
      <Card className="border-l-4 border-l-violet-500">
        <CardContent className="flex items-center gap-3 p-2">
          <div className="shrink-0 rounded-clinical border border-slate-200 bg-white p-1 dark:border-slate-700">
            <QRCodeSVG value={shareUrl} size={72} level="M" includeMargin />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-violet-600" />
              <p className="text-xs font-semibold">{isZh ? "處方 QR" : "Prescription QR"}</p>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-muted">
              {prescription.doctor_name} · {formatDate(prescription.created_at.slice(0, 10), locale)}
            </p>
            <p className="text-[10px] font-medium">
              {prescription.items.length} {isZh ? "種藥物" : "medicine(s)"}
            </p>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-cocare-600 hover:underline"
            >
              <Share2 className="h-2.5 w-2.5" />
              {isZh ? "給藥劑師" : "For chemist"}
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-violet-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-violet-600" />
          <CardTitle>{isZh ? "處方 QR 碼" : "Prescription QR code"}</CardTitle>
        </div>
        <p className="text-sm text-slate-muted">
          {isZh
            ? "將此 QR 碼出示給藥劑師，即可查看完整處方。"
            : "Show this QR code to your chemist to view the full prescription."}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-clinical border border-slate-200 bg-white p-4 dark:border-slate-700">
          <QRCodeSVG value={shareUrl} size={160} level="M" includeMargin />
        </div>
        <div className="flex-1 space-y-2 text-sm">
          <p>
            <span className="text-slate-muted">{isZh ? "醫生" : "Doctor"}: </span>
            {prescription.doctor_name}
          </p>
          <p>
            <span className="text-slate-muted">{isZh ? "日期" : "Date"}: </span>
            {formatDate(prescription.created_at.slice(0, 10), locale)}
          </p>
          <p className="font-medium">
            {prescription.items.length} {isZh ? "種藥物" : "medicine(s)"}
          </p>
          <ul className="space-y-1 text-xs text-slate-muted">
            {prescription.items.map((item) => (
              <li key={item.medicine_id}>
                {item.name} — {item.dose}, {item.frequency}
              </li>
            ))}
          </ul>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cocare-600 hover:underline"
          >
            <Share2 className="h-3 w-3" />
            {isZh ? "複製連結給藥劑師" : "Open link for chemist"}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
