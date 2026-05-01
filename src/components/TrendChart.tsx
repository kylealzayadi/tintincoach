"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import type { DailyLog } from "@/lib/types";

interface TrendChartProps {
  logs: DailyLog[];
}

export default function TrendChart({ logs }: TrendChartProps) {
  if (logs.length < 2) return null;

  const data = logs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({
      date: format(new Date(log.date + "T12:00:00"), "M/d"),
      calories: log.calories,
      protein: log.protein,
      recovery: log.whoop_json?.recovery,
    }));

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-muted mb-4">7-Day Trends</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#737373" }} />
            <YAxis tick={{ fontSize: 11, fill: "#737373" }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#141414",
                border: "1px solid #262626",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#ededed"
              strokeWidth={2}
              dot={false}
              name="Calories"
            />
            <Line
              type="monotone"
              dataKey="protein"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Protein"
            />
            <Line
              type="monotone"
              dataKey="recovery"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Recovery %"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
