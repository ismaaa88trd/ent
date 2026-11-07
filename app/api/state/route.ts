import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { logEvent } from "@/lib/log"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Серверная «база»: один JSON-файл с атомарной записью.
 * Доступ уже защищён middleware.ts (пароль + сессия) — сюда долетают только авторизованные запросы.
 * Папку можно поменять переменной окружения ENT_DATA_DIR.
 * На serverless-хостингах без постоянной файловой системы (например, Vercel без внешней БД)
 * запись не сохранится между запросами — тогда работает только LocalStorage в браузере,
 * и стоит пользоваться экспортом/импортом JSON в настройках.
 */
const DIR = process.env.ENT_DATA_DIR ?? path.join(process.cwd(), "data")
const FILE = path.join(DIR, "state.json")
const MAX_BODY_BYTES = 2 * 1024 * 1024

export async function GET(request: Request) {
  try {
    const raw = await fs.readFile(FILE, "utf8")
    await logEvent("state_read", request)
    return NextResponse.json({ state: JSON.parse(raw) }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return NextResponse.json({ state: null })
    return NextResponse.json({ error: "read_failed" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) {
    await logEvent("state_write_rejected", request, { reason: "too_large", bytes: text.length })
    return NextResponse.json({ error: "too_large" }, { status: 413 })
  }
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    await logEvent("state_write_rejected", request, { reason: "invalid_json" })
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const value = body as { version?: number; settings?: unknown; sessions?: unknown; reviews?: unknown }
  if (value?.version !== 1 || !value.settings || !Array.isArray(value.sessions) || !Array.isArray(value.reviews)) {
    await logEvent("state_write_rejected", request, { reason: "invalid_shape" })
    return NextResponse.json({ error: "invalid_state" }, { status: 400 })
  }
  try {
    await fs.mkdir(DIR, { recursive: true })
    const tmp = `${FILE}.${process.pid}.tmp`
    await fs.writeFile(tmp, text, "utf8")
    await fs.rename(tmp, FILE)
    await logEvent("state_write", request, { bytes: text.length })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "write_failed" }, { status: 500 })
  }
}
