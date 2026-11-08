import { scryptSync, timingSafeEqual } from "crypto"

/**
 * Использует node:crypto — вызывать только из кода с runtime="nodejs" (API-роуты),
 * никогда из middleware.ts (там только Edge-совместимый lib/auth.ts).
 */
export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) return false
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
