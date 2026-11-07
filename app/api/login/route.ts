import { NextResponse } from "next/server"
import { SESSION_COOKIE, verifyPassword } from "@/lib/auth"
import { createSession } from "@/lib/sessions"
import { clientIp, logEvent } from "@/lib/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WINDOW_MS = 10 * 60_000
const MAX_ATTEMPTS = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS })
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

function registerFailure(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS }
  entry.count += 1
  attempts.set(ip, entry)
}

export async function POST(request: Request) {
  const ip = clientIp(request)

  if (rateLimited(ip)) {
    await logEvent("login_locked", request, { ip })
    return NextResponse.json({ error: "too_many_attempts", message: "Слишком много попыток. Подожди немного и попробуй снова." }, { status: 429 })
  }

  let password = ""
  try {
    const body = await request.json()
    password = typeof body?.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }

  const ok = verifyPassword(password, process.env.ENT_PASSWORD_HASH)
  if (!ok) {
    registerFailure(ip)
    await logEvent("login_failed", request)
    return NextResponse.json({ error: "invalid_password", message: "Неверный пароль." }, { status: 401 })
  }

  attempts.delete(ip)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86_400,
  })
  await logEvent("login_success", request)
  return response
}
