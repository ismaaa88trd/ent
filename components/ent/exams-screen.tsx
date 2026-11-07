"use client"

import { useMemo, useState, type FormEvent } from "react"
import { ClipboardCheck, Clock3, Plus, Trash2, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyHint, Panel, PageHeading } from "@/components/ent/common"
import { moduleById, modules, topicById } from "@/lib/curriculum"
import { formatShort } from "@/lib/dates"
import { suggestReviewTopics, useApp } from "@/lib/store"

const chartConfig = { score: { label: "Баллы", color: "var(--chart-1)" } } satisfies ChartConfig
const shortTitle = (title: string) => title.split(/[:,]/)[0]

export function ExamsScreen({ onOpenTopic }: { onOpenTopic: (topicId: string) => void }) {
  const { state, today, progress, stats, addMock, removeMock, addReviewsFor } = useApp()
  const [date, setDate] = useState(today)
  const [score, setScore] = useState("")
  const [minutes, setMinutes] = useState("")
  const [comment, setComment] = useState("")
  const [weak, setWeak] = useState<string[]>([])
  const [suggest, setSuggest] = useState<{ topicIds: string[]; picked: string[]; noneStarted: boolean } | null>(null)

  const mocks = state.mocks
  const latest = mocks[mocks.length - 1]
  const average = mocks.length ? Math.round(mocks.reduce((sum, m) => sum + m.score, 0) / mocks.length) : null
  const delta = mocks.length > 1 ? latest.score - mocks[0].score : null
  const trend = useMemo(() => mocks.map((m) => ({ dateLabel: formatShort(m.date), score: m.score })), [mocks])
  const hours = (stats.focusMinutesTotal / 60).toFixed(1).replace(".", ",")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(score)
    if (!Number.isFinite(value) || value < 0 || value > 140) return
    addMock({ date, score: value, minutes: Number(minutes) || 0, comment: comment.trim(), weakModuleIds: weak })
    if (weak.length) {
      const topicIds = suggestReviewTopics(weak, progress)
      setSuggest({ topicIds, picked: topicIds, noneStarted: topicIds.length === 0 })
    }
    setScore("")
    setMinutes("")
    setComment("")
    setWeak([])
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="ПРОВЕРЯЙ ДИНАМИКУ"
        title="Пробники"
        description="История реальных результатов и ошибок. Здесь нет «процента готовности» — только твои баллы и факты подготовки."
        action={<Button type="button" onClick={() => document.getElementById("add-mock")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="rounded-xl"><Plus data-icon="inline-start" />Добавить результат</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Последний пробник" value={latest ? `${latest.score}` : "—"} suffix={latest ? "/ 140" : ""} note={latest ? `${formatShort(latest.date)}${latest.minutes ? ` · ${latest.minutes} мин` : ""}` : "Пока нет результатов"} />
        <Stat label="Динамика баллов" value={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`} icon={delta !== null && delta > 0} note={delta === null ? "Нужно минимум два пробника" : "От первого пробника"} />
        <Stat label="Часы фокуса" value={hours} suffix="ч" note={`${stats.sessionsDoneTotal} завершённых сессий`} />
        <Stat label="Темы в повторении" value={String(stats.reviewTopics)} note={average !== null ? `Средний балл: ${average}` : "Нужен повтор после ошибок"} />
      </div>

      <Panel title="Динамика результатов" description="Результат каждого пробного теста (максимум 140 баллов).">
        {trend.length ? (
          <ChartContainer config={chartConfig} className="h-[250px] min-h-[250px] w-full aspect-auto">
            <LineChart accessibilityLayer data={trend} margin={{ top: 14, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis domain={[0, 140]} tickLine={false} axisLine={false} tickCount={5} width={38} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-score)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ChartContainer>
        ) : (
          <EmptyHint>График появится после первого добавленного пробника.</EmptyHint>
        )}
      </Panel>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Panel title="История" description="Баллы, длительность и темы, которые стоит повторить.">
          {mocks.length ? (
            <div className="flex flex-col divide-y divide-border/70">
              {[...mocks].reverse().map((result, index) => (
                <div key={result.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0 sm:flex-nowrap">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><ClipboardCheck aria-hidden="true" className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Пробник · {formatShort(result.date)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{result.weakModuleIds.length ? `Повторить: ${result.weakModuleIds.map((id) => shortTitle(moduleById[id]?.title ?? id)).join(", ")}` : "Слабые темы не отмечены"}</p>
                    {result.comment ? <p className="mt-1 text-[10px] italic text-muted-foreground">«{result.comment}»</p> : null}
                  </div>
                  <div className="ml-auto flex items-center gap-3 sm:ml-0">
                    {result.minutes ? <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 aria-hidden="true" className="size-3" />{result.minutes} мин</span> : null}
                    <span className="text-sm font-semibold">{result.score}<span className="text-[10px] font-normal text-muted-foreground"> / 140</span></span>
                    <Button type="button" variant="ghost" size="icon" aria-label="Удалить результат" onClick={() => removeMock(result.id)} className="size-7 rounded-lg text-muted-foreground"><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint>Пока нет пробников. После первого варианта запиши результат — это точка отсчёта для динамики.</EmptyHint>
          )}
        </Panel>

        <Panel title="Добавить пробник" description="Результат сохраняется в этом браузере." className="scroll-mt-6">
          <form id="add-mock" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup className="gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="mock-date" className="text-xs">Дата</FieldLabel>
                  <Input id="mock-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-9 rounded-xl bg-background text-xs" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="mock-score" className="text-xs">Баллы (0–140)</FieldLabel>
                  <Input id="mock-score" type="number" min={0} max={140} value={score} onChange={(e) => setScore(e.target.value)} placeholder="88" required className="h-9 rounded-xl bg-background text-xs" />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="mock-duration" className="text-xs">Время, минут</FieldLabel>
                <Input id="mock-duration" type="number" min={1} max={300} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="165" className="h-9 rounded-xl bg-background text-xs" />
              </Field>
              <Field>
                <FieldLabel htmlFor="mock-comment" className="text-xs">Комментарий</FieldLabel>
                <Textarea id="mock-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что получилось, а что стоит повторить?" className="min-h-16 resize-y rounded-xl bg-background text-xs" />
              </Field>
            </FieldGroup>

            <FieldSet className="gap-2">
              <FieldLegend variant="label" className="mb-0 text-xs">Слабые темы</FieldLegend>
              <FieldDescription className="text-[10px]">Отметь модули, где были ошибки — предложим повторения.</FieldDescription>
              <ToggleGroup type="multiple" value={weak} onValueChange={setWeak} aria-label="Слабые темы" className="flex flex-wrap justify-start gap-1.5">
                {modules.map((module) => (
                  <ToggleGroupItem key={module.id} value={module.id} variant="outline" className="h-7 flex-none rounded-full border-border px-2.5 text-[10px] font-medium text-muted-foreground data-[state=on]:border-primary/20 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
                    {shortTitle(module.title)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <Button type="submit" className="h-10 rounded-xl"><Plus data-icon="inline-start" />Записать результат</Button>
          </form>
        </Panel>
      </div>

      <Dialog open={Boolean(suggest)} onOpenChange={(open) => !open && setSuggest(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Результат записан</DialogTitle>
            <DialogDescription>{suggest?.noneStarted ? "Выбранные темы ещё не начаты — они уже стоят в маршруте, повторения не нужны." : "Добавить повторения по слабым темам в расписание?"}</DialogDescription>
          </DialogHeader>
          {suggest && !suggest.noneStarted ? (
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {suggest.topicIds.map((id) => (
                <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-xs">
                  <Checkbox checked={suggest.picked.includes(id)} onCheckedChange={(checked) => setSuggest({ ...suggest, picked: checked ? [...suggest.picked, id] : suggest.picked.filter((x) => x !== id) })} />
                  <span className="flex-1">{topicById[id].title}</span>
                </label>
              ))}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuggest(null)} className="rounded-xl">Не сейчас</Button>
            {suggest && !suggest.noneStarted ? <Button type="button" onClick={() => { addReviewsFor(suggest.picked, "mock"); setSuggest(null) }} disabled={!suggest.picked.length} className="rounded-xl">Добавить в расписание</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value, suffix, note, icon }: { label: string; value: string; suffix?: string; note: string; icon?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-slate-900/[0.02]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">{icon ? <TrendingUp aria-hidden="true" className="size-5 text-success" /> : null}{value}{suffix ? <span className="text-sm font-medium text-muted-foreground">{suffix}</span> : null}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>
    </div>
  )
}
