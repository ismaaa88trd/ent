"use client"

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react"
import { topicById, topicsOfModule } from "@/lib/curriculum"
import { addDays, diffDays, startOfWeek, toIso } from "@/lib/dates"
import {
  allProgress,
  buildPlan,
  computeStreak,
  dayType,
  makeFixTask,
  makeReviewTasks,
  reviewKey,
  sessionKey,
  studySessionsDone,
  type Plan,
  type TopicProgress,
} from "@/lib/planner"
import type { ActiveFocus, AppState, ImportantDate, MockResult, Settings } from "@/lib/types"

export const STORAGE_KEY = "ent-marshrut:v2"
const LEGACY_KEY = "ent-marshrut:v1"

export const defaultSettings: Settings = {
  examDate: "2027-06-01",
  weekdayHours: 1.5,
  weekendHours: 3,
  restDays: [0],
  reserveDay: 6,
  intensity: "normal",
  focusMinutes: 45,
  registrationUrl: "https://app.testcenter.kz",
}

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)

/** Чистый старт: прогресса нет, всё начинается с первой темы маршрута. */
export function createSeed(_today?: string): AppState {
  return {
    version: 1,
    settings: { ...defaultSettings },
    topicNotes: {},
    sessions: [],
    reviews: [],
    moves: [],
    mocks: [],
    importantDates: [{ id: "seed-reg", label: "Регистрация на ЕНТ", detail: "Сроки нужно проверить на официальном сайте НЦТ", needsCheck: true }],
    focus: null,
  }
}

/* ───────────────── Редьюсер ───────────────── */

type FinishOutcome = "understood" | "errors" | "postpone"

type Action =
  | { type: "load"; state: AppState }
  | { type: "reset"; today: string }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "note"; topicId: string; note: string }
  | { type: "focus/start"; focus: ActiveFocus }
  | { type: "focus/toggle"; now: number }
  | { type: "focus/step"; index: number }
  | { type: "focus/stuck"; text: string }
  | { type: "focus/minutes"; minutes: number }
  | { type: "focus/cancel" }
  | { type: "finish"; today: string; now: number; outcome: FinishOutcome; target: FinishTarget; elapsedMinutes?: number; stuck?: string }
  | { type: "move"; today: string; key: string; from: string; mode: "reserve" | "next" }
  | { type: "undoMove"; key: string }
  | { type: "mock/add"; mock: MockResult }
  | { type: "mock/remove"; id: string }
  | { type: "reviews/addFor"; topicIds: string[]; today: string; source: "mock" | "manual" }
  | { type: "date/add"; item: ImportantDate }
  | { type: "date/remove"; id: string }

export type FinishTarget = {
  itemKey: string
  topicId: string
  kind: "study" | "review"
  sessionNo?: number
  reviewTaskId?: string
  plannedMinutes: number
}

function nextReserveDate(state: AppState, today: string) {
  for (let i = 1; i < 21; i++) {
    const date = addDays(today, i)
    if (dayType(date, state.settings) === "reserve") return date
  }
  return addDays(today, 1)
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "load":
      return action.state
    case "reset":
      return createSeed(action.today)
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case "note": {
      const current = state.topicNotes[action.topicId] ?? { note: "", needsReview: false }
      return { ...state, topicNotes: { ...state.topicNotes, [action.topicId]: { ...current, note: action.note } } }
    }
    case "focus/start":
      return { ...state, focus: action.focus }
    case "focus/toggle": {
      if (!state.focus) return state
      const f = state.focus
      if (f.running) return { ...state, focus: { ...f, running: false, accumulatedMs: f.accumulatedMs + (action.now - f.startedAt) } }
      return { ...state, focus: { ...f, running: true, startedAt: action.now } }
    }
    case "focus/step": {
      if (!state.focus) return state
      const stepsDone = state.focus.stepsDone.map((value, index) => (index === action.index ? !value : value))
      return { ...state, focus: { ...state.focus, stepsDone } }
    }
    case "focus/stuck":
      return state.focus ? { ...state, focus: { ...state.focus, stuck: action.text } } : state
    case "focus/minutes":
      return state.focus ? { ...state, focus: { ...state.focus, plannedMinutes: action.minutes } } : state
    case "focus/cancel":
      return { ...state, focus: null }

    case "finish": {
      const { target, outcome, today } = action
      const topic = topicById[target.topicId]
      if (!topic) return { ...state, focus: null }

      if (outcome === "postpone") {
        const moves = state.moves.filter((move) => move.key !== target.itemKey)
        if (target.kind === "review" && target.reviewTaskId) {
          const reviews = state.reviews.map((task) => (task.id === target.reviewTaskId ? { ...task, due: addDays(today, 1) } : task))
          return { ...state, reviews, focus: null }
        }
        return { ...state, moves: [...moves, { key: target.itemKey, from: today, to: "next", at: today }], focus: null }
      }

      const minutes = Math.max(1, Math.round(action.elapsedMinutes ?? target.plannedMinutes))
      const record = {
        id: uid(),
        date: today,
        topicId: target.topicId,
        kind: target.kind,
        sessionNo: target.sessionNo,
        reviewTaskId: target.reviewTaskId,
        minutes,
        outcome,
        stuck: action.stuck?.trim() || undefined,
      } as const
      let sessions = [...state.sessions, record]
      let reviews = [...state.reviews]
      const notes = { ...state.topicNotes }
      const current = notes[topic.id] ?? { note: "", needsReview: false }
      const hasPendingFix = () => reviews.some((task) => task.topicId === topic.id && task.stage === 0 && !task.done)

      if (target.kind === "review" && target.reviewTaskId) {
        const task = reviews.find((item) => item.id === target.reviewTaskId)
        reviews = reviews.map((item) => (item.id === target.reviewTaskId ? { ...item, done: true, doneDate: today } : item))
        if (outcome === "understood") {
          // флаг «нужен повтор» снимается, когда не осталось невыполненных разборов ошибок
          const fixPending = reviews.some((item) => item.topicId === topic.id && item.stage === 0 && !item.done)
          notes[topic.id] = { ...current, needsReview: fixPending }
        } else {
          notes[topic.id] = { ...current, needsReview: true }
          if (!hasPendingFix()) reviews.push(makeFixTask(topic, addDays(today, 2), "session", uid()))
        }
      } else {
        const done = studySessionsDone(sessions, topic.id)
        const finishedTopic = done.size >= topic.sessionsTotal
        if (outcome === "errors") {
          notes[topic.id] = { ...current, needsReview: true }
          if (!hasPendingFix()) reviews.push(makeFixTask(topic, addDays(today, 1), "session", uid()))
        }
        const hasChain = reviews.some((task) => task.topicId === topic.id && task.stage > 0 && !task.done)
        if (finishedTopic && !hasChain && !reviews.some((task) => task.topicId === topic.id && task.stage > 0 && task.done)) {
          reviews.push(...makeReviewTasks(topic, today, "session", uid()))
        }
      }
      return { ...state, sessions, reviews, topicNotes: notes, moves: state.moves, focus: null }
    }

    case "move": {
      const { key, from, mode, today } = action
      if (key.startsWith("review:")) {
        const taskId = key.slice("review:".length)
        const base = from > today ? from : today
        return { ...state, reviews: state.reviews.map((task) => (task.id === taskId ? { ...task, due: addDays(base, 1) } : task)) }
      }
      const moves = state.moves.filter((move) => move.key !== key)
      const to = mode === "reserve" ? nextReserveDate(state, from > today ? from : today) : "next"
      return { ...state, moves: [...moves, { key, from, to, at: today }] }
    }
    case "undoMove":
      return { ...state, moves: state.moves.filter((move) => move.key !== action.key) }

    case "mock/add":
      return { ...state, mocks: [...state.mocks, action.mock].sort((a, b) => a.date.localeCompare(b.date)) }
    case "mock/remove":
      return { ...state, mocks: state.mocks.filter((mock) => mock.id !== action.id) }

    case "reviews/addFor": {
      const reviews = [...state.reviews]
      const notes = { ...state.topicNotes }
      action.topicIds.forEach((topicId, index) => {
        const topic = topicById[topicId]
        if (!topic) return
        if (reviews.some((task) => task.topicId === topicId && task.stage === 0 && !task.done)) return
        const task = makeFixTask(topic, addDays(action.today, 1 + Math.floor(index / 2)), action.source, uid())
        reviews.push({ ...task, label: action.source === "mock" ? "Повтор по пробнику" : "Повтор" })
        notes[topicId] = { ...(notes[topicId] ?? { note: "" }), needsReview: true }
      })
      return { ...state, reviews, topicNotes: notes }
    }

    case "date/add":
      return { ...state, importantDates: [...state.importantDates, action.item] }
    case "date/remove":
      return { ...state, importantDates: state.importantDates.filter((item) => item.id !== action.id) }
  }
}

/* ───────────────── Контекст ───────────────── */

type Stats = {
  focusMinutesTotal: number
  focusMinutesWeek: number
  sessionsDoneTotal: number
  sessionsDoneWeek: number
  plannedThisWeek: number
  doneThisWeek: number
  reviewTopics: number
}

export type SyncStatus = "loading" | "saved" | "saving" | "offline"

type AppContextValue = {
  state: AppState
  today: string
  plan: Plan
  progress: Record<string, TopicProgress>
  streak: number
  daysToExam: number
  stats: Stats
  updateSettings: (patch: Partial<Settings>) => void
  setNote: (topicId: string, note: string) => void
  startFocus: (target: FinishTarget) => void
  toggleFocus: () => void
  toggleStep: (index: number) => void
  setStuck: (text: string) => void
  setFocusMinutes: (minutes: number) => void
  cancelFocus: () => void
  finish: (outcome: FinishOutcome, target: FinishTarget, opts?: { elapsedMinutes?: number; stuck?: string }) => void
  moveItem: (key: string, from: string, mode: "reserve" | "next") => void
  undoMove: (key: string) => void
  addMock: (mock: Omit<MockResult, "id">) => MockResult
  removeMock: (id: string) => void
  addReviewsFor: (topicIds: string[], source: "mock" | "manual") => void
  addImportantDate: (item: Omit<ImportantDate, "id">) => void
  removeImportantDate: (id: string) => void
  resetDemo: () => void
  importState: (state: AppState) => boolean
  syncStatus: SyncStatus
  celebrateTick: number
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error("useApp должен вызываться внутри AppProvider")
  return value
}

function isValidState(value: unknown): value is AppState {
  const v = value as AppState
  return Boolean(v) && v.version === 1 && Boolean(v.settings) && Array.isArray(v.sessions) && Array.isArray(v.reviews)
}

function normalize(parsed: AppState): AppState {
  return { ...createSeed(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } }
}

function loadLocal(): AppState | null {
  try {
    window.localStorage.removeItem(LEGACY_KEY) // старая версия содержала демо-прогресс
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isValidState(parsed)) return normalize(parsed)
    }
  } catch {
    /* повреждённые данные */
  }
  return null
}

async function fetchServer(): Promise<{ ok: boolean; state: AppState | null }> {
  try {
    const response = await fetch("/api/state", { cache: "no-store" })
    if (!response.ok) return { ok: false, state: null }
    const json = await response.json()
    return { ok: true, state: isValidState(json.state) ? normalize(json.state) : null }
  } catch {
    return { ok: false, state: null }
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => toIso(new Date()))
  const [ready, setReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading")
  const [celebrateTick, setCelebrateTick] = useState(0)
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, () => createSeed())
  const loadedRef = useRef<AppState | null>(null)
  const serverOk = useRef(false)
  const pendingRef = useRef<AppState | null>(null)
  const timerRef = useRef<number | null>(null)

  async function push(payload: AppState, keepalive = false) {
    try {
      const response = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive })
      serverOk.current = response.ok
      setSyncStatus(response.ok ? "saved" : "offline")
    } catch {
      serverOk.current = false
      setSyncStatus("offline")
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const now = toIso(new Date())
      const local = loadLocal()
      const server = await fetchServer()
      if (cancelled) return
      serverOk.current = server.ok
      const useServer = Boolean(server.state) && (server.state!.updatedAt ?? 0) >= (local?.updatedAt ?? 0)
      const chosen = useServer ? server.state! : local ?? createSeed()
      loadedRef.current = chosen
      setToday(now)
      dispatch({ type: "load", state: chosen })
      setSyncStatus(server.ok ? "saved" : "offline")
      setReady(true)
      if (server.ok && !useServer && local) void push(local)
    })()
    const timer = window.setInterval(() => setToday((prev) => (toIso(new Date()) !== prev ? toIso(new Date()) : prev)), 60_000)
    const flush = () => {
      if (pendingRef.current) void push(pendingRef.current, true)
    }
    window.addEventListener("pagehide", flush)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener("pagehide", flush)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready || state === loadedRef.current) return
    const stamped: AppState = { ...state, updatedAt: Date.now() }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped))
    } catch {
      /* хранилище недоступно */
    }
    pendingRef.current = stamped
    setSyncStatus((prev) => (prev === "offline" ? prev : "saving"))
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      pendingRef.current = null
      void push(stamped)
    }, 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready])

  const plan = useMemo(() => buildPlan(state, today), [state, today])
  const progress = useMemo(() => allProgress(state), [state])
  const streak = useMemo(() => computeStreak(state, today), [state, today])
  const daysToExam = diffDays(state.settings.examDate, today)

  const stats = useMemo<Stats>(() => {
    const weekStart = startOfWeek(today)
    const weekEnd = addDays(weekStart, 6)
    const inWeek = (date: string) => date >= weekStart && date <= weekEnd
    const weekItems = plan.items.filter((item) => inWeek(item.date) && (item.kind === "study" || item.kind === "review"))
    return {
      focusMinutesTotal: state.sessions.reduce((sum, record) => sum + record.minutes, 0),
      focusMinutesWeek: state.sessions.filter((record) => inWeek(record.date)).reduce((sum, record) => sum + record.minutes, 0),
      sessionsDoneTotal: state.sessions.filter((record) => record.kind === "study").length,
      sessionsDoneWeek: state.sessions.filter((record) => inWeek(record.date) && record.kind === "study").length,
      plannedThisWeek: weekItems.length,
      doneThisWeek: weekItems.filter((item) => item.done).length,
      reviewTopics: Object.values(progress).filter((item) => item.status === "needs_review").length,
    }
  }, [plan, state.sessions, today, progress])

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      today,
      plan,
      progress,
      streak,
      daysToExam,
      stats,
      updateSettings: (patch) => dispatch({ type: "settings", patch }),
      setNote: (topicId, note) => dispatch({ type: "note", topicId, note }),
      startFocus: (target) =>
        dispatch({
          type: "focus/start",
          focus: {
            itemKey: target.itemKey,
            topicId: target.topicId,
            kind: target.kind,
            sessionNo: target.sessionNo,
            reviewTaskId: target.reviewTaskId,
            plannedMinutes: state.settings.focusMinutes,
            startedAt: Date.now(),
            accumulatedMs: 0,
            running: true,
            stepsDone: [false, false, false],
            stuck: "",
          },
        }),
      toggleFocus: () => dispatch({ type: "focus/toggle", now: Date.now() }),
      toggleStep: (index) => dispatch({ type: "focus/step", index }),
      setStuck: (text) => dispatch({ type: "focus/stuck", text }),
      setFocusMinutes: (minutes) => {
        dispatch({ type: "focus/minutes", minutes })
        dispatch({ type: "settings", patch: { focusMinutes: minutes as Settings["focusMinutes"] } })
      },
      cancelFocus: () => dispatch({ type: "focus/cancel" }),
      finish: (outcome, target, opts) => {
        dispatch({ type: "finish", outcome, target, today, now: Date.now(), elapsedMinutes: opts?.elapsedMinutes, stuck: opts?.stuck })
        if (outcome === "understood") setCelebrateTick((n) => n + 1)
      },
      moveItem: (key, from, mode) => dispatch({ type: "move", key, from, mode, today }),
      undoMove: (key) => dispatch({ type: "undoMove", key }),
      addMock: (mock) => {
        const full = { ...mock, id: uid() }
        dispatch({ type: "mock/add", mock: full })
        return full
      },
      removeMock: (id) => dispatch({ type: "mock/remove", id }),
      addReviewsFor: (topicIds, source) => dispatch({ type: "reviews/addFor", topicIds, today, source }),
      addImportantDate: (item) => dispatch({ type: "date/add", item: { ...item, id: uid() } }),
      removeImportantDate: (id) => dispatch({ type: "date/remove", id }),
      resetDemo: () => dispatch({ type: "reset", today }),
      importState: (incoming) => {
        if (!isValidState(incoming)) return false
        dispatch({ type: "load", state: normalize(incoming) })
        return true
      },
      syncStatus,
      celebrateTick,
    }),
    [state, today, plan, progress, streak, daysToExam, stats, syncStatus, celebrateTick],
  )

  if (!ready) return <div className="min-h-screen bg-background" aria-busy="true" />
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/* ───────────────── Вспомогательные функции ───────────────── */

/** Какие темы предложить на повторение по выбранным слабым модулям: только уже начатые. */
export function suggestReviewTopics(moduleIds: string[], progress: Record<string, TopicProgress>) {
  const result: string[] = []
  for (const moduleId of moduleIds) {
    for (const topic of topicsOfModule(moduleId)) {
      if ((progress[topic.id]?.sessionsDone ?? 0) > 0) result.push(topic.id)
    }
  }
  return result
}

export { sessionKey, reviewKey }
