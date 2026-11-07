"use client"

import { useRef, useState } from "react"
import { CalendarDays, Cloud, CloudOff, Download, ExternalLink, GraduationCap, LogOut, Plus, RotateCcw, Trash2, Upload } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EmptyHint, Panel, PageHeading } from "@/components/ent/common"
import { formatDayMonth, pluralize } from "@/lib/dates"
import { useApp } from "@/lib/store"
import type { Intensity } from "@/lib/types"

const weekdays = [
  { value: "1", label: "Пн" }, { value: "2", label: "Вт" }, { value: "3", label: "Ср" }, { value: "4", label: "Чт" },
  { value: "5", label: "Пт" }, { value: "6", label: "Сб" }, { value: "0", label: "Вс" },
]
const intensityInfo: Record<Intensity, { label: string; text: string }> = {
  light: { label: "Лёгкий", text: "Около 3 учебных дней в неделю, по одной сессии." },
  normal: { label: "Нормальный", text: "4–5 учебных дней, по одной сессии 45–60 минут." },
  intense: { label: "Интенсивный", text: "До двух сессий в день (вторая — короткая, до 30 минут)." },
}

export function SettingsScreen() {
  const { state, daysToExam, updateSettings, addImportantDate, removeImportantDate, resetDemo, syncStatus, importState } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const s = state.settings
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [date, setDate] = useState("")
  const [detail, setDetail] = useState("")
  const reserveInRest = s.restDays.includes(s.reserveDay)

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="ПОДСТРОЙ ПЛАН ПОД СЕБЯ"
        title="Настройки"
        description="Изменения сохраняются сразу, а план пересчитывается автоматически. Меняй темп, а не пытайся уместить всё сразу."
        action={<span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1.5 text-[10px] font-medium text-muted-foreground"><GraduationCap aria-hidden="true" className="size-3.5 text-primary" />ЕНТ · {s.examDate.slice(0, 4)}</span>}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          <Panel title="Экзамен" description="Дату нужно вводить вручную и сверять с официальным сайтом НЦТ.">
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="exam-date" className="text-xs font-medium">Дата ЕНТ</FieldLabel>
                  <Input id="exam-date" type="date" value={s.examDate} onChange={(e) => e.target.value && updateSettings({ examDate: e.target.value })} className="h-10 rounded-xl bg-background text-sm" />
                  <FieldDescription className="text-[10px]">{daysToExam > 0 ? `Осталось ${daysToExam} ${pluralize(daysToExam, "день", "дня", "дней")}. ` : "Дата уже прошла. "}Примерная дата — проверь на testcenter.kz.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="reg-url" className="text-xs font-medium">Ссылка на регистрацию</FieldLabel>
                  <Input id="reg-url" type="url" value={s.registrationUrl} onChange={(e) => updateSettings({ registrationUrl: e.target.value })} className="h-10 rounded-xl bg-background text-sm" />
                  <FieldDescription className="text-[10px]"><a href={s.registrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Открыть<ExternalLink aria-hidden="true" className="size-3" /></a></FieldDescription>
                </Field>
              </div>
            </FieldGroup>
          </Panel>

          <Panel title="Нагрузка" description="Планировщик учитывает часы, дни отдыха и резерв.">
            <FieldGroup className="gap-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="h-week" className="text-xs font-medium">Часов в будни</FieldLabel>
                  <Input id="h-week" type="number" min={0} max={8} step={0.5} value={s.weekdayHours} onChange={(e) => updateSettings({ weekdayHours: Math.max(0, Number(e.target.value)) })} className="h-10 rounded-xl bg-background text-sm" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="h-end" className="text-xs font-medium">Часов в выходные</FieldLabel>
                  <Input id="h-end" type="number" min={0} max={12} step={0.5} value={s.weekendHours} onChange={(e) => updateSettings({ weekendHours: Math.max(0, Number(e.target.value)) })} className="h-10 rounded-xl bg-background text-sm" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="focus-min" className="text-xs font-medium">Фокус-сессия</FieldLabel>
                  <ToggleGroup id="focus-min" type="single" value={String(s.focusMinutes)} onValueChange={(v) => v && updateSettings({ focusMinutes: Number(v) as 25 | 45 | 60 })} className="grid grid-cols-3 gap-1 rounded-xl border border-border/70 bg-muted/60 p-1">
                    {[25, 45, 60].map((m) => <ToggleGroupItem key={m} value={String(m)} variant="default" className="h-8 rounded-lg border-0 text-xs text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm">{m}</ToggleGroupItem>)}
                  </ToggleGroup>
                </Field>
              </div>

              <FieldSet className="gap-2.5">
                <FieldLegend variant="label" className="mb-0 text-xs font-medium">Дни полного отдыха</FieldLegend>
                <ToggleGroup type="multiple" value={s.restDays.map(String)} onValueChange={(v) => updateSettings({ restDays: v.map(Number) })} aria-label="Дни отдыха" className="flex flex-wrap justify-start gap-1.5">
                  {weekdays.map((d) => <ToggleGroupItem key={d.value} value={d.value} variant="outline" className="h-9 flex-none rounded-xl border-border px-3.5 text-xs font-medium text-muted-foreground data-[state=on]:border-primary/20 data-[state=on]:bg-primary/5 data-[state=on]:text-primary">{d.label}</ToggleGroupItem>)}
                </ToggleGroup>
              </FieldSet>

              <FieldSet className="gap-2.5">
                <FieldLegend variant="label" className="mb-0 text-xs font-medium">Резервный день</FieldLegend>
                <FieldDescription className="text-[10px]">Сюда переносятся занятия — новая тема в этот день не ставится.</FieldDescription>
                <ToggleGroup type="single" value={String(s.reserveDay)} onValueChange={(v) => v && updateSettings({ reserveDay: Number(v) })} aria-label="Резервный день" className="flex flex-wrap justify-start gap-1.5">
                  {weekdays.map((d) => <ToggleGroupItem key={d.value} value={d.value} variant="outline" className="h-9 flex-none rounded-xl border-border px-3.5 text-xs font-medium text-muted-foreground data-[state=on]:border-primary/20 data-[state=on]:bg-primary/5 data-[state=on]:text-primary">{d.label}</ToggleGroupItem>)}
                </ToggleGroup>
                {reserveInRest ? <p className="text-[10px] text-warning">Этот день выбран и как отдых, и как резерв — он будет считаться днём отдыха.</p> : null}
              </FieldSet>

              <FieldSet className="gap-2.5">
                <FieldLegend variant="label" className="mb-0 text-xs font-medium">Интенсивность</FieldLegend>
                <ToggleGroup type="single" value={s.intensity} onValueChange={(v) => v && updateSettings({ intensity: v as Intensity })} aria-label="Интенсивность" className="grid w-full max-w-lg grid-cols-3 gap-1 rounded-xl border border-border/70 bg-muted/60 p-1">
                  {(Object.keys(intensityInfo) as Intensity[]).map((k) => <ToggleGroupItem key={k} value={k} variant="default" className="h-9 rounded-lg border-0 text-xs text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm">{intensityInfo[k].label}</ToggleGroupItem>)}
                </ToggleGroup>
                <FieldDescription className="text-[10px]">{intensityInfo[s.intensity].text}</FieldDescription>
              </FieldSet>
            </FieldGroup>
          </Panel>

          <Panel title="Важные даты" description="Регистрация, дедлайны, попытки — добавляй свои. Реальные даты не зашиты в приложение.">
            <div className="flex flex-col gap-2">
              {state.importantDates.length ? state.importantDates.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-2.5">
                  <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{item.label}{item.date ? ` · ${formatDayMonth(item.date)}` : ""}</p>
                    {item.detail ? <p className="text-[10px] text-muted-foreground">{item.detail}</p> : null}
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label="Удалить дату" onClick={() => removeImportantDate(item.id)} className="size-7 rounded-lg text-muted-foreground"><Trash2 /></Button>
                </div>
              )) : <EmptyHint>Дат пока нет.</EmptyHint>}
            </div>
            <form
              className="mt-4 grid gap-2 sm:grid-cols-[1fr_150px_auto]"
              onSubmit={(e) => {
                e.preventDefault()
                if (!label.trim()) return
                addImportantDate({ label: label.trim(), date: date || undefined, detail: detail.trim() || undefined, needsCheck: true })
                setLabel(""); setDate(""); setDetail("")
              }}
            >
              <Input aria-label="Название" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Например: дедлайн регистрации" className="h-9 rounded-xl text-xs" />
              <Input aria-label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-xl text-xs" />
              <Button type="submit" className="h-9 rounded-xl"><Plus data-icon="inline-start" />Добавить</Button>
            </form>
          </Panel>
        </div>

        <aside className="flex flex-col gap-5">
          <Panel title="Доступ" description="Вход по паролю, один пользователь — это ты.">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" })
                window.location.href = "/login"
              }}
              className="h-10 w-full justify-start rounded-xl"
            >
              <LogOut data-icon="inline-start" />Выйти из аккаунта
            </Button>
          </Panel>

          <Panel title="Данные и база" description="Прогресс сохраняется в браузере и в файле базы на сервере.">
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 p-3.5">
              {syncStatus === "offline" ? <CloudOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" /> : <Cloud aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />}
              <p className="text-xs leading-5 text-muted-foreground">
                {syncStatus === "offline"
                  ? "Сервер базы недоступен — данные пока хранятся только в этом браузере. Сделай экспорт, чтобы не потерять их."
                  : syncStatus === "saving"
                    ? "Сохраняю в базу…"
                    : syncStatus === "loading"
                      ? "Подключаюсь к базе…"
                      : "Всё сохранено в базе (файл data/state.json) и в браузере."}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
                  const link = document.createElement("a")
                  link.href = URL.createObjectURL(blob)
                  link.download = `ent-marshrut-${new Date().toISOString().slice(0, 10)}.json`
                  link.click()
                  URL.revokeObjectURL(link.href)
                }}
                className="h-10 w-full justify-start rounded-xl"
              >
                <Download data-icon="inline-start" />Экспорт в файл
              </Button>
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="h-10 w-full justify-start rounded-xl">
                <Upload data-icon="inline-start" />Импорт из файла
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (!file) return
                  try {
                    const ok = importState(JSON.parse(await file.text()))
                    setImportMessage(ok ? "Данные импортированы." : "Файл не похож на экспорт этого приложения.")
                  } catch {
                    setImportMessage("Не удалось прочитать файл.")
                  }
                }}
              />
              {importMessage ? <p className="px-1 text-[10px] text-muted-foreground" role="status">{importMessage}</p> : null}
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)} className="h-10 w-full justify-start rounded-xl text-destructive"><RotateCcw data-icon="inline-start" />Сбросить все данные</Button>
            </div>
          </Panel>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить все данные?</AlertDialogTitle>
            <AlertDialogDescription>Весь прогресс, заметки, пробники и настройки будут удалены, и план начнётся с первой темы. Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={resetDemo} className="rounded-xl">Сбросить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
