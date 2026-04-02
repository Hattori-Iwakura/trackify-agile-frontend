"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityDay } from "@/lib/aggregate-my-dashboard";

type Props = {
  data: ActivityDay[];
};

export function ProfileActivityChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="h-[240px] sm:h-[260px] w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="profileActivityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as ActivityDay | undefined;
              return row?.date ?? "";
            }}
            formatter={(value: number) => [`${value}`, "Cập nhật issue (gán bạn)"]}
          />
          <Area
            type="monotone"
            dataKey="issueUpdates"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#profileActivityFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
