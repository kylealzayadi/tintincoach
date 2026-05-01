import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.prod.whoop.com/developer";

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

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("whoop_access_token")?.value;
  const refreshToken = request.cookies.get("whoop_refresh_token")?.value;

  if (!accessToken && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    if (!tokens) {
      return NextResponse.json({ error: "Token refresh failed. Reconnect WHOOP." }, { status: 401 });
    }
    accessToken = tokens.access_token;

    const response = NextResponse.json({ refreshed: true });
    response.cookies.set("whoop_access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });
    if (tokens.refresh_token) {
      response.cookies.set("whoop_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to WHOOP" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  // Fetch recovery, cycles, and sleep in parallel
  const [recoveryData, cycleData, sleepData] = await Promise.all([
    whoopFetch(`/v2/recovery?limit=25`, accessToken),
    whoopFetch(`/v2/cycle?limit=25`, accessToken),
    whoopFetch(`/v2/activity/sleep?limit=25`, accessToken),
  ]);

  // Find records matching the requested date
  let recovery: number | undefined;
  let strain: number | undefined;
  let sleep: number | undefined;

  if (date) {
    // Match cycle/recovery by date
    if (cycleData?.records) {
      const cycle = cycleData.records.find((c: Record<string, string>) => c.start?.startsWith(date));
      if (cycle?.score) {
        strain = cycle.score.strain;
      }

      if (cycle && recoveryData?.records) {
        const rec = recoveryData.records.find((r: Record<string, number>) => r.cycle_id === cycle.id);
        if (rec?.score) {
          recovery = rec.score.recovery_score;
        }
      }
    }

    if (sleepData?.records) {
      const sleepRecord = sleepData.records.find((s: Record<string, string>) => s.start?.startsWith(date));
      if (sleepRecord?.score?.stage_summary) {
        const totalMs = sleepRecord.score.stage_summary.total_in_bed_time_milli -
          sleepRecord.score.stage_summary.total_awake_time_milli;
        sleep = Math.round((totalMs / 1000 / 60 / 60) * 10) / 10;
      }
    }
  }

  return NextResponse.json({
    connected: true,
    whoop: { recovery, strain, sleep },
    raw: { recoveryData, cycleData, sleepData },
  });
}
