#!/usr/bin/env node
// Генерирует переменные окружения для .env.local
// Запуск: node scripts/set-password.mjs "мой-пароль"   (без аргумента — пароль сгенерируется сам)
import { randomBytes, scryptSync } from "node:crypto"

const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"
function randomStrongPassword(words = 5) {
  return Array.from({ length: words }, () =>
    Array.from(randomBytes(4)).map((b) => alphabet[b % alphabet.length]).join(""),
  ).join("-")
}

const password = process.argv[2] || randomStrongPassword()
const salt = randomBytes(16)
const hash = scryptSync(password, salt, 64)
const sessionSecret = randomBytes(32).toString("hex")

console.log("Скопируй оба значения в .env.local (локально) и в Environment Variables на Vercel:\n")
console.log(`ENT_PASSWORD_HASH=${salt.toString("hex")}:${hash.toString("hex")}`)
console.log(`ENT_SESSION_SECRET=${sessionSecret}`)
if (!process.argv[2]) {
  console.log(`\nТвой пароль для входа (запиши его — он нигде не хранится в открытом виде):\n${password}`)
} else {
  console.log("\nПароль для входа — тот, что ты передал вторым аргументом.")
}
