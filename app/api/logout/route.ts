import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth"
import { logEvent } from "@/lib/log"

export async function POST(request: Request) {
  await logEvent("logout", request)
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
