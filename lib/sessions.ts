import { createHash, randomBytes } from "crypto"
import { promises as fs } from "fs"
import path from "path"

/**
 * Отзываемые сессии: в cookie лежит случайный токен, на сервере хранится только его хеш.
 * Это позволяет честному «Выйти» сразу аннулировать сессию (в отличие от самодостаточной
 * подписанной куки, которую нельзя отозвать до истечения срока).
 */
const DIR = process.env.ENT_DATA_DIR ?? path.join(process.cwd(), "data")
const FILE = path.join(DIR, "sessions.json")
const SESSION_DAYS = 30

type Store = { sessions: Array<{ hash: string; expiresAt: number }> }

const hash = (token: string) => createHash("sha256").update(token).digest("hex")

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.sessions) ? parsed : { sessions: [] }
  } catch {
    return { sessions: [] }
  }
}

async function write(store: Store) {
  await fs.mkdir(DIR, { recursive: true })
  const tmp = `${FILE}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(store), "utf8")
  await fs.rename(tmp, FILE)
}

export async function createSession() {
  const token = randomBytes(32).toString("hex")
  const now = Date.now()
  const store = await read()
  const alive = store.sessions.filter((s) => s.expiresAt > now)
  alive.push({ hash: hash(token), expiresAt: now + SESSION_DAYS * 86_400_000 })
  await write({ sessions: alive })
  return token
}

export async function verifySession(token: string | undefined | null) {
  if (!token) return false
  const store = await read()
  const h = hash(token)
  return store.sessions.some((s) => s.hash === h && s.expiresAt > Date.now())
}

export async function revokeSession(token: string | undefined | null) {
  if (!token) return
  const h = hash(token)
  const store = await read()
  await write({ sessions: store.sessions.filter((s) => s.hash !== h) })
}
