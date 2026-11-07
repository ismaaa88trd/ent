"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check, ChevronDown, Circle, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Panel, PageHeading, PriorityBadge, TopicStatusBadge } from "@/components/ent/common"
import { isHardTopic, moduleById, modulesOf, subjects, topicById, topicsOfModule, topicsOfSubject } from "@/lib/curriculum"
import { formatDayMonth, diffDays } from "@/lib/dates"
import { useApp } from "@/lib/store"
import type { StudyModule, Subject, TopicStatus } from "@/lib/types"

function moduleStatus(statuses: TopicStatus[]): TopicStatus {
  if (statuses.some((status) => status === "needs_review")) return "needs_review"
  if (statuses.every((status) => status === "mastered")) return "mastered"
  if (statuses.every((status) => status === "not_started")) return "not_started"
  return "in_progress"
}

export function RouteScreen({
  subject,
  onSubjectChange,
  onOpenTopic,
}: {
  subject: Subject
  onSubjectChange: (subject: Subject) => void
  onOpenTopic: (topicId: string) => void
}) {
  const { progress, plan, state, today } = useApp()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const subjectInfo = subjects.find((item) => item.id === subject) ?? subjects[0]
  const subjectModules = modulesOf(subject)
  const subjectTopics = topicsOfSubject(subject)
  const nextEntry = plan.queue.find((entry) => entry.subject === subject)
  const nextTopic = nextEntry ? topicById[nextEntry.topicId] : undefined
  const currentModuleId = nextTopic?.moduleId

  const rows = useMemo(
    () =>
      subjectModules.map((module) => {
        const moduleTopics = topicsOfModule(module.id)
        const statuses = moduleTopics.map((topic) => progress[topic.id]?.status ?? "not_started")
        const sessionsTotal = moduleTopics.reduce((sum, topic) => sum + topic.sessionsTotal, 0)
        const sessionsDone = moduleTopics.reduce((sum, topic) => sum + Math.min(progress[topic.id]?.sessionsDone ?? 0, topic.sessionsTotal), 0)
        const slots = moduleTopics.reduce((sum, topic) => sum + topic.reviewDays.length, 0)
        const reviewsDone = moduleTopics.reduce((sum, topic) => sum + Math.min(progress[topic.id]?.reviewsDone ?? 0, topic.reviewDays.length), 0)
        const percent = Math.round(((sessionsDone + reviewsDone) / (sessionsTotal + slots)) * 100)
        const dependencyIds = new Set<string>()
        for (const topic of moduleTopics) for (const id of topic.prerequisites) {
          const prerequisite = topicById[id]
          if (prerequisite && prerequisite.moduleId !== module.id) dependencyIds.add(prerequisite.moduleId)
        }
        const dependencies = [...dependencyIds].map((id) => moduleById[id]).filter(Boolean) as StudyModule[]
        const unmet = dependencies.filter((dep) => topicsOfModule(dep.id).some((topic) => (progress[topic.id]?.sessionsDone ?? 0) < topic.sessionsTotal))
        return { module, moduleTopics, status: moduleStatus(statuses), sessionsTotal, sessionsDone, percent, dependencies, unmet, hard: moduleTopics.some(isHardTopic) }
      }),
    [subjectModules, progress],
  )

  const mastered = rows.filter((row) => row.status === "mastered").length
  const review = rows.filter((row) => row.status === "needs_review").length
  const sessionsLeft = plan.queue.length
  const end = plan.projectedEnd
  const daysToEnd = end ? diffDays(state.settings.examDate, end) : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="ПОШАГОВЫЙ ПЛАН"
        title="Мой маршрут"
        description="Большая тема → несколько сессий → практика → повторение → закрепление. Весь путь виден заранее, но лучше идти по порядку."
        action={<Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">{subjectTopics.length} тем · {subjectTopics.reduce((sum, topic) => sum + topic.sessionsTotal, 0)} сессий</Badge>}
      />

      <ToggleGroup
        type="single"
        value={subject}
        onValueChange={(value) => value && onSubjectChange(value as Subject)}
        aria-label="Выбрать предмет"
        className="flex w-full flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/60 p-1 sm:w-fit"
      >
        {subjects.map((item) => (
          <ToggleGroupItem key={item.id} value={item.id} variant="default" className="h-9 flex-1 rounded-lg border-0 px-3 text-xs font-medium text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm sm:flex-none sm:px-4">
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section aria-label={`Модули: ${subjectInfo.label}`} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-sm shadow-slate-900/[0.025]">
            <div>
              <p className="text-sm font-semibold">{subjectInfo.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{subjectModules.length} модулей · порядок подобран по зависимостям тем</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span><strong className="font-semibold text-success">{mastered}</strong> закреплено</span>
              <span><strong className="font-semibold text-warning">{review}</strong> на повтор</span>
            </div>
          </div>

          <div className="relative flex flex-col gap-3 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-border/80 sm:gap-4">
            {rows.map(({ module, moduleTopics, status, sessionsTotal, sessionsDone, percent, dependencies, unmet, hard }) => {
              const isCurrent = module.id === currentModuleId
              const isComplete = status === "mastered"
              const isReview = status === "needs_review"
              const isFuture = !isCurrent && status === "not_started"
              const open = expanded[module.id] ?? isCurrent
              const MarkerIcon = isComplete ? Check : isReview ? RotateCcw : Circle
              const firstTopic = moduleTopics.find((topic) => (progress[topic.id]?.sessionsDone ?? 0) < topic.sessionsTotal) ?? moduleTopics[0]

              return (
                <article key={module.id} className={`relative flex min-w-0 gap-3 sm:gap-4 ${isFuture ? "opacity-80" : ""}`}>
                  <div className="z-10 flex w-10 shrink-0 justify-center pt-5">
                    <span className={`flex size-9 items-center justify-center rounded-full border bg-card ${isComplete ? "border-success/25 text-success" : isCurrent ? "border-primary/25 bg-primary/5 text-primary" : isReview ? "border-warning/25 bg-warning/5 text-warning" : "border-border text-muted-foreground"}`}>
                      <MarkerIcon aria-hidden="true" className="size-4" />
                    </span>
                  </div>

                  <div className={`min-w-0 flex-1 rounded-2xl border bg-card p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5 ${isCurrent ? "border-primary/25 ring-1 ring-primary/5" : "border-border/80"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Модуль {String(module.order).padStart(2, "0")}</span>
                          {isCurrent ? <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-medium text-primary">Сейчас</Badge> : null}
                          {hard ? <Badge variant="outline" className="rounded-full border-border bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">Больше времени</Badge> : null}
                        </div>
                        <h2 className="text-sm font-semibold tracking-tight sm:text-base">{module.title}</h2>
                        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">{module.description}</p>
                        {module.specSection ? <p className="mt-1 text-[10px] text-muted-foreground">Раздел спецификации НЦТ: {module.specSection}</p> : null}
                      </div>
                      <TopicStatusBadge status={status} />
                    </div>

                    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                      {dependencies.length ? `Опирается на: ${dependencies.map((dep) => `«${dep.title.split(":")[0]}»`).join(", ")}.` : "Не требует предыдущих модулей."}
                      {unmet.length ? ` Лучше сначала закончить ${unmet.map((dep) => `«${dep.title.split(":")[0]}»`).join(", ")} — иначе придётся возвращаться.` : ""}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-[145px] flex-1 sm:max-w-[240px]">
                        <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Прогресс модуля</span>
                          <span>{percent}%</span>
                        </div>
                        <div role="progressbar" aria-label={`Прогресс по модулю ${module.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-primary"}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{sessionsDone}/{sessionsTotal} сессий · {moduleTopics.length} тем</span>
                      <div className="flex items-center gap-1.5">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((prev) => ({ ...prev, [module.id]: !open }))} aria-expanded={open} className="rounded-lg text-xs text-muted-foreground">
                          Темы
                          <ChevronDown data-icon="inline-end" className={open ? "rotate-180" : ""} />
                        </Button>
                        <Button type="button" variant={isCurrent ? "default" : "outline"} size="sm" onClick={() => onOpenTopic(firstTopic.id)} className="rounded-lg">
                          Открыть
                          <ArrowRight data-icon="inline-end" />
                        </Button>
                      </div>
                    </div>

                    {open ? (
                      <ul className="mt-4 flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-background">
                        {moduleTopics.map((topic) => {
                          const info = progress[topic.id]
                          return (
                            <li key={topic.id}>
                              <button type="button" onClick={() => onOpenTopic(topic.id)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-primary/[0.03]">
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-medium">{topic.title}</span>
                                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{info?.sessionsDone ?? 0}/{topic.sessionsTotal} сессий · {info?.percent ?? 0}%</span>
                                </span>
                                <span className="hidden sm:block"><PriorityBadge priority={topic.priority} /></span>
                                <TopicStatusBadge status={info?.status ?? "not_started"} />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <Panel title="Ближайшая цель" description="Не надо закрывать всё за один день.">
            {nextTopic && nextEntry ? (
              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
                <p className="text-xs font-semibold">{nextTopic.title}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Следующая сессия — {nextEntry.sessionNo} из {nextTopic.sessionsTotal}. {nextTopic.prerequisites.length ? "База для неё уже пройдена." : "Можно начинать без подготовки."}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTopic(nextTopic.id)} className="mt-3 h-8 rounded-lg px-2 text-xs text-primary">
                  Открыть тему
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">Все сессии по этому предмету выполнены — остались повторения.</p>
            )}
          </Panel>

          <Panel title="Темп и дата ЕНТ" description="Расчёт по текущим настройкам плана.">
            <p className="text-xs leading-5 text-muted-foreground">
              Осталось сессий по всему маршруту: <span className="font-semibold text-foreground">{sessionsLeft}</span>.{" "}
              {end
                ? daysToEnd !== null && daysToEnd >= 0
                  ? `При текущем темпе все сессии закончатся ${formatDayMonth(end)} — за ${daysToEnd} дн. до экзамена.`
                  : `При текущем темпе все сессии закончатся ${formatDayMonth(end)}, уже после даты экзамена. Стоит увеличить нагрузку в настройках или сократить маршрут.`
                : "При текущем темпе маршрут не помещается в расчётный период — увеличь нагрузку в настройках."}
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">Это арифметика плана, а не прогноз результата на экзамене.</p>
          </Panel>

          <Panel title="Как устроен маршрут" description="Порядок помогает не пропустить базу, но это не блокировка.">
            <div className="flex flex-col gap-3 text-xs leading-5 text-muted-foreground">
              <div className="flex gap-2.5"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"><Check aria-hidden="true" className="size-3" /></span><p><span className="font-medium text-foreground">Закреплено</span> — все сессии и повторы 2 · 7 · 21 день сделаны.</p></div>
              <div className="flex gap-2.5"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Circle aria-hidden="true" className="size-2.5 fill-current" /></span><p><span className="font-medium text-foreground">В процессе</span> — тема начата, повторения ещё идут.</p></div>
              <div className="flex gap-2.5"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"><RotateCcw aria-hidden="true" className="size-3" /></span><p><span className="font-medium text-foreground">Нужен повтор</span> — были ошибки, вернись короткой сессией.</p></div>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Сначала идёт фундаментальная алгебра, затем добавляется геометрия, потом информатика небольшими блоками. Ближе к экзамену растёт доля смешанных задач.</p>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
