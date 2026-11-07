import { topicById, topics } from "@/lib/curriculum"
import { addDays, diffDays, weekday } from "@/lib/dates"
import type { AppState, PlanItem, ReviewTask, SessionRecord, Settings, Subject, Topic, TopicStatus } from "@/lib/types"

export const sessionKey = (topicId: string, no: number) => `study:${topicId}:${no}`
export const reviewKey = (taskId: string) => `review:${taskId}`

/* ───────────────── Прогресс тем ───────────────── */

export type TopicProgress = {
  sessionsDone: number
  reviewsDone: number
  reviewsTotal: number
  status: TopicStatus
  /** (сессии + повторения) / (всего сессий + число интервалов повторения) */
  percent: number
}

export function studySessionsDone(sessions: SessionRecord[], topicId: string) {
  const done = new Set<number>()
  for (const record of sessions) {
    if (record.kind === "study" && record.topicId === topicId && record.sessionNo) done.add(record.sessionNo)
  }
  return done
}

export function computeProgress(state: AppState, topic: Topic): TopicProgress {
  const sessionsDone = studySessionsDone(state.sessions, topic.id).size
  const reviews = state.reviews.filter((task) => task.topicId === topic.id && task.stage > 0)
  const reviewsDone = reviews.filter((task) => task.done).length
  const reviewSlots = topic.reviewDays.length
  const needsReview = state.topicNotes[topic.id]?.needsReview ?? false
  const allSessions = sessionsDone >= topic.sessionsTotal
  const stage1Done = new Set(reviews.filter((task) => task.done).map((task) => task.stage))
  const allReviews = topic.reviewDays.every((_, index) => stage1Done.has(index + 1))

  let status: TopicStatus = "not_started"
  if (needsReview) status = "needs_review"
  else if (allSessions && allReviews) status = "mastered"
  else if (sessionsDone > 0 || reviewsDone > 0) status = "in_progress"

  const percent = Math.round(((Math.min(sessionsDone, topic.sessionsTotal) + Math.min(reviewsDone, reviewSlots)) / (topic.sessionsTotal + reviewSlots)) * 100)
  return { sessionsDone, reviewsDone, reviewsTotal: reviewSlots, status, percent }
}

export function allProgress(state: AppState): Record<string, TopicProgress> {
  return Object.fromEntries(topics.map((topic) => [topic.id, computeProgress(state, topic)]))
}

/* ───────────────── Типы дней ───────────────── */

export type DayType = "rest" | "reserve" | "study"

export function dayType(date: string, settings: Settings): DayType {
  const wd = weekday(date)
  if (settings.restDays.includes(wd)) return "rest"
  if (wd === settings.reserveDay) return "reserve"
  return "study"
}

function maxSessionsPerDay(settings: Settings) {
  return settings.intensity === "intense" ? 2 : 1
}

function dayCapacityMinutes(date: string, settings: Settings) {
  const wd = weekday(date)
  const hours = wd === 0 || wd === 6 ? settings.weekendHours : settings.weekdayHours
  return Math.round(hours * 60)
}

/** В лёгком режиме учебными остаются не более 3 дней в неделю. */
function isStudyDayForIntensity(date: string, settings: Settings) {
  if (dayType(date, settings) !== "study") return false
  if (settings.intensity !== "light") return true
  const wd = weekday(date)
  const mondayBased = (wd + 6) % 7
  return mondayBased % 2 === 0
}

/* ───────────────── Очередь сессий ───────────────── */

export type QueueEntry = { topicId: string; sessionNo: number; subject: Subject; key: string }

/** Веса предметов зависят от того, сколько сессий уже стоит в маршруте: сначала алгебра, затем геометрия, затем информатика. */
function weightsAt(position: number, daysToExam: number): Record<Subject, number> {
  if (daysToExam <= 45) return { algebra: 2, geometry: 1, informatics: 1 }
  if (position < 14) return { algebra: 1, geometry: 0, informatics: 0 }
  if (position < 34) return { algebra: 3, geometry: 1, informatics: 0 }
  if (position < 70) return { algebra: 3, geometry: 1, informatics: 1 }
  return { algebra: 2, geometry: 1, informatics: 1 }
}

export function buildQueue(state: AppState, today: string): QueueEntry[] {
  const doneSets = new Map<string, Set<number>>()
  for (const topic of topics) doneSets.set(topic.id, studySessionsDone(state.sessions, topic.id))

  const placed = new Set<string>() // темы, у которых все сессии выполнены или уже стоят в очереди
  const remaining: Record<Subject, Topic[]> = { algebra: [], geometry: [], informatics: [] }
  const nextNo = new Map<string, number>()
  const started = new Set<string>()

  for (const topic of topics) {
    const done = doneSets.get(topic.id) ?? new Set<number>()
    if (done.size >= topic.sessionsTotal) {
      placed.add(topic.id)
      continue
    }
    let no = 1
    while (done.has(no)) no++
    nextNo.set(topic.id, no)
    if (done.size > 0) started.add(topic.id)
    remaining[topic.subject].push(topic)
  }

  const credits: Record<Subject, number> = { algebra: 0, geometry: 0, informatics: 0 }
  const queue: QueueEntry[] = []
  const daysToExam = diffDays(state.settings.examDate, today)
  let position = state.sessions.filter((record) => record.kind === "study").length

  const headOf = (subject: Subject): Topic | null => {
    const list = remaining[subject]
    const inProgress = list.find((topic) => started.has(topic.id))
    if (inProgress) return inProgress
    return list.find((topic) => topic.prerequisites.every((id) => placed.has(id))) ?? null
  }

  const limit = topics.reduce((sum, topic) => sum + topic.sessionsTotal, 0) + 5
  for (let guard = 0; guard < limit; guard++) {
    const heads: Partial<Record<Subject, Topic>> = {}
    for (const subject of ["algebra", "geometry", "informatics"] as Subject[]) {
      const head = headOf(subject)
      if (head) heads[subject] = head
    }
    const available = Object.keys(heads) as Subject[]
    if (!available.length) break

    const weights = weightsAt(position, daysToExam)
    let candidates = available.filter((subject) => weights[subject] > 0)
    if (!candidates.length) candidates = available

    const sum = candidates.reduce((acc, subject) => acc + weights[subject], 0) || candidates.length
    for (const subject of candidates) credits[subject] += weights[subject] || 1
    const pick = candidates.reduce((best, subject) => (credits[subject] > credits[best] ? subject : best), candidates[0])
    credits[pick] -= sum

    const topic = heads[pick]!
    const sessionNo = nextNo.get(topic.id) ?? 1
    queue.push({ topicId: topic.id, sessionNo, subject: pick, key: sessionKey(topic.id, sessionNo) })
    position++
    // пропустить уже выполненные номера (если пользователь делал сессии не по порядку)
    let following = sessionNo + 1
    const done = doneSets.get(topic.id) ?? new Set<number>()
    while (done.has(following)) following++
    if (following > topic.sessionsTotal) {
      placed.add(topic.id)
      started.delete(topic.id)
      remaining[pick] = remaining[pick].filter((item) => item.id !== topic.id)
    } else {
      nextNo.set(topic.id, following)
      started.add(topic.id)
    }
  }
  return queue
}

/* ───────────────── Построение плана ───────────────── */

const REVIEW_MINUTES = 20

export type Plan = {
  items: PlanItem[]
  byDate: Record<string, PlanItem[]>
  queue: QueueEntry[]
  /** дата, когда по текущему темпу закончатся учебные сессии */
  projectedEnd: string | null
}

function movedFromCount(state: AppState, date: string) {
  return state.moves.filter((move) => move.from === date).length
}

export function buildPlan(state: AppState, today: string, horizonDays = 900): Plan {
  const { settings } = state
  const items: PlanItem[] = []
  const queue = buildQueue(state, today)

  /* 1. Выполненное (история): сессии и повторения по реальным датам */
  for (const record of state.sessions) {
    const topic = topicById[record.topicId]
    if (!topic) continue
    items.push({
      key: record.kind === "study" ? sessionKey(record.topicId, record.sessionNo ?? 0) : reviewKey(record.reviewTaskId ?? record.id),
      date: record.date,
      kind: record.kind,
      title: record.kind === "study" ? `${topic.title} · сессия ${record.sessionNo}` : `Повтор: ${topic.title}`,
      topicId: record.topicId,
      sessionNo: record.sessionNo,
      reviewTaskId: record.reviewTaskId,
      minutes: record.minutes,
      done: true,
    })
  }

  /* 2. Будущие занятия */
  const pins = new Map<string, string>()
  const notBefore = new Map<string, string>()
  for (const move of state.moves) {
    if (move.to === "next") notBefore.set(move.key, addDays(move.from, 1))
    else pins.set(move.key, move.to)
  }

  const pending = queue.slice()
  const pendingReviews = state.reviews.filter((task) => !task.done).sort((a, b) => a.due.localeCompare(b.due))
  const doneTodayStudy = state.sessions.filter((record) => record.kind === "study" && record.date === today).length
  const doneTodayReviews = state.sessions.filter((record) => record.kind === "review" && record.date === today).length

  let lastStudyDate: string | null = null

  for (let offset = 0; offset <= horizonDays; offset++) {
    const date = addDays(today, offset)
    const type = dayType(date, settings)
    const isStudyDay = isStudyDayForIntensity(date, settings)
    const dayItems: PlanItem[] = []

    let studyCapacity = isStudyDay ? maxSessionsPerDay(settings) : 0
    let minutesLeft = dayCapacityMinutes(date, settings)
    if (offset === 0) {
      studyCapacity = Math.max(0, studyCapacity - doneTodayStudy)
      minutesLeft = Math.max(0, minutesLeft - items.filter((item) => item.date === today && item.done).reduce((sum, item) => sum + item.minutes, 0))
    }
    studyCapacity = Math.max(0, studyCapacity - movedFromCount(state, date))

    // 2a. занятия, закреплённые на эту дату (перенос на резервный день)
    if (type !== "rest") {
      for (let i = pending.length - 1; i >= 0; i--) {
        const entry = pending[i]
        if (pins.get(entry.key) === date && date >= today) {
          const topic = topicById[entry.topicId]
          pending.splice(i, 1)
          dayItems.push({
            key: entry.key,
            date,
            kind: "study",
            title: `${topic.title} · сессия ${entry.sessionNo}`,
            topicId: entry.topicId,
            sessionNo: entry.sessionNo,
            minutes: topic.estimatedMinutesPerSession,
            done: false,
            movedHere: true,
          })
          if (type === "study") studyCapacity = Math.max(0, studyCapacity - 1)
        }
      }
    }

    // 2b. повторения (на учебных днях, до двух за день)
    if (isStudyDay || (offset === 0 && type === "study")) {
      let reviewsToday = offset === 0 ? doneTodayReviews : 0
      for (let i = 0; i < pendingReviews.length && reviewsToday < 2; ) {
        const task = pendingReviews[i]
        if (task.due <= date && minutesLeft >= REVIEW_MINUTES) {
          pendingReviews.splice(i, 1)
          const topic = topicById[task.topicId]
          dayItems.push({
            key: reviewKey(task.id),
            date,
            kind: "review",
            title: `${task.label}: ${topic?.title ?? task.topicId}`,
            topicId: task.topicId,
            reviewTaskId: task.id,
            minutes: REVIEW_MINUTES,
            done: false,
          })
          minutesLeft -= REVIEW_MINUTES
          reviewsToday++
        } else i++
      }
    }

    // 2c. новые сессии по очереди маршрута
    if (isStudyDay) {
      let guard = 0
      while (studyCapacity > 0 && pending.length && guard++ < 6) {
        const index = pending.findIndex((entry) => {
          const nb = notBefore.get(entry.key)
          const pin = pins.get(entry.key)
          if (pin && pin > date) return false
          return !nb || nb <= date
        })
        if (index < 0) break
        const entry = pending[index]
        const topic = topicById[entry.topicId]
        const isSecondShort = dayItems.some((item) => item.kind === "study")
        const minutes = isSecondShort ? Math.min(30, topic.estimatedMinutesPerSession) : topic.estimatedMinutesPerSession
        if (minutesLeft > 0 && minutes > minutesLeft && dayItems.some((item) => item.kind === "study")) break
        pending.splice(index, 1)
        dayItems.push({
          key: entry.key,
          date,
          kind: "study",
          title: `${topic.title} · сессия ${entry.sessionNo}`,
          topicId: entry.topicId,
          sessionNo: entry.sessionNo,
          minutes,
          done: false,
        })
        minutesLeft -= minutes
        studyCapacity--
        lastStudyDate = date
      }
    }

    // 2d. служебные дни
    if (!dayItems.some((item) => item.kind === "study" || item.kind === "review")) {
      if (type === "rest") dayItems.push({ key: `rest:${date}`, date, kind: "rest", title: "Полный отдых", minutes: 0, done: false })
      else if (type === "reserve") dayItems.push({ key: `reserve:${date}`, date, kind: "reserve", title: "Резервный день", minutes: 0, done: false })
    }

    items.push(...dayItems)
    if (!pending.length && !pendingReviews.length && offset > 30) break
  }

  /* 3. Пробники: пользовательские и предлагаемые перед экзаменом */
  for (const mock of state.mocks) {
    items.push({ key: `mockdone:${mock.id}`, date: mock.date, kind: "mock", title: `Пробник: ${mock.score} баллов`, minutes: mock.minutes, done: true })
  }
  const daysToExam = diffDays(settings.examDate, today)
  if (daysToExam > 0 && daysToExam <= 90) {
    for (let weeks = 2; weeks <= 12; weeks += 2) {
      let date = addDays(settings.examDate, -weeks * 7)
      while (date > today && dayType(date, settings) !== "study") date = addDays(date, -1)
      if (date > today) items.push({ key: `mock:${date}`, date, kind: "mock", title: "Пробный ЕНТ (по плану)", minutes: 180, done: false, suggested: true })
    }
  }

  const byDate: Record<string, PlanItem[]> = {}
  for (const item of items) (byDate[item.date] ??= []).push(item)
  const order: Record<string, number> = { study: 0, review: 1, mock: 2, reserve: 3, rest: 4 }
  for (const list of Object.values(byDate)) list.sort((a, b) => Number(b.done) - Number(a.done) || order[a.kind] - order[b.kind])

  return { items, byDate, queue, projectedEnd: pending.length ? null : lastStudyDate }
}

/* ───────────────── Повторения ───────────────── */

export function makeReviewTasks(topic: Topic, fromDate: string, source: ReviewTask["source"], idSeed: string): ReviewTask[] {
  return topic.reviewDays.map((days, index) => ({
    id: `${idSeed}-${topic.id}-${index + 1}`,
    topicId: topic.id,
    due: addDays(fromDate, days),
    stage: index + 1,
    label: "Повтор",
    done: false,
    source,
  }))
}

export function makeFixTask(topic: Topic, due: string, source: ReviewTask["source"], idSeed: string): ReviewTask {
  return { id: `${idSeed}-${topic.id}-fix`, topicId: topic.id, due, stage: 0, label: "Разбор ошибок", done: false, source }
}

/* ───────────────── Серия дней ───────────────── */

export function computeStreak(state: AppState, today: string) {
  const days = new Set(state.sessions.map((record) => record.date))
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  for (let i = 0; i < 400; i++) {
    if (days.has(cursor)) streak++
    else if (isStudyDayForIntensity(cursor, state.settings)) break
    cursor = addDays(cursor, -1)
  }
  return streak
}
