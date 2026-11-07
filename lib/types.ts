export type Subject = "algebra" | "geometry" | "informatics"
export type Priority = "foundation" | "high" | "normal"
export type TopicStatus = "not_started" | "in_progress" | "needs_review" | "mastered"

export type Topic = {
  id: string
  subject: Subject
  moduleId: string
  title: string
  description: string
  prerequisites: string[]
  sessionsTotal: number
  estimatedMinutesPerSession: number
  practiceTarget: number
  priority: Priority
  reviewDays: number[]
  bilimqorUrl?: string
  officialSourceUrl?: string
  defaultStatus: TopicStatus
  /** Названия сессий (необязательно). Если не заданы — генерируются. */
  sessionTitles?: string[]
}

export type StudyModule = {
  id: string
  subject: Subject
  order: number
  title: string
  description: string
  specSection?: string
}

export type Intensity = "light" | "normal" | "intense"

export type Settings = {
  examDate: string
  weekdayHours: number
  weekendHours: number
  /** 0 = воскресенье … 6 = суббота */
  restDays: number[]
  reserveDay: number
  intensity: Intensity
  focusMinutes: 25 | 45 | 60
  registrationUrl: string
}

export type TopicNote = { note: string; needsReview: boolean }

export type SessionRecord = {
  id: string
  date: string
  topicId: string
  kind: "study" | "review"
  sessionNo?: number
  reviewTaskId?: string
  minutes: number
  outcome: "understood" | "errors"
  stuck?: string
}

export type ReviewTask = {
  id: string
  topicId: string
  due: string
  /** 0 = разбор ошибок, 1..n — интервальные повторения */
  stage: number
  label: string
  done: boolean
  doneDate?: string
  source: "session" | "mock" | "manual"
}

export type Move = { key: string; from: string; to: string | "next"; at: string }

export type MockResult = {
  id: string
  date: string
  score: number
  minutes: number
  comment: string
  weakModuleIds: string[]
}

export type ImportantDate = { id: string; label: string; date?: string; detail?: string; needsCheck: boolean }

export type ActiveFocus = {
  itemKey: string
  topicId: string
  kind: "study" | "review"
  sessionNo?: number
  reviewTaskId?: string
  plannedMinutes: number
  startedAt: number
  accumulatedMs: number
  running: boolean
  stepsDone: boolean[]
  stuck: string
}

export type AppState = {
  version: 1
  /** время последнего сохранения (мс), нужно для синхронизации браузера и сервера */
  updatedAt?: number
  settings: Settings
  topicNotes: Record<string, TopicNote>
  sessions: SessionRecord[]
  reviews: ReviewTask[]
  moves: Move[]
  mocks: MockResult[]
  importantDates: ImportantDate[]
  focus: ActiveFocus | null
}

export type PlanItemKind = "study" | "review" | "mock" | "reserve" | "rest"

export type PlanItem = {
  /** Уникальный ключ элемента плана */
  key: string
  date: string
  kind: PlanItemKind
  title: string
  topicId?: string
  sessionNo?: number
  reviewTaskId?: string
  minutes: number
  done: boolean
  /** занятие перенесено сюда с другого дня */
  movedHere?: boolean
  suggested?: boolean
}
