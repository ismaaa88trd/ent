import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth"
import { revokeSession } from "@/lib/sessions"
import { logEvent } from "@/lib/log"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  await revokeSession(match?.[1])
  await logEvent("logout", request)
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
