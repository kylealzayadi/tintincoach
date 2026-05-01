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
  if (!res.ok) {
    const text = await res.text();
    console.error(`WHOOP API error ${res.status} for ${path}:`, text);
    return null;
  }
  return res.json();
}

function dateFromISO(iso: string): string {
  return iso.slice(0, 10);
}

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("whoop_access_token")?.value;
  const refreshToken = request.cookies.get("whoop_refresh_token")?.value;
  let newCookies: { name: string; value: string; maxAge: number }[] = [];

  if (!accessToken && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    if (!tokens) {
      return NextResponse.json({ error: "Token refresh failed. Reconnect WHOOP." }, { status: 401 });
    }
    accessToken = tokens.access_token;
    newCookies.push({ name: "whoop_access_token", value: accessToken, maxAge: tokens.expires_in });
    if (tokens.refresh_token) {
      newCookies.push({ name: "whoop_refresh_token", value: tokens.refresh_token, maxAge: 60 * 60 * 24 * 30 });
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to WHOOP" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const [recoveryData, cycleData, sleepData] = await Promise.all([
    whoopFetch(`/v2/recovery?limit=25`, accessToken),
    whoopFetch(`/v2/cycle?limit=25`, accessToken),
    whoopFetch(`/v2/activity/sleep?limit=25`, accessToken),
  ]);

  let recovery: number | undefined;
  let strain: number | undefined;
  let sleep: number | undefined;
  let debug: Record<string, unknown> = {};

  if (date && cycleData?.records) {
    // WHOOP cycles: match by extracting date from "start" ISO timestamp
    const cycle = cycleData.records.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.start && dateFromISO(c.start) === date
    );

    debug.matchedCycle = cycle ? { id: cycle.id, start: cycle.start, score: cycle.score } : null;
    debug.availableCycleDates = cycleData.records.slice(0, 5).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => ({ start: c.start, date: c.start ? dateFromISO(c.start) : null })
    );

    if (cycle?.score) {
      strain = cycle.score.strain;
    }

    // Recovery is linked to a cycle
    if (cycle && recoveryData?.records) {
      const rec = recoveryData.records.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.cycle_id === cycle.id
      );
      if (rec?.score) {
        recovery = rec.score.recovery_score;
      }
      debug.matchedRecovery = rec ? { cycle_id: rec.cycle_id, score: rec.score } : null;
    }
  }

  if (date && sleepData?.records) {
    // Sleep: match by date from "start" timestamp
    const sleepRecord = sleepData.records.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.start && dateFromISO(s.start) === date
    );

    debug.matchedSleep = sleepRecord ? { start: sleepRecord.start, score: sleepRecord.score } : null;
    debug.availableSleepDates = sleepData.records.slice(0, 5).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => ({ start: s.start, date: s.start ? dateFromISO(s.start) : null })
    );

    if (sleepRecord?.score?.stage_summary) {
      const totalMs = sleepRecord.score.stage_summary.total_in_bed_time_milli -
        sleepRecord.score.stage_summary.total_awake_time_milli;
      sleep = Math.round((totalMs / 1000 / 60 / 60) * 10) / 10;
    }
  }

  const response = NextResponse.json({
    connected: true,
    requestedDate: date,
    whoop: { recovery, strain, sleep },
    debug,
  });

  for (const cookie of newCookies) {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: cookie.maxAge,
      path: "/",
    });
  }

  return response;
}
