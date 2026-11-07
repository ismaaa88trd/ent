"use client"

import { useMemo, useState } from "react"
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, MoveRight, Play, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Panel, PageHeading } from "@/components/ent/common"
import { MoveDialog, targetFromItem } from "@/components/ent/dialogs"
import { topicById } from "@/lib/curriculum"
import { addDays, dayNumber, formatDayMonth, formatMonthYear, fromIso, relativeLabel, startOfWeek, toIso, weekdayShortLabel } from "@/lib/dates"
import { useApp, type FinishTarget } from "@/lib/store"
import type { PlanItem, PlanItemKind } from "@/lib/types"

const kindLabel: Record<PlanItemKind, string> = { study: "Сессия", review: "Повтор", mock: "Пробник", reserve: "Резерв", rest: "Отдых" }
const kindStyle: Record<PlanItemKind, string> = {
  study: "border-primary/15 bg-primary/[0.04] text-primary",
  review: "border-warning/20 bg-warning/[0.06] text-warning",
  mock: "border-success/20 bg-success/[0.06] text-success",
  reserve: "border-border bg-muted/50 text-muted-foreground",
  rest: "border-border/70 bg-card text-muted-foreground",
}
const dotStyle: Record<PlanItemKind, string> = { study: "bg-primary", review: "bg-warning", mock: "bg-success", reserve: "bg-muted-foreground/40", rest: "bg-muted-foreground/40" }

export function CalendarScreen({ onOpenTopic, onStartFocus }: { onOpenTopic: (topicId: string) => void; onStartFocus: (target?: FinishTarget) => void }) {
  const { plan, today, state } = useApp()
  const [view, setView] = useState<"week" | "month">("week")
  const [offset, setOffset] = useState(0)
  const [moving, setMoving] = useState<PlanItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const weekStart = addDays(startOfWeek(today), offset * 7)
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const monthAnchor = useMemo(() => {
    const d = fromIso(today)
    d.setMonth(d.getMonth() + offset, 1)
    return toIso(d)
  }, [today, offset])
  const monthCells = useMemo(() => {
    const first = fromIso(monthAnchor)
    const start = addDays(toIso(first), -((first.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => {
      const iso = addDays(start, i)
      return { iso, inMonth: fromIso(iso).getMonth() === first.getMonth() }
    })
  }, [monthAnchor])

  const dayItems = (date: string) => plan.byDate[date] ?? []
  const selectedItems = selectedDate ? dayItems(selectedDate) : []

  function start(item: PlanItem) {
    const target = targetFromItem(item, state.settings.focusMinutes)
    if (target) onStartFocus(target)
  }

  function renderItem(item: PlanItem, compact = false) {
    const canAct = !item.done && (item.kind === "study" || item.kind === "review")
    return (
      <div key={item.key} className={`rounded-lg border px-3 py-2.5 ${item.done ? "border-success/20 bg-success/[0.05]" : kindStyle[item.kind]}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wide">{item.done ? "Выполнено" : kindLabel[item.kind]}{item.suggested ? " · по плану" : ""}</span>
          {item.minutes > 0 ? <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground"><Clock3 aria-hidden="true" className="size-3" />{item.minutes} мин</span> : null}
        </div>
        <p className="mt-1.5 text-xs font-medium leading-5 text-foreground">{item.title}</p>
        {item.movedHere ? <p className="text-[10px] text-muted-foreground">Перенесено сюда</p> : null}
        {!compact ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            {item.topicId ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTopic(item.topicId!)} className="h-7 rounded-md px-1.5 text-[10px] text-primary">Открыть тему<ArrowRight data-icon="inline-end" /></Button>
            ) : <span className="text-[10px] text-muted-foreground">{item.kind === "rest" ? "Без новых тем" : item.kind === "reserve" ? "Свободное окно" : ""}</span>}
            {canAct ? (
              <div className="flex gap-1">
                {item.date === today ? <Button type="button" variant="ghost" size="sm" onClick={() => start(item)} className="h-7 rounded-md px-1.5 text-[10px] text-primary"><Play data-icon="inline-start" />Начать</Button> : null}
                <Button type="button" variant="ghost" size="sm" onClick={() => setMoving(item)} className="h-7 rounded-md px-1.5 text-[10px] text-muted-foreground"><MoveRight data-icon="inline-start" />Перенести</Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  const title = view === "week" ? `${formatDayMonth(week[0])} – ${formatDayMonth(week[6])}` : formatMonthYear(monthAnchor)
  const upcomingEvents = [
    { id: "exam", date: state.settings.examDate, label: "Экзамен ЕНТ (проверь дату на сайте НЦТ)" },
    ...state.importantDates.filter((item) => item.date).map((item) => ({ id: item.id, date: item.date!, label: item.label })),
  ]
  const eventsOn = (date: string) => upcomingEvents.filter((event) => event.date === date)

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="ПЛАНИРУЙ БЕЗ ПЕРЕГРУЗА"
        title="Календарь"
        description="Сессии, повторы, пробники и резервные окна — в одном спокойном расписании. Перенос пересчитывает план."
        action={
          <ToggleGroup type="single" value={view} onValueChange={(value) => { if (value) { setView(value as "week" | "month"); setOffset(0) } }} aria-label="Выбрать вид календаря" className="rounded-xl border border-border/80 bg-card p-1">
            <ToggleGroupItem value="week" variant="default" className="h-8 rounded-lg border-0 px-3 text-xs text-muted-foreground data-[state=on]:bg-primary/10 data-[state=on]:text-primary">Неделя</ToggleGroupItem>
            <ToggleGroupItem value="month" variant="default" className="h-8 rounded-lg border-0 px-3 text-xs text-muted-foreground data-[state=on]:bg-primary/10 data-[state=on]:text-primary">Месяц</ToggleGroupItem>
          </ToggleGroup>
        }
      />

      <Panel
        title={title}
        description={view === "week" ? "Основная задача дня, повторы и место для переноса." : "Нажми на дату, чтобы посмотреть план дня."}
        action={
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" aria-label="Назад" onClick={() => setOffset((v) => v - 1)} className="size-8 rounded-lg"><ChevronLeft /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOffset(0)} className="h-8 rounded-lg text-xs">Сегодня</Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Вперёд" onClick={() => setOffset((v) => v + 1)} className="size-8 rounded-lg"><ChevronRight /></Button>
          </div>
        }
      >
        {view === "week" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {week.map((date) => {
              const isToday = date === today
              const events = eventsOn(date)
              return (
                <article key={date} className={`rounded-xl border p-3.5 ${isToday ? "border-primary/25 bg-primary/[0.025]" : "border-border/70 bg-background"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isToday ? "text-primary" : "text-muted-foreground"}`}>{relativeLabel(date, today)}</p>
                      <p className="mt-1 text-xs font-semibold">{weekdayShortLabel(date)} · {formatDayMonth(date)}</p>
                    </div>
                    {isToday ? <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] text-primary">Сегодня</Badge> : null}
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {dayItems(date).map((item) => renderItem(item))}
                    {events.map((event) => <div key={event.id} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">{event.label}</div>)}
                    {!dayItems(date).length && !events.length ? <p className="text-[10px] text-muted-foreground">Нет занятий</p> : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-2">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w) => <span key={w} className="py-2">{w}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthCells.map((cell) => {
                const items = dayItems(cell.iso)
                const events = eventsOn(cell.iso)
                const isToday = cell.iso === today
                const main = items.find((i) => i.kind === "study") ?? items[0]
                return (
                  <button key={cell.iso} type="button" onClick={() => setSelectedDate(cell.iso)} aria-label={`${formatDayMonth(cell.iso)}, событий: ${items.length + events.length}`}
                    className={`flex min-h-[60px] flex-col items-center rounded-xl border px-1 py-2 text-xs transition-colors sm:min-h-[82px] sm:items-start sm:px-2.5 ${isToday ? "border-primary/25 bg-primary/5 text-primary" : cell.inMonth ? "border-border/70 bg-background text-foreground hover:border-primary/20" : "border-transparent bg-muted/30 text-muted-foreground"}`}>
                    <span className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ${isToday ? "bg-primary text-primary-foreground" : ""}`}>{dayNumber(cell.iso)}</span>
                    <span className="mt-1 flex min-h-2 items-center justify-center gap-1 sm:justify-start">
                      {items.slice(0, 3).map((item) => <span key={item.key} className={`size-1.5 rounded-full ${item.done ? "bg-success" : dotStyle[item.kind]}`} />)}
                      {events.length ? <span className="size-1.5 rounded-full bg-primary ring-2 ring-primary/30" /> : null}
                    </span>
                    {main ? <span className="mt-1 hidden w-full truncate text-left text-[9px] text-muted-foreground sm:block">{main.topicId ? topicById[main.topicId].title : main.title}</span> : null}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Цвета плана" description="Разные типы дел легко отличить с первого взгляда.">
          <div className="flex flex-wrap gap-2">
            {(["study", "review", "mock", "reserve", "rest"] as PlanItemKind[]).map((kind) => (
              <span key={kind} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium ${kindStyle[kind]}`}>
                <span className={`size-1.5 rounded-full ${dotStyle[kind]}`} />{kindLabel[kind]}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/[0.05] px-3 py-1.5 text-[10px] font-medium text-success"><span className="size-1.5 rounded-full bg-success" />Выполнено</span>
          </div>
        </Panel>
        <Panel title="Мягкие правила" description="Как планировщик строит неделю.">
          <ul className="flex flex-col gap-2 text-xs leading-5 text-muted-foreground">
            <li className="flex gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" />Один резервный день и один день полного отдыха в неделю.</li>
            <li className="flex gap-2"><RotateCcw aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />Повторы через 2, 7 и 21 день ставятся сами.</li>
            <li className="flex gap-2"><MoveRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />Перенос не сбивает порядок тем — план пересчитывается.</li>
          </ul>
        </Panel>
      </div>

      <Dialog open={Boolean(selectedDate)} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDate ? formatDayMonth(selectedDate) : ""}</DialogTitle>
            <DialogDescription>План на выбранную дату.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {selectedItems.map((item) => renderItem(item))}
            {selectedDate ? eventsOn(selectedDate).map((event) => <div key={event.id} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">{event.label}</div>) : null}
            {!selectedItems.length && !(selectedDate && eventsOn(selectedDate).length) ? <p className="rounded-xl bg-muted/60 px-3.5 py-3 text-xs text-muted-foreground">На этот день пока нет занятий.</p> : null}
          </div>
          <DialogFooter><Button type="button" onClick={() => setSelectedDate(null)} className="rounded-xl">Закрыть</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <MoveDialog item={moving} onClose={() => { setMoving(null) }} />
    </div>
  )
}
