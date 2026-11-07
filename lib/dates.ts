export function toIso(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function fromIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0)
}

export function addDays(iso: string, days: number) {
  const date = fromIso(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export function diffDays(a: string, b: string) {
  return Math.round((fromIso(a).getTime() - fromIso(b).getTime()) / 86_400_000)
}

export function weekday(iso: string) {
  return fromIso(iso).getDay()
}

/** Понедельник недели, в которую попадает дата */
export function startOfWeek(iso: string) {
  const wd = (weekday(iso) + 6) % 7
  return addDays(iso, -wd)
}

const weekdayShort = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"]
const weekdayFull = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"]

export function weekdayShortLabel(iso: string) {
  return weekdayShort[weekday(iso)]
}

export function weekdayFullLabel(iso: string) {
  return weekdayFull[weekday(iso)]
}

export function dayNumber(iso: string) {
  return String(fromIso(iso).getDate())
}

export function formatLong(iso: string) {
  const text = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(fromIso(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatDayMonth(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(fromIso(iso))
}

export function formatShort(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(fromIso(iso)).replace(".", "")
}

export function formatMonthYear(iso: string) {
  const text = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(fromIso(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function relativeLabel(iso: string, today: string) {
  const diff = diffDays(iso, today)
  if (diff === 0) return "Сегодня"
  if (diff === 1) return "Завтра"
  if (diff === -1) return "Вчера"
  if (diff === 2) return "Послезавтра"
  return weekdayShortLabel(iso)
}

export function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
