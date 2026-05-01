import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.prod.whoop.com/developer";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("whoop_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "No access token. Connect WHOOP first." }, { status: 401 });
  }

  const endpoints = [
    "/v2/cycle?limit=3",
    "/v2/recovery?limit=3",
    "/v2/activity/sleep?limit=3",
  ];

  const results: Record<string, unknown> = {};

  for (const ep of endpoints) {
    const res = await fetch(`${API_BASE}${ep}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      results[ep] = await res.json();
    } else {
      results[ep] = { status: res.status, body: await res.text() };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
