import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = request.cookies.get("whoop_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/dashboard?whoop=error&reason=state", request.url));
  }

  const tokenRes = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/dashboard?whoop=error&reason=token", request.url));
  }

  const tokens = await tokenRes.json();

  // Store tokens in a cookie (encrypted in production; for now, httpOnly cookie)
  const response = NextResponse.redirect(new URL("/dashboard?whoop=connected", request.url));

  response.cookies.set("whoop_access_token", tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: tokens.expires_in,
    path: "/",
  });

  if (tokens.refresh_token) {
    response.cookies.set("whoop_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  response.cookies.delete("whoop_oauth_state");

  return response;
}
