import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const API_BASE = "https://api.prod.whoop.com/developer";

export async function GET() {
  const { data: stored } = await supabaseServer
    .from("whoop_tokens")
    .select("*")
    .eq("id", 1)
    .single();

  if (!stored) {
    return NextResponse.json({ error: "No WHOOP tokens in database. Connect WHOOP first." }, { status: 401 });
  }

  const endpoints = [
    "/v2/cycle?limit=3",
    "/v2/recovery?limit=3",
    "/v2/activity/sleep?limit=3",
  ];

  const results: Record<string, unknown> = {
    token_expires_at: stored.expires_at,
    token_updated_at: stored.updated_at,
  };

  for (const ep of endpoints) {
    const res = await fetch(`${API_BASE}${ep}`, {
      headers: { Authorization: `Bearer ${stored.access_token}` },
    });
    if (res.ok) {
      results[ep] = await res.json();
    } else {
      results[ep] = { status: res.status, body: await res.text() };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
