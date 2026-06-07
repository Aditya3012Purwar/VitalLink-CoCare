import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NmsDomain } from "@/types/parkinson";
import type { Locale } from "@/types/patient";

interface Props {
  domains: NmsDomain[];
  locale: Locale;
}

export function NMSDomainChart({ domains, locale }: Props) {
  const chartData = domains.map((d) => ({
    name: d.label.replace(" ", "\n"),
    score: d.score_pct,
    positive: d.positive_count,
    total: d.total_count,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
          <Tooltip
            formatter={(v: number, _n, props) => {
              const p = props.payload as { positive: number; total: number };
              return [`${v}% (${p.positive}/${p.total})`, locale === "zh" ? "陽性率" : "Positive rate"];
            }}
          />
          <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
