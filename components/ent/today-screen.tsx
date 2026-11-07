"use client"

import { useMemo, useState } from "react"
import { ArrowRight, BookOpen, CalendarDays, Check, Clock3, ExternalLink, Flame, MoveRight, Play, RotateCcw, TriangleAlert, Undo2 } from "lucide-react"
import { RouteOrb } from "@/components/ent/visuals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyHint, Panel, PageHeading, TopicStatusBadge } from "@/components/ent/common"
import { MoveDialog, ResultDialog, targetFromItem } from "@/components/ent/dialogs"
import { moduleById, sessionOutcome, sessionTitle, subjects, topicById, topicsOfSubject } from "@/lib/curriculum"
import { addDays, dayNumber, formatDayMonth, formatLong, formatShort, pluralize, relativeLabel, startOfWeek, weekdayShortLabel } from "@/lib/dates"
import { useApp, type FinishTarget } from "@/lib/store"
import type { PlanItem } from "@/lib/types"

type NavigationScreen = "today" | "route" | "calendar" | "exams" | "settings"

function hoursLabel(minutes: number) {
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`
}

export function TodayScreen({
  onOpenTopic,
  onStartFocus,
  onNavigate,
}: {
  onOpenTopic: (topicId: string) => void
  onStartFocus: (target?: FinishTarget) => void
  onNavigate: (screen: NavigationScreen) => void
}) {
  const { state, today, plan, progress, streak, stats, daysToExam, undoMove } = useApp()
  const [moveItem, setMoveItem] = useState<PlanItem | null>(null)
  const [resultTarget, setResultTarget] = useState<FinishTarget | null>(null)

  const todayItems = plan.byDate[today] ?? []
  const current = todayItems.find((item) => !item.done && item.kind === "study") ?? todayItems.find((item) => !item.done && item.kind === "review")
  const doneToday = todayItems.filter((item) => item.done)
  const currentTopic = current?.topicId ? topicById[current.topicId] : undefined
  const focus = state.focus
  const focusIsCurrent = Boolean(focus && current && focus.itemKey === current.key)

  const movedToday = state.moves.find((move) => move.from === today && !state.sessions.some((record) => record.date === today && record.kind === "study" && `study:${record.topicId}:${record.sessionNo}` === move.key))
  const movedTopic = movedToday ? topicById[movedToday.key.split(":")[1]] : undefined

  const orbRings = (["algebra", "geometry", "informatics"] as const).map((id) => {
    const list = topicsOfSubject(id)
    return {
      label: id,
      total: list.reduce((sum, t) => sum + t.sessionsTotal, 0),
      done: list.reduce((sum, t) => sum + Math.min(progress[t.id]?.sessionsDone ?? 0, t.sessionsTotal), 0),
    }
  })

  const weekStart = startOfWeek(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const nextSteps = useMemo(() => {
    const seen = new Set<string>()
    const result: PlanItem[] = []
    for (const item of plan.items.filter((entry) => entry.kind === "study" && !entry.done && entry.date >= today).sort((a, b) => a.date.localeCompare(b.date))) {
      if (current && item.key === current.key) continue
      if (seen.has(item.topicId ?? "")) continue
      seen.add(item.topicId ?? "")
      result.push(item)
      if (result.length === 3) break
    }
    return result
  }, [plan, today, current])

  const reviewQueue = state.reviews
    .filter((task) => !task.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4)

  const lastSessionWithNote = [...state.sessions].reverse().find((record) => record.stuck || record.outcome === "errors")
  const lastMock = state.mocks[state.mocks.length - 1]
  const nextMock = plan.items.filter((item) => item.kind === "mock" && !item.done && item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]

  const startTarget = current ? targetFromItem(current, state.settings.focusMinutes) : null
  const subjectLabel = currentTopic ? subjects.find((item) => item.id === currentTopic.subject)?.shortLabel : undefined
  const moduleInfo = currentTopic ? moduleById[currentTopic.moduleId] : undefined
  const topicProgress = currentTopic ? progress[currentTopic.id] : undefined
  const isReview = current?.kind === "review"

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow={`ТВОЙ ПЛАН · ${formatLong(today).toUpperCase()}`}
        title="Что сделать сегодня"
        description="Математика + Информатика → грант. Один понятный шаг на день — без перегруза и прыжков между темами."
        action={
          <Badge variant="outline" className="rounded-full border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            <Flame data-icon="inline-start" />
            {streak > 0 ? `${streak} ${pluralize(streak, "день", "дня", "дней")} в ритме` : "Новая серия — с первого занятия"}
          </Badge>
        }
      />

      <div className="grid items-start gap-5 min-[900px]:grid-cols-[minmax(0,1fr)_270px]">
        <div className="stagger flex min-w-0 flex-col gap-5">
          {current && currentTopic ? (
            <section aria-labelledby="today-topic-title" className="animate-glow overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.12]">
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_170px]">
                <div className="flex min-w-0 flex-col items-start">
                  <Badge variant="outline" className="mb-4 rounded-full border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                    {isReview ? "Повторение" : "Сегодня"} · {subjectLabel}
                    {currentTopic.priority === "foundation" ? " · фундамент" : ""}
                  </Badge>
                  <h2 id="today-topic-title" className="text-xl font-semibold tracking-tight sm:text-2xl">{currentTopic.title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    {isReview ? "Короткое возвращение к теме: вспомнить правила и решить несколько задач без подсказок." : sessionOutcome(currentTopic, current.sessionNo ?? 1)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1.5">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {focusIsCurrent ? `${state.settings.focusMinutes} минут` : `${isReview ? current.minutes : Math.max(current.minutes, 0)} минут`}
                    </span>
                    {!isReview ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1.5">
                        <BookOpen aria-hidden="true" className="size-3.5" />
                        Сессия {current.sessionNo} из {currentTopic.sessionsTotal}
                      </span>
                    ) : null}
                    {current.movedHere ? <span className="rounded-full bg-background/80 px-2.5 py-1.5">Перенесено сюда</span> : null}
                    <TopicStatusBadge status={topicProgress?.status ?? "not_started"} />
                  </div>
                  {!isReview ? <p className="mt-3 text-[11px] text-muted-foreground">Тема сессии: {sessionTitle(currentTopic, current.sessionNo ?? 1)}</p> : null}

                  <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button type="button" onClick={() => (focusIsCurrent ? onStartFocus() : startTarget && onStartFocus(startTarget))} className="h-10 rounded-xl px-4">
                      <Play data-icon="inline-start" />
                      {focusIsCurrent ? "Продолжить фокус-сессию" : "Начать фокус-сессию"}
                    </Button>
                    {currentTopic.bilimqorUrl ? (
                      <Button asChild type="button" variant="outline" className="h-10 rounded-xl border-border/80 bg-card/80 px-4">
                        <a href={currentTopic.bilimqorUrl} target="_blank" rel="noreferrer">
                          Открыть практику в Bilimqor
                          <ExternalLink data-icon="inline-end" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTopic(currentTopic.id)} className="h-8 rounded-lg px-2 text-xs text-muted-foreground">Открыть тему<ArrowRight data-icon="inline-end" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => startTarget && setResultTarget(startTarget)} className="h-8 rounded-lg px-2 text-xs text-muted-foreground"><Check data-icon="inline-start" />Уже сделал</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setMoveItem(current)} className="h-8 rounded-lg px-2 text-xs text-muted-foreground"><MoveRight data-icon="inline-start" />Перенести</Button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 rounded-xl border border-primary/15 bg-background/60 p-4 text-center backdrop-blur">
                  <RouteOrb rings={orbRings} size={104} />
                  <div className="w-full">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Модуль {moduleInfo ? String(moduleInfo.order).padStart(2, "0") : ""}</p>
                    <p className="mt-1 text-sm font-semibold leading-5">{moduleInfo?.title}</p>
                  </div>
                  <div className="w-full min-w-[92px]">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>Прогресс темы</span>
                      <span className="font-semibold text-foreground">{topicProgress?.percent ?? 0}%</span>
                    </div>
                    <div role="progressbar" aria-label="Прогресс по теме" aria-valuemin={0} aria-valuemax={100} aria-valuenow={topicProgress?.percent ?? 0} className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${topicProgress?.percent ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.05] p-6 shadow-sm shadow-slate-900/[0.025]">
              <Badge variant="outline" className="mb-4 rounded-full border-success/20 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-success">
                {movedToday ? "Занятие перенесено" : doneToday.length ? "На сегодня всё" : todayItems[0]?.kind === "rest" ? "День отдыха" : todayItems[0]?.kind === "reserve" ? "Резервный день" : "Свободный день"}
              </Badge>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {movedToday ? "Ничего страшного — план уже пересчитан" : doneToday.length ? "Сегодняшнее занятие выполнено" : todayItems[0]?.kind === "rest" ? "Сегодня без новых тем" : todayItems[0]?.kind === "reserve" ? "Окно для переноса и догона" : "Сегодня занятий нет"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {movedToday && movedTopic
                  ? `«${movedTopic.title}» вернётся в расписание в ближайшее свободное окно. Можно спокойно отдохнуть.`
                  : doneToday.length
                    ? "Отличный темп. Следующий шаг уже стоит в плане — отдыхай или загляни в повторения справа."
                    : todayItems[0]?.kind === "rest"
                      ? "Отдых — часть подготовки: память закрепляет материал в паузах."
                      : "Если что-то было перенесено, оно поставлено сюда. Иначе день остаётся свободным."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {movedToday ? (
                  <Button type="button" variant="outline" onClick={() => undoMove(movedToday.key)} className="h-10 rounded-xl"><Undo2 data-icon="inline-start" />Вернуть на сегодня</Button>
                ) : null}
                {nextSteps[0] ? (
                  <Button type="button" variant="outline" onClick={() => onOpenTopic(nextSteps[0].topicId!)} className="h-10 rounded-xl">
                    Следующее: {topicById[nextSteps[0].topicId!].title}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                ) : null}
              </div>
            </section>
          )}

          {doneToday.length && current ? (
            <p className="flex items-center gap-2 px-1 text-xs text-success"><Check aria-hidden="true" className="size-3.5" />Сегодня уже выполнено: {doneToday.map((item) => item.title).join(", ")}</p>
          ) : null}

          <Panel
            title="Неделя подготовки"
            description={`${formatDayMonth(week[0])} – ${formatDayMonth(week[6])} · учёба, повторы, резерв и отдых`}
            action={
              <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("calendar")} className="rounded-lg px-2 text-xs text-muted-foreground">
                В календарь
                <ArrowRight data-icon="inline-end" />
              </Button>
            }
            contentClassName="pb-4"
          >
            <div className="grid grid-cols-[repeat(7,minmax(40px,1fr))] gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
              {week.map((date) => {
                const items = plan.byDate[date] ?? []
                const main = items.find((item) => item.kind === "study") ?? items.find((item) => item.kind === "review") ?? items[0]
                const isToday = date === today
                const allDone = items.length > 0 && items.every((item) => item.done)
                const hasDone = items.some((item) => item.done)
                const isDone = allDone || (hasDone && date < today)
                const DayIcon = isDone ? Check : main?.kind === "review" ? RotateCcw : undefined
                const label = main?.kind === "rest" ? "Отдых" : main?.kind === "reserve" ? "Резерв" : relativeLabel(date, today)
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!main?.topicId}
                    onClick={() => main?.topicId && onOpenTopic(main.topicId)}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${label}, ${weekdayShortLabel(date)} ${dayNumber(date)}: ${main?.title ?? "нет занятий"}`}
                    className={`group flex min-h-[72px] min-w-0 flex-col items-center justify-start rounded-xl border px-1 py-2 text-center transition-colors disabled:cursor-default sm:min-h-[112px] sm:px-1.5 sm:py-2.5 ${
                      isToday ? "border-primary/25 bg-primary/5" : isDone ? "border-success/15 bg-success/[0.035] hover:bg-success/[0.07]" : "border-transparent bg-muted/50 hover:border-border hover:bg-muted"
                    }`}
                  >
                    <span className={`text-[8px] font-semibold uppercase tracking-wide sm:text-[9px] ${isToday ? "text-primary" : "text-muted-foreground"}`}>{weekdayShortLabel(date)}</span>
                    <span className={`mt-1 text-xs font-semibold sm:text-sm ${isToday ? "text-primary" : "text-foreground"}`}>{dayNumber(date)}</span>
                    <span className={`mt-1 inline-flex min-h-4 items-center justify-center text-[8px] font-medium leading-3 sm:text-[9px] ${isToday ? "text-primary" : isDone ? "text-success" : "text-muted-foreground"}`}>
                      {DayIcon ? <DayIcon aria-hidden="true" className="mr-0.5 size-3 shrink-0" /> : null}
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="mt-1 hidden text-[9px] leading-3 text-muted-foreground sm:line-clamp-3 sm:block">
                      {main ? (main.topicId ? topicById[main.topicId].title : main.title) : "—"}
                      {items.filter((item) => item.kind !== "rest" && item.kind !== "reserve").length > 1 ? ` +${items.filter((item) => item.kind !== "rest" && item.kind !== "reserve").length - 1}` : ""}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Эта неделя: {stats.sessionsDoneWeek} {pluralize(stats.sessionsDoneWeek, "сессия", "сессии", "сессий")} · {hoursLabel(stats.focusMinutesWeek)} фокуса · {stats.doneThisWeek} из {stats.plannedThisWeek} занятий выполнено
            </p>
          </Panel>

          <Panel
            title="Ближайшие темы"
            description="Темы идут по порядку, но любую можно открыть"
            action={<Badge variant="secondary" className="rounded-full bg-muted px-2.5 text-[10px] text-muted-foreground">{nextSteps.length}</Badge>}
          >
            {nextSteps.length ? (
              <div className="flex flex-col divide-y divide-border/70">
                {nextSteps.map((item) => {
                  const topic = topicById[item.topicId!]
                  return (
                    <button key={item.key} type="button" onClick={() => onOpenTopic(topic.id)} className="group flex items-center gap-3 py-3 text-left first:pt-0 last:pb-0">
                      <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-[10px] font-semibold leading-3 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                        <span>{dayNumber(item.date)}</span>
                        <span className="text-[8px] font-medium uppercase">{weekdayShortLabel(item.date)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{topic.title}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {relativeLabel(item.date, today) === weekdayShortLabel(item.date) ? formatShort(item.date) : relativeLabel(item.date, today)} · сессия {item.sessionNo} из {topic.sessionsTotal}
                        </span>
                      </span>
                      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <EmptyHint>Все темы маршрута уже стоят в плане или выполнены.</EmptyHint>
            )}
          </Panel>
        </div>

        <aside className="stagger flex min-w-0 flex-col gap-5">
          <Panel
            title="Вернуть в память"
            description="Короткие повторения 2 · 7 · 21 день"
            action={<Badge variant="outline" className="rounded-full border-warning/20 bg-warning/10 px-2.5 text-[10px] font-medium text-warning">{reviewQueue.length}</Badge>}
          >
            {reviewQueue.length ? (
              <div className="flex flex-col gap-3">
                {reviewQueue.map((task) => {
                  const topic = topicById[task.topicId]
                  if (!topic) return null
                  return (
                    <button key={task.id} type="button" onClick={() => onOpenTopic(topic.id)} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background p-3 text-left transition-colors hover:border-primary/20 hover:bg-primary/[0.025]">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"><RotateCcw aria-hidden="true" className="size-3.5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold leading-5">{topic.title}</span>
                        <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{task.label}</span>
                      </span>
                      <span className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-warning">{task.due <= today ? "Пора" : relativeLabel(task.due, today) === weekdayShortLabel(task.due) ? formatShort(task.due) : relativeLabel(task.due, today)}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <EmptyHint>Повторений пока нет. Они появятся автоматически после завершения темы.</EmptyHint>
            )}
          </Panel>

          <Panel title="Важные даты" action={<CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />}>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen aria-hidden="true" className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-5">Экзамен ЕНТ</p>
                  <p className="text-[10px] font-medium text-primary">{formatDayMonth(state.settings.examDate)} · {daysToExam > 0 ? `${daysToExam} ${pluralize(daysToExam, "день", "дня", "дней")}` : "дата прошла"}</p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Дата введена вручную — проверь её на официальном сайте НЦТ.</p>
                </div>
              </div>
              {nextMock ? (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><BookOpen aria-hidden="true" className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-5">Пробник по плану</p>
                    <p className="text-[10px] font-medium text-primary">{formatDayMonth(nextMock.date)}</p>
                  </div>
                </div>
              ) : null}
              {state.importantDates.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-5">{item.label}</p>
                    {item.date ? <p className="text-[10px] font-medium text-primary">{formatDayMonth(item.date)}</p> : null}
                    {item.detail ? <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{item.detail}</p> : null}
                  </div>
                </div>
              ))}
              <Button asChild type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <a href={state.settings.registrationUrl} target="_blank" rel="noreferrer">Сайт регистрации<ExternalLink data-icon="inline-end" /></a>
              </Button>
            </div>
          </Panel>

          <Panel title="Последняя ошибка" action={<TriangleAlert aria-hidden="true" className="size-4 text-warning" />}>
            {lastSessionWithNote ? (
              <>
                <p className="text-xs font-semibold leading-5">{topicById[lastSessionWithNote.topicId]?.title}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{lastSessionWithNote.stuck ?? "Сессия закончилась с ошибками — тема вернулась на повтор."}</p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                  <span className="text-[10px] text-muted-foreground">{formatShort(lastSessionWithNote.date)}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTopic(lastSessionWithNote.topicId)} className="h-7 rounded-lg px-2 text-[10px] text-primary">Открыть<ArrowRight data-icon="inline-end" /></Button>
                </div>
              </>
            ) : (
              <EmptyHint>Пока ошибок не записано. После занятия с ошибками или заметки «где застрял» они появятся здесь.</EmptyHint>
            )}
          </Panel>

          <Panel title="Последний пробник" contentClassName="pb-4">
            {lastMock ? (
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">{formatShort(lastMock.date)}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{lastMock.score}<span className="ml-1 text-sm font-medium text-muted-foreground">/ 140</span></p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("exams")} className="rounded-lg text-xs">История<ArrowRight data-icon="inline-end" /></Button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-xs leading-5 text-muted-foreground">Результатов пока нет. Добавь первый пробник — он станет точкой отсчёта.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("exams")} className="rounded-lg text-xs">Добавить результат<ArrowRight data-icon="inline-end" /></Button>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <MoveDialog item={moveItem} onClose={() => setMoveItem(null)} />
      <ResultDialog open={Boolean(resultTarget)} onOpenChange={(open) => !open && setResultTarget(null)} target={resultTarget} onFinished={() => setResultTarget(null)} />
    </div>
  )
}
