import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const scopes = "read:recovery read:cycles read:sleep read:workout read:body_measurement offline";

  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    response_type: "code",
    scope: scopes,
    state,
  });

  const url = `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;

  const response = NextResponse.redirect(url);
  response.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
