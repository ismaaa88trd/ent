import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/sessions"

export const SESSION_COOKIE = "ent_session"

/** scrypt-хеш пароля вида "соль:хеш" (hex). Создаётся скриптом scripts/set-password.mjs. */
export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) return false
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export const verifySessionToken = verifySession

export function randomStrongPassword(words = 5) {
  // запасной вариант для scripts/set-password.mjs, если пользователь не передал свой пароль
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"
  return Array.from({ length: words }, () =>
    Array.from(randomBytes(4))
      .map((b) => alphabet[b % alphabet.length])
      .join(""),
  ).join("-")
}

export async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySession(token)
}
