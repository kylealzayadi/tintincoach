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

function toLocalDate(utcIso: string, offsetStr: string): string {
  const d = new Date(utcIso);
  const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return utcIso.slice(0, 10);
  const sign = match[1] === "+" ? 1 : -1;
  const offsetMs = sign * (parseInt(match[2]) * 60 + parseInt(match[3])) * 60000;
  const local = new Date(d.getTime() + offsetMs);
  return local.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findCycleForDate(records: any[], targetDate: string) {
  for (const cycle of records) {
    const offset = cycle.timezone_offset || "+00:00";
    const startLocal = toLocalDate(cycle.start, offset);
    if (cycle.end) {
      const endLocal = toLocalDate(cycle.end, offset);
      if (targetDate >= startLocal && targetDate <= endLocal) return cycle;
    } else {
      if (targetDate >= startLocal) return cycle;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("whoop_access_token")?.value;
  const refreshToken = request.cookies.get("whoop_refresh_token")?.value;
  const newCookies: { name: string; value: string; maxAge: number }[] = [];

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
    whoopFetch(`/v2/recovery?limit=10`, accessToken),
    whoopFetch(`/v2/cycle?limit=10`, accessToken),
    whoopFetch(`/v2/activity/sleep?limit=10`, accessToken),
  ]);

  let recovery: number | undefined;
  let strain: number | undefined;
  let sleep: number | undefined;

  if (date && cycleData?.records) {
    const cycle = findCycleForDate(cycleData.records, date);

    if (cycle?.score) {
      strain = Math.round(cycle.score.strain * 100) / 100;
    }

    if (cycle && recoveryData?.records) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = recoveryData.records.find((r: any) => r.cycle_id === cycle.id);
      if (rec?.score) {
        recovery = rec.score.recovery_score;
      }
    }

    if (cycle && sleepData?.records) {
      // Find the primary (non-nap) sleep for this cycle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sleepRecord = sleepData.records.find((s: any) => s.cycle_id === cycle.id && !s.nap);
      if (sleepRecord?.score?.stage_summary) {
        const totalMs = sleepRecord.score.stage_summary.total_in_bed_time_milli -
          sleepRecord.score.stage_summary.total_awake_time_milli;
        sleep = Math.round((totalMs / 1000 / 60 / 60) * 10) / 10;
      }
    }
  }

  const response = NextResponse.json({
    connected: true,
    requestedDate: date,
    whoop: { recovery, strain, sleep },
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
