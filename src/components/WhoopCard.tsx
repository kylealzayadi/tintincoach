"use client";

import type { WhoopData } from "@/lib/types";

interface WhoopCardProps {
  data: WhoopData;
}

function Metric({ label, value, unit, color }: { label: string; value?: number; unit: string; color: string }) {
  return (
    <div>
      <p className="text-muted text-xs font-black uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>
        {value != null ? value : "—"}
        {value != null && <span className="text-sm font-bold text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function WhoopCard({ data }: WhoopCardProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">WHOOP</h3>
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Recovery" value={data.recovery} unit="%" color="text-success" />
        <Metric label="Strain" value={data.strain} unit="" color="text-warning" />
        <Metric label="Sleep" value={data.sleep} unit="hrs" color="text-cyan" />
      </div>
    </div>
  );
}
