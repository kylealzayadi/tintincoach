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
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-4">7-Day Trends</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a0a0a0", fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 11, fill: "#a0a0a0", fontWeight: 700 }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "2px solid #2e2e2e",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#ffffff"
              strokeWidth={2.5}
              dot={false}
              name="Calories"
            />
            <Line
              type="monotone"
              dataKey="protein"
              stroke="#00e5ff"
              strokeWidth={2.5}
              dot={false}
              name="Protein"
            />
            <Line
              type="monotone"
              dataKey="recovery"
              stroke="#00e676"
              strokeWidth={2.5}
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
