import { promises as fs } from "fs"
import path from "path"

/**
 * Простой журнал безопасности: вход, выход, попытки входа, обращения к базе.
 * Пишет JSON-строки в data/access.log (папку можно сменить через ENT_DATA_DIR).
 * Файл стоит периодически смотреть и можно безопасно удалять — на работу сайта это не влияет.
 */
const DIR = process.env.ENT_DATA_DIR ?? path.join(process.cwd(), "data")
const FILE = path.join(DIR, "access.log")
const MAX_BYTES = 2 * 1024 * 1024 // 2 МБ — после этого начинаем новый файл

export type LogEvent =
  | "login_success"
  | "login_failed"
  | "login_locked"
  | "logout"
  | "unauthorized"
  | "state_read"
  | "state_write"
  | "state_write_rejected"

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

export async function logEvent(event: LogEvent, request: Request, extra?: Record<string, unknown>) {
  const line = {
    time: new Date().toISOString(),
    event,
    ip: clientIp(request),
    path: new URL(request.url).pathname,
    userAgent: request.headers.get("user-agent") ?? "",
    ...extra,
  }
  try {
    await fs.mkdir(DIR, { recursive: true })
    try {
      const { size } = await fs.stat(FILE)
      if (size > MAX_BYTES) await fs.rename(FILE, `${FILE}.${Date.now()}.old`)
    } catch {
      /* файла ещё нет — это нормально */
    }
    await fs.appendFile(FILE, `${JSON.stringify(line)}\n`, "utf8")
  } catch {
    // На serverless-хостингах без постоянной файловой системы запись в лог молча пропускается.
  }
  // Дублируем в консоль — так события видны и в логах самого хостинга (например, Vercel).
  console.log(`[ent-log] ${line.time} ${event} ip=${line.ip} path=${line.path}`)
}
