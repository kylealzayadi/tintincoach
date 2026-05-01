"use client";

import type { WhoopData } from "@/lib/types";

interface WhoopCardProps {
  data: WhoopData;
  embedded?: boolean;
}

function recoveryLabel(score: number): { text: string; color: string; detail: string } {
  if (score >= 67) return { text: "Green — Ready to push", color: "text-success", detail: "Body is well recovered. Good day for high intensity or heavy volume." };
  if (score >= 34) return { text: "Yellow — Moderate", color: "text-warning", detail: "Partially recovered. Can train but avoid max effort. Consider lighter session." };
  return { text: "Red — Under-recovered", color: "text-danger", detail: "Body needs rest. Stick to active recovery, mobility, or a full rest day." };
}

function strainLabel(strain: number): { text: string; color: string; detail: string } {
  if (strain >= 18) return { text: "All Out", color: "text-danger", detail: "Extreme effort — equivalent to competition-level output. Needs extended recovery." };
  if (strain >= 14) return { text: "Overreaching", color: "text-warning", detail: "Very high demand on the body. Intense training session or physically demanding day." };
  if (strain >= 10) return { text: "Strenuous", color: "text-cyan", detail: "Solid training load — good moderate-to-hard workout. Standard hard training day." };
  if (strain >= 6) return { text: "Light Activity", color: "text-success", detail: "Light training or active recovery. Walking, easy cardio, or mobility work." };
  return { text: "Minimal", color: "text-muted", detail: "Very low physical demand. Rest day or mostly sedentary." };
}

function hrvLabel(hrv: number): string {
  if (hrv >= 60) return "Strong autonomic balance — body is adapting well to stress.";
  if (hrv >= 40) return "Normal range — decent recovery capacity.";
  if (hrv >= 25) return "Below average — could indicate accumulated fatigue or poor sleep.";
  return "Low — signs of significant stress, illness, or overtraining.";
}

function sleepPerfLabel(perf: number): string {
  if (perf >= 85) return "Met or exceeded sleep need. Well rested.";
  if (perf >= 70) return "Got most of the sleep needed. Adequate but could improve.";
  if (perf >= 50) return "Noticeable sleep debt building. May affect recovery.";
  return "Significant under-sleeping. Will impair performance and recovery.";
}

function Metric({ label, value, unit, color, sub }: { label: string; value?: number; unit?: string; color?: string; sub?: string }) {
  if (value == null) return null;
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-muted">{label}</span>
        <span className={`text-sm font-black ${color ?? "text-white"}`}>
          {value}{unit && <span className="text-xs font-bold text-muted ml-0.5">{unit}</span>}
        </span>
      </div>
      {sub && <p className="text-xs text-muted/70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function WhoopCard({ data, embedded = false }: WhoopCardProps) {
  const hasRecovery = data.recovery != null;
  const hasStrain = data.strain != null;
  const hasSleep = data.sleep != null;
  const hasAny = hasRecovery || hasStrain || hasSleep;

  if (!hasAny) {
    return (
      <div className={embedded ? "" : "bg-card border-2 border-border rounded-2xl p-4"}>
        {!embedded && <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">WHOOP</h3>}
        <p className="text-muted text-sm font-bold">No WHOOP data</p>
      </div>
    );
  }

  const rec = data.recovery != null ? recoveryLabel(data.recovery) : null;
  const str = data.strain != null ? strainLabel(data.strain) : null;

  return (
    <div className="space-y-3">
      {!embedded && (
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">WHOOP</h2>
          <p className="text-[10px] font-bold text-muted/60">Auto-refreshes every 2 hrs</p>
        </div>
      )}

      {/* Recovery */}
      {hasRecovery && (
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-black text-muted uppercase tracking-wider">Recovery</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-white">{data.recovery}%</span>
            {rec && <span className={`text-sm font-black ${rec.color}`}>{rec.text}</span>}
          </div>
          {rec && <p className="text-xs font-bold text-muted/80">{rec.detail}</p>}

          <div className="border-t border-border pt-2 space-y-0.5">
            <Metric
              label="Resting Heart Rate"
              value={data.resting_heart_rate}
              unit=" bpm"
              sub={data.resting_heart_rate != null ? (data.resting_heart_rate <= 60 ? "Good — lower RHR generally means better cardiovascular fitness." : data.resting_heart_rate <= 75 ? "Normal range." : "Elevated — could indicate fatigue, dehydration, or stress.") : undefined}
            />
            <Metric
              label="HRV (Heart Rate Variability)"
              value={data.hrv}
              unit=" ms"
              sub={data.hrv != null ? hrvLabel(data.hrv) : undefined}
            />
            <Metric label="Blood Oxygen (SpO2)" value={data.spo2} unit="%" sub={data.spo2 != null ? (data.spo2 >= 95 ? "Normal range." : "Slightly low — monitor for respiratory issues.") : undefined} />
            <Metric label="Skin Temperature" value={data.skin_temp} unit="°C" sub={data.skin_temp != null ? "Baseline metric. Sudden changes can indicate illness onset." : undefined} />
          </div>
        </div>
      )}

      {/* Strain */}
      {hasStrain && (
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-black text-muted uppercase tracking-wider">Day Strain</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-white">{data.strain}</span>
            <span className="text-sm font-bold text-muted">/ 21</span>
            {str && <span className={`text-sm font-black ${str.color}`}>{str.text}</span>}
          </div>
          {str && <p className="text-xs font-bold text-muted/80">{str.detail}</p>}

          <div className="border-t border-border pt-2 space-y-0.5">
            <Metric label="Avg Heart Rate" value={data.avg_heart_rate} unit=" bpm" sub="Average across the entire day including rest." />
            <Metric label="Max Heart Rate" value={data.max_heart_rate} unit=" bpm" sub="Peak HR hit during the day — usually during exercise." />
            <Metric label="Calories Burned" value={data.calories_burned} unit=" kcal" sub="Total energy expenditure for the day (active + basal)." />
          </div>
        </div>
      )}

      {/* Sleep */}
      {hasSleep && (
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-black text-muted uppercase tracking-wider">Sleep</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-white">{data.sleep}</span>
            <span className="text-sm font-bold text-muted">hrs total</span>
          </div>

          {/* Sleep stages bar */}
          {(data.light_sleep != null || data.deep_sleep != null || data.rem_sleep != null) && (
            <div>
              <div className="flex rounded-lg overflow-hidden h-3 mb-2">
                {data.light_sleep != null && data.sleep != null && (
                  <div className="bg-blue-400" style={{ width: `${(data.light_sleep / data.sleep) * 100}%` }} title="Light sleep" />
                )}
                {data.deep_sleep != null && data.sleep != null && (
                  <div className="bg-indigo-600" style={{ width: `${(data.deep_sleep / data.sleep) * 100}%` }} title="Deep sleep" />
                )}
                {data.rem_sleep != null && data.sleep != null && (
                  <div className="bg-cyan" style={{ width: `${(data.rem_sleep / data.sleep) * 100}%` }} title="REM sleep" />
                )}
                {data.awake_time != null && data.sleep != null && (
                  <div className="bg-border" style={{ width: `${(data.awake_time / (data.sleep + data.awake_time)) * 100}%` }} title="Awake" />
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                {data.light_sleep != null && <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />Light {data.light_sleep}h</span>}
                {data.deep_sleep != null && <span><span className="inline-block w-2 h-2 rounded-full bg-indigo-600 mr-1" />Deep {data.deep_sleep}h</span>}
                {data.rem_sleep != null && <span><span className="inline-block w-2 h-2 rounded-full bg-cyan mr-1" />REM {data.rem_sleep}h</span>}
                {data.awake_time != null && <span><span className="inline-block w-2 h-2 rounded-full bg-border mr-1" />Awake {data.awake_time}h</span>}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-2 space-y-0.5">
            <Metric
              label="Sleep Performance"
              value={data.sleep_performance}
              unit="%"
              color={data.sleep_performance != null ? (data.sleep_performance >= 85 ? "text-success" : data.sleep_performance >= 70 ? "text-warning" : "text-danger") : undefined}
              sub={data.sleep_performance != null ? sleepPerfLabel(data.sleep_performance) : undefined}
            />
            <Metric label="Sleep Efficiency" value={data.sleep_efficiency} unit="%" sub="Percentage of time in bed actually spent sleeping." />
            <Metric label="Sleep Consistency" value={data.sleep_consistency} unit="%" sub="How consistent the sleep/wake schedule is. Higher = more regular." />
            <Metric label="Respiratory Rate" value={data.respiratory_rate} unit=" br/min" sub="Normal adult range is 12-20 breaths/min during sleep." />
            <Metric label="Disturbances" value={data.disturbances} sub="Number of times sleep was disrupted. Fewer is better." />
            <Metric label="Sleep Cycles" value={data.sleep_cycles} sub="Complete sleep cycles (usually 4-6 per night is ideal)." />
          </div>
        </div>
      )}
    </div>
  );
}
