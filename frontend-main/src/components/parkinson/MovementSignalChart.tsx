import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

export function MovementSignalChart({ data, locale }: Props) {
  const chartData = data.time_ms.map((t, i) => ({
    time: Math.round(t),
    x: data.channels.x.acceleration[i],
    y: data.channels.y.acceleration[i],
    z: data.channels.z.acceleration[i],
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            label={{
              value: locale === "zh" ? "時間 (ms)" : "Time (ms)",
              position: "insideBottom",
              offset: -4,
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{
              value: locale === "zh" ? "加速度 (g)" : "Acceleration (g)",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--tw-border-opacity)",
              fontSize: 12,
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="x" stroke="#0d9488" dot={false} strokeWidth={1.5} name="X" />
          <Line type="monotone" dataKey="y" stroke="#6366f1" dot={false} strokeWidth={1.5} name="Y" />
          <Line type="monotone" dataKey="z" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Z" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
