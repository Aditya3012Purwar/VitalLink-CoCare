import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MovementData } from "@/types/parkinson";
import type { Locale } from "@/types/patient";

interface Props {
  data: MovementData;
  locale: Locale;
}

export function TremorPSDChart({ data, locale }: Props) {
  const ch = data.channels[data.dominant_axis as "x" | "y" | "z"] ?? data.channels.x;
  const peakHz = ch.peak_frequency_hz;

  const chartData = ch.psd_frequencies.map((f, i) => ({
    freq: f,
    power: ch.psd_values[i],
    isPeak: f === peakHz,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="freq"
            tick={{ fontSize: 10 }}
            label={{
              value: locale === "zh" ? "頻率 (Hz)" : "Frequency (Hz)",
              position: "insideBottom",
              offset: -4,
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{
              value: "log₁₀ PSD",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
            }}
          />
          <Tooltip
            formatter={(v: number) => [v.toFixed(3), "PSD"]}
            labelFormatter={(f) => `${f} Hz`}
          />
          <Bar dataKey="power" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isPeak ? "#dc2626" : entry.freq >= 3 && entry.freq <= 6 ? "#f59e0b" : "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-slate-muted">
        {locale === "zh"
          ? `主震顫頻率：${peakHz} Hz（PD 靜止震顫通常 4–6 Hz）`
          : `Dominant tremor peak: ${peakHz} Hz (PD rest tremor typically 4–6 Hz)`}
      </p>
    </div>
  );
}
