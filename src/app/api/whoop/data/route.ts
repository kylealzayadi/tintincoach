import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const API_BASE = "https://api.prod.whoop.com/developer";

async function getTokens() {
  const { data } = await supabaseServer
    .from("whoop_tokens")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number } | null> {
  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function whoopFetch(path: string, accessToken: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function utcToLocal(utcIso: string, offsetStr: string): Date {
  const d = new Date(utcIso);
  const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return d;
  const sign = match[1] === "+" ? 1 : -1;
  const offsetMs = sign * (parseInt(match[2]) * 60 + parseInt(match[3])) * 60000;
  return new Date(d.getTime() + offsetMs);
}

function localDateStr(utcIso: string, offsetStr: string): string {
  return utcToLocal(utcIso, offsetStr).toISOString().slice(0, 10);
}

interface DayData {
  recovery?: number;
  strain?: number;
  sleep?: number;
}

export async function GET() {
  const stored = await getTokens();
  if (!stored) {
    return NextResponse.json({ error: "Not connected to WHOOP" }, { status: 401 });
  }

  let accessToken = stored.access_token;

  // Check if token is expired and refresh
  if (stored.expires_at && new Date(stored.expires_at) < new Date()) {
    if (!stored.refresh_token) {
      return NextResponse.json({ error: "WHOOP token expired. Reconnect." }, { status: 401 });
    }
    const tokens = await refreshAccessToken(stored.refresh_token);
    if (!tokens) {
      return NextResponse.json({ error: "Token refresh failed. Reconnect WHOOP." }, { status: 401 });
    }
    accessToken = tokens.access_token;
    await supabaseServer.from("whoop_tokens").upsert({
      id: 1,
      access_token: accessToken,
      refresh_token: tokens.refresh_token ?? stored.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const [recoveryData, cycleData, sleepData] = await Promise.all([
    whoopFetch("/v2/recovery?limit=14", accessToken),
    whoopFetch("/v2/cycle?limit=14", accessToken),
    whoopFetch("/v2/activity/sleep?limit=14", accessToken),
  ]);

  const days: Record<string, DayData> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cycleById: Record<number, any> = {};

  function getDayForCycle(cycle: { start: string; end: string | null; timezone_offset: string }): string {
    const offset = cycle.timezone_offset || "+00:00";
    if (cycle.end) {
      return localDateStr(cycle.end, offset);
    }
    const startLocal = utcToLocal(cycle.start, offset);
    const nextDay = new Date(startLocal.getTime() + 86400000);
    return nextDay.toISOString().slice(0, 10);
  }

  if (cycleData?.records) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const cycle of cycleData.records as any[]) {
      cycleById[cycle.id] = cycle;
      const dayStr = getDayForCycle(cycle);
      if (!days[dayStr]) days[dayStr] = {};
      if (cycle.score) {
        days[dayStr].strain = Math.round(cycle.score.strain * 100) / 100;
      }
    }
  }

  if (recoveryData?.records) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const rec of recoveryData.records as any[]) {
      const cycle = cycleById[rec.cycle_id];
      if (!cycle) continue;
      const dayStr = getDayForCycle(cycle);
      if (!days[dayStr]) days[dayStr] = {};
      if (rec.score) {
        days[dayStr].recovery = rec.score.recovery_score;
      }
    }
  }

  if (sleepData?.records) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of sleepData.records as any[]) {
      if (s.nap) continue;
      const cycle = cycleById[s.cycle_id];
      if (!cycle) continue;
      const dayStr = getDayForCycle(cycle);
      if (!days[dayStr]) days[dayStr] = {};
      if (s.score?.stage_summary) {
        const totalMs = s.score.stage_summary.total_in_bed_time_milli -
          s.score.stage_summary.total_awake_time_milli;
        days[dayStr].sleep = Math.round((totalMs / 1000 / 60 / 60) * 10) / 10;
      }
    }
  }

  return NextResponse.json({ connected: true, days });
}
