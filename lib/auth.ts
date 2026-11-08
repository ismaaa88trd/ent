import { cookies } from "next/headers"

export const SESSION_COOKIE = "ent_session"
const SESSION_DAYS = 30

/**
 * Проверка сессии работает в middleware на Edge-рантайме Vercel, где недоступна файловая
 * система — поэтому сессия не хранится на диске, а представляет собой подписанный токен
 * (время истечения + HMAC-подпись). Проверка — это только математика (crypto.subtle),
 * без чтения файлов, поэтому не может зависнуть. Логаут не отзывает токен мгновенно на
 * сервере (для этого нужна была бы база данных), но без пароля новый токен не получить,
 * а старый действует максимум ещё SESSION_DAYS дней.
 */
function secret() {
  const value = process.env.ENT_SESSION_SECRET
  if (!value) throw new Error("ENT_SESSION_SECRET не задан — см. .env.example")
  return value
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
  return toHex(signature)
}

export async function createSessionToken() {
  const expires = Date.now() + SESSION_DAYS * 86_400_000
  const payload = String(expires)
  return `${payload}.${await hmac(payload)}`
}

// Edge-рантайм не даёт node:crypto, поэтому сравнение постоянного времени — на чистом JS:
// проходим строку целиком независимо от результата, чтобы не выдавать раннее несовпадение.
function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false
  const expected = await hmac(payload)
  if (!timingSafeEqualHex(signature, expected)) return false
  return Number(payload) > Date.now()
}

export async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}
