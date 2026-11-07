"use client"

import { ArrowLeft, ArrowRight, BookOpen, Check, Circle, ExternalLink, FileText, MoveRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { EmptyHint, Panel, PageHeading, PriorityBadge, TopicStatusBadge } from "@/components/ent/common"
import { isHardTopic, moduleById, sessionTitle, subjects, tasksPerSession, topicById } from "@/lib/curriculum"
import { formatShort, relativeLabel } from "@/lib/dates"
import { reviewKey, sessionKey, studySessionsDone } from "@/lib/planner"
import { useApp, type FinishTarget } from "@/lib/store"
import type { Topic } from "@/lib/types"

export function TopicScreen({
  topic,
  onBack,
  onStartFocus,
  onOpenTopic,
}: {
  topic: Topic
  onBack: () => void
  onStartFocus: (target?: FinishTarget) => void
  onOpenTopic: (topicId: string) => void
}) {
  const { state, today, plan, progress, setNote } = useApp()
  const info = progress[topic.id]
  const done = studySessionsDone(state.sessions, topic.id)
  const firstOpen = Array.from({ length: topic.sessionsTotal }, (_, i) => i + 1).find((no) => !done.has(no))
  const module = moduleById[topic.moduleId]
  const subject = subjects.find((item) => item.id === topic.subject)?.shortLabel ?? "Предмет"
  const hard = isHardTopic(topic)
  const reviews = state.reviews.filter((task) => task.topicId === topic.id).sort((a, b) => a.due.localeCompare(b.due))
  const nextReview = reviews.find((task) => !task.done)
  const history = state.sessions.filter((record) => record.topicId === topic.id).slice().reverse()
  const note = state.topicNotes[topic.id]?.note ?? ""

  const difficulty = topic.priority === "foundation" ? "Базовый уровень" : hard ? "Сложная тема — нужно больше времени" : "Средний уровень"

  const startSession = (no: number) =>
    onStartFocus({ itemKey: sessionKey(topic.id, no), topicId: topic.id, kind: "study", sessionNo: no, plannedMinutes: state.settings.focusMinutes })

  return (
    <div className="flex flex-col gap-6">
      <Button type="button" variant="ghost" onClick={onBack} className="-ml-2 h-8 w-fit rounded-lg px-2 text-xs text-muted-foreground">
        <ArrowLeft data-icon="inline-start" />
        Назад к маршруту
      </Button>

      <PageHeading
        eyebrow={`${subject} · МОДУЛЬ ${String(module?.order ?? 1).padStart(2, "0")} · ${module?.title ?? ""}`.toUpperCase()}
        title={topic.title}
        description={topic.description}
        action={<div className="flex flex-wrap items-center gap-2"><PriorityBadge priority={topic.priority} /><TopicStatusBadge status={info?.status ?? "not_started"} /></div>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-slate-900/[0.02]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Уровень</p>
          <p className="mt-2 text-sm font-semibold">{difficulty}</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{topic.sessionsTotal} сессий · около {topic.estimatedMinutesPerSession} минут каждая</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-slate-900/[0.02]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Практика</p>
          <p className="mt-2 text-sm font-semibold">Минимум {topic.practiceTarget} задач</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Примерно {tasksPerSession(topic)} задач на сессию</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-slate-900/[0.02]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Повторение</p>
          <p className="mt-2 text-sm font-semibold">Через {topic.reviewDays.join(" · ")} дня</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Прогресс темы: {info?.percent ?? 0}%</p>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Сессии по теме" description="Каждая сессия — один небольшой и понятный шаг.">
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: topic.sessionsTotal }, (_, index) => index + 1).map((no) => {
                const isDone = done.has(no)
                const isCurrent = no === firstOpen
                const planned = plan.items.find((item) => item.key === sessionKey(topic.id, no) && !item.done)
                const moved = state.moves.some((move) => move.key === sessionKey(topic.id, no))
                const Icon = isDone ? Check : isCurrent ? Circle : Circle
                return (
                  <div key={no} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 sm:flex-nowrap ${isCurrent ? "border-primary/20 bg-primary/[0.035]" : "border-border/70 bg-background"}`}>
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isDone ? "bg-success/10 text-success" : isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon aria-hidden="true" className={`size-4 ${isCurrent ? "fill-current" : ""}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">Сессия {no} <span className="font-normal text-muted-foreground">· {sessionTitle(topic, no)}</span></p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {topic.estimatedMinutesPerSession} минут · {tasksPerSession(topic)} задач
                        {planned ? ` · в плане: ${relativeLabel(planned.date, today) === relativeLabel(planned.date, "1900-01-01") ? formatShort(planned.date) : relativeLabel(planned.date, today)}${moved ? " (перенесено)" : ""}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium ${isDone ? "text-success" : isCurrent ? "text-primary" : "text-muted-foreground"}`}>{isDone ? "Завершена" : isCurrent ? "Следующая" : "В плане"}</span>
                    {isCurrent ? (
                      <Button type="button" size="sm" onClick={() => startSession(no)} className="w-full rounded-lg sm:w-auto">
                        Начать
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Повторения" description="Интервалы 2 · 7 · 21 день создаются автоматически после последней сессии темы.">
            {reviews.length ? (
              <div className="flex flex-col gap-2">
                {reviews.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-2.5">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${task.done ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {task.done ? <Check aria-hidden="true" className="size-3.5" /> : <RotateCcw aria-hidden="true" className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{task.label}{task.stage > 0 ? ` · +${topic.reviewDays[task.stage - 1] ?? ""} дн.` : ""}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{task.done ? `Выполнено ${formatShort(task.doneDate ?? task.due)}` : `Срок: ${formatShort(task.due)}`}</span>
                    </span>
                    {task.id === nextReview?.id ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => onStartFocus({ itemKey: reviewKey(task.id), topicId: topic.id, kind: "review", reviewTaskId: task.id, plannedMinutes: Math.min(state.settings.focusMinutes, 25) })}>
                        Повторить сейчас
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyHint>Повторений пока нет. Они появятся после завершения всех сессий темы — или раньше, если вернуть тему из-за ошибок.</EmptyHint>
            )}
          </Panel>

          <Panel title="Что нужно уметь" description="Критерий, по которому удобно проверить себя после практики.">
            <div className="flex gap-3 rounded-xl bg-muted/55 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-sm"><Check aria-hidden="true" className="size-4" /></span>
              <p className="text-sm leading-6 text-foreground">Решать задачи по теме «{topic.title}» без подсказок и объяснять каждый шаг. {topic.description}</p>
            </div>
          </Panel>

          {history.length ? (
            <Panel title="История занятий" description="Что уже сделано по этой теме.">
              <div className="flex flex-col divide-y divide-border/70">
                {history.slice(0, 8).map((record) => (
                  <div key={record.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${record.outcome === "understood" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {record.outcome === "understood" ? <Check aria-hidden="true" className="size-3" /> : <RotateCcw aria-hidden="true" className="size-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{record.kind === "study" ? `Сессия ${record.sessionNo}` : "Повторение"} · {formatShort(record.date)} · {record.minutes} мин</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{record.outcome === "understood" ? "Понял" : "Были ошибки — тема на повторе"}{record.stuck ? ` · «${record.stuck}»` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="flex flex-col gap-5">
          {topic.bilimqorUrl ? (
            <Button asChild className="h-10 justify-between rounded-xl px-4">
              <a href={topic.bilimqorUrl} target="_blank" rel="noreferrer">
                Открыть тренировку
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          ) : null}

          <Panel title="Перед началом" description="Проверь, что предыдущие темы не требуют повтора.">
            {topic.prerequisites.length ? (
              <div className="flex flex-col gap-2">
                {topic.prerequisites.map((prerequisiteId) => {
                  const prerequisite = topicById[prerequisiteId]
                  if (!prerequisite) return null
                  const p = progress[prerequisiteId]
                  const finished = (p?.sessionsDone ?? 0) >= prerequisite.sessionsTotal
                  return (
                    <button key={prerequisiteId} type="button" onClick={() => onOpenTopic(prerequisiteId)} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-left transition-colors hover:border-primary/20 hover:bg-primary/[0.025]">
                      <span className="flex min-w-0 items-center gap-2">
                        {finished ? <Check aria-hidden="true" className="size-3.5 shrink-0 text-success" /> : <Circle aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />}
                        <span className="truncate text-xs font-medium">{prerequisite.title}</span>
                      </span>
                      <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })}
                {topic.prerequisites.some((id) => (progress[id]?.sessionsDone ?? 0) < (topicById[id]?.sessionsTotal ?? 0)) ? (
                  <p className="px-1 text-[10px] leading-4 text-muted-foreground">Не все предыдущие темы пройдены. Можно начать, но спокойнее сначала закончить базу.</p>
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl bg-success/[0.06] px-3.5 py-3 text-xs leading-5 text-muted-foreground">Это базовая тема — можно начинать без подготовки.</p>
            )}
          </Panel>

          <Panel title="Моя заметка" action={<FileText aria-hidden="true" className="size-4 text-muted-foreground" />}>
            <FieldGroup className="gap-2">
              <Field>
                <FieldLabel htmlFor="topic-note" className="sr-only">Заметка по теме</FieldLabel>
                <Textarea id="topic-note" value={note} onChange={(event) => setNote(topic.id, event.target.value)} placeholder="Что важно не забыть?" className="min-h-24 resize-y rounded-xl border-border/80 bg-background text-xs leading-5 shadow-none" />
              </Field>
            </FieldGroup>
            <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Сохраняется автоматически в этом браузере.</p>
          </Panel>

          <Panel title="Источники">
            <div className="flex flex-col gap-2 text-[11px] leading-5 text-muted-foreground">
              <a href={topic.officialSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline"><BookOpen aria-hidden="true" className="size-3.5" />Спецификация НЦТ (PDF)<ExternalLink aria-hidden="true" className="size-3" /></a>
              <p>Практика — на Bilimqor, задания и разборы там. Здесь хранятся только ссылки и ваш прогресс.</p>
            </div>
          </Panel>
          {state.moves.some((move) => move.key.startsWith(`study:${topic.id}:`)) ? (
            <p className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground"><MoveRight aria-hidden="true" className="size-3.5" />Часть сессий перенесена — план уже пересчитан.</p>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
