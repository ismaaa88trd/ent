"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Check, Clock3, ExternalLink, Pause, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Panel } from "@/components/ent/common"
import { ResultDialog } from "@/components/ent/dialogs"
import { sessionSteps, sessionTitle, subjects, topicById } from "@/lib/curriculum"
import { useApp, type FinishTarget } from "@/lib/store"

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function FocusScreen({ onExit, onOpenTopic }: { onExit: () => void; onOpenTopic: (topicId: string) => void }) {
  const { state, toggleFocus, toggleStep, setStuck, setFocusMinutes, cancelFocus } = useApp()
  const focus = state.focus
  const [now, setNow] = useState(() => Date.now())
  const [finishOpen, setFinishOpen] = useState(false)
  const [elapsedAtFinish, setElapsedAtFinish] = useState(0)

  useEffect(() => {
    if (!focus?.running) return
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [focus?.running])

  useEffect(() => {
    if (!focus && !finishOpen) onExit()
  }, [focus, finishOpen, onExit])

  const elapsedMs = focus ? focus.accumulatedMs + (focus.running ? Math.max(0, now - focus.startedAt) : 0) : 0
  const totalMs = (focus?.plannedMinutes ?? 45) * 60_000
  const remaining = totalMs - elapsedMs
  const clock = formatClock(remaining)

  useEffect(() => {
    if (!focus) return
    const previous = document.title
    document.title = `${clock} · ${topicById[focus.topicId]?.title ?? "Фокус"}`
    return () => {
      document.title = previous
    }
  }, [clock, focus])

  if (!focus) return null
  const topic = topicById[focus.topicId]
  if (!topic) return null
  const isReview = focus.kind === "review"
  const subject = subjects.find((item) => item.id === topic.subject)?.shortLabel ?? ""
  const steps = isReview
    ? ["Вспомнить правила без подсказок", "Решить 6–8 задач на повторение", "Отметить, что снова вызвало трудности"]
    : sessionSteps(topic, focus.sessionNo ?? 1)
  const target: FinishTarget = {
    itemKey: focus.itemKey,
    topicId: focus.topicId,
    kind: focus.kind,
    sessionNo: focus.sessionNo,
    reviewTaskId: focus.reviewTaskId,
    plannedMinutes: focus.plannedMinutes,
  }
  const progressRatio = Math.min(1, elapsedMs / totalMs)
  const timeIsUp = remaining <= 0

  function openFinish() {
    if (focus?.running) toggleFocus()
    setElapsedAtFinish(Math.round(elapsedMs / 60_000))
    setFinishOpen(true)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onExit} className="rounded-xl px-2 text-xs text-muted-foreground">
            <ArrowLeft data-icon="inline-start" />
            Выйти (таймер сохранится)
          </Button>
          <Button type="button" variant="ghost" onClick={() => { cancelFocus(); onExit() }} className="rounded-xl px-2 text-xs text-muted-foreground">
            <X data-icon="inline-start" />
            Отменить сессию
          </Button>
        </header>

        <div className="mx-auto w-full max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{isReview ? "Повторение" : "Фокус-сессия"} · {subject}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{topic.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isReview ? "Короткий возврат к теме" : `Сессия ${focus.sessionNo} из ${topic.sessionsTotal} · ${sessionTitle(topic, focus.sessionNo ?? 1)}`}
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.06] p-5 shadow-sm shadow-slate-900/[0.025] sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock3 aria-hidden="true" className="size-6" />
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{timeIsUp ? "Время вышло — можно завершать" : focus.running ? "Идёт сессия" : "На паузе"}</p>
              <p role="timer" aria-live="off" className="mt-2 font-mono text-6xl font-medium tracking-[-0.07em] text-foreground sm:text-7xl">{clock}</p>
              <div className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-primary/10">
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progressRatio * 100}%` }} />
              </div>

              <ToggleGroup
                type="single"
                value={String(focus.plannedMinutes)}
                onValueChange={(value) => value && setFocusMinutes(Number(value))}
                aria-label="Выбрать длительность фокус-сессии"
                className="mt-6 grid w-full max-w-xs grid-cols-3 gap-1 rounded-xl border border-border/70 bg-card p-1"
              >
                {[25, 45, 60].map((minutes) => (
                  <ToggleGroupItem key={minutes} value={String(minutes)} variant="default" className="h-9 rounded-lg border-0 text-xs font-medium text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    {minutes} мин
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button type="button" variant="outline" onClick={toggleFocus} className="h-10 rounded-xl px-5">
                  {focus.running ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
                  {focus.running ? "Пауза" : "Продолжить"}
                </Button>
                <Button type="button" onClick={openFinish} className="h-10 rounded-xl px-5">
                  <Check data-icon="inline-start" />
                  Завершить сессию
                </Button>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-5">
            <Panel title="План этой сессии" description="Три шага — в своём темпе">
              <div className="flex flex-col gap-3">
                {steps.map((step, index) => (
                  <label key={step} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-3">
                    <input type="checkbox" checked={focus.stepsDone[index] ?? false} onChange={() => toggleStep(index)} className="mt-0.5 size-4 rounded border-border accent-primary" aria-label={step} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs font-medium leading-5 ${focus.stepsDone[index] ? "text-muted-foreground line-through" : ""}`}>{step}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">Шаг {index + 1}</span>
                    </span>
                  </label>
                ))}
              </div>
              {topic.bilimqorUrl ? (
                <Button asChild variant="outline" className="mt-4 h-10 w-full justify-between rounded-xl bg-card px-4">
                  <a href={topic.bilimqorUrl} target="_blank" rel="noreferrer">
                    Открыть тренировку в Bilimqor
                    <ExternalLink data-icon="inline-end" />
                  </a>
                </Button>
              ) : null}
            </Panel>

            <Panel title="Где застрял?" description="Заметка сохранится и появится в блоке «Последняя ошибка».">
              <FieldGroup className="gap-2">
                <Field>
                  <FieldLabel htmlFor="focus-note" className="sr-only">Где застрял</FieldLabel>
                  <Textarea
                    id="focus-note"
                    value={focus.stuck}
                    onChange={(event) => setStuck(event.target.value)}
                    placeholder="Например: не понял, когда нужно менять знак неравенства…"
                    className="min-h-24 resize-y rounded-xl border-border/80 bg-background text-xs leading-5 shadow-none"
                  />
                </Field>
              </FieldGroup>
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTopic(topic.id)} className="mt-2 h-8 rounded-lg px-2 text-xs text-muted-foreground">Открыть страницу темы</Button>
            </Panel>
          </div>
        </div>
      </div>

      <ResultDialog open={finishOpen} onOpenChange={setFinishOpen} target={target} elapsedMinutes={elapsedAtFinish} stuck={focus.stuck} onFinished={onExit} />
    </main>
  )
}
