"use client"

import { useEffect, useState } from "react"
import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  GraduationCap,
  Map,
  Settings2,
  Sun,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AmbientBackground, Burst, ThemeToggle } from "@/components/ent/visuals"
import { FocusScreen } from "@/components/ent/focus-screen"
import { CalendarScreen } from "@/components/ent/calendar-screen"
import { ExamsScreen } from "@/components/ent/exams-screen"
import { RouteScreen } from "@/components/ent/route-screen"
import { SettingsScreen } from "@/components/ent/settings-screen"
import { TodayScreen } from "@/components/ent/today-screen"
import { TopicScreen } from "@/components/ent/topic-screen"
import { AppProvider, useApp, type FinishTarget } from "@/lib/store"
import { topicById } from "@/lib/curriculum"
import { formatLong, pluralize } from "@/lib/dates"
import type { Subject } from "@/lib/types"
import { cn } from "@/lib/utils"

type Screen = "today" | "route" | "calendar" | "exams" | "settings" | "topic" | "focus"
type NavigationScreen = Exclude<Screen, "topic" | "focus">

const navigation: Array<{ id: NavigationScreen; label: string; icon: LucideIcon }> = [
  { id: "today", label: "Сегодня", icon: Sun },
  { id: "route", label: "Мой маршрут", icon: Map },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
  { id: "exams", label: "Пробники", icon: ClipboardCheck },
  { id: "settings", label: "Настройки", icon: Settings2 },
]

export function EntApp() {
  return (
    <AppProvider>
      <EntShell />
    </AppProvider>
  )
}

function EntShell() {
  const { today, daysToExam, stats, state, startFocus, celebrateTick } = useApp()
  const [screen, setScreen] = useState<Screen>("today")
  const [subject, setSubject] = useState<Subject>("algebra")
  const [selectedTopicId, setSelectedTopicId] = useState("a2-powers")
  const [focusReturnScreen, setFocusReturnScreen] = useState<Screen>("today")
  const selectedTopic = topicById[selectedTopicId] ?? topicById["a2-powers"]
  const activeNavigation = screen === "topic" ? "route" : screen === "focus" ? "today" : screen
  const weeklyCompleted = stats.doneThisWeek
  const weeklyGoal = Math.max(stats.plannedThisWeek, 1)

  function openTopic(topicId: string) {
    setSelectedTopicId(topicId)
    setScreen("topic")
  }

  function openFocus(target?: FinishTarget) {
    if (target) startFocus(target)
    setFocusReturnScreen(screen === "topic" ? "topic" : screen === "calendar" ? "calendar" : "today")
    setScreen("focus")
  }

  function exitFocus() {
    setScreen(focusReturnScreen === "focus" ? "today" : focusReturnScreen)
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [screen, selectedTopicId])

  if (screen === "focus") {
    return (
      <>
        <AmbientBackground />
        <div className="relative z-10"><FocusScreen onExit={exitFocus} onOpenTopic={openTopic} /></div>
        <Burst tick={celebrateTick} />
      </>
    )
  }

  const view = (() => {
    switch (screen) {
      case "today":
        return <TodayScreen onOpenTopic={openTopic} onStartFocus={openFocus} onNavigate={setScreen} />
      case "route":
        return <RouteScreen subject={subject} onSubjectChange={setSubject} onOpenTopic={openTopic} />
      case "calendar":
        return <CalendarScreen onOpenTopic={openTopic} onStartFocus={openFocus} />
      case "exams":
        return <ExamsScreen onOpenTopic={openTopic} />
      case "settings":
        return <SettingsScreen />
      case "topic":
        return <TopicScreen topic={selectedTopic} onBack={() => setScreen("route")} onStartFocus={openFocus} onOpenTopic={openTopic} />
    }
  })()

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AmbientBackground />
      <Burst tick={celebrateTick} />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-border/80 bg-sidebar/95 backdrop-blur md:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-border/70 px-5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30 animate-glow">
            <GraduationCap aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">ЕНТ: Маршрут</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Твой план подготовки</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-3 py-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Подготовка</p>
          <nav aria-label="Основная навигация" className="flex flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = activeNavigation === item.id
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setScreen(item.id)}
                  className={cn(
                    "h-11 w-full justify-start rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                  {isActive ? <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-primary" /> : null}
                </Button>
              )
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-border/70 bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <BookOpenCheck aria-hidden="true" className="size-4 text-primary" />
                План недели
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{weeklyCompleted}/{weeklyGoal}</span>
            </div>
            <div
              role="progressbar"
              aria-label="Выполнено занятий за неделю"
              aria-valuemin={0}
              aria-valuemax={weeklyGoal}
              aria-valuenow={weeklyCompleted}
              className="h-1.5 overflow-hidden rounded-full bg-border"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${(weeklyCompleted / weeklyGoal) * 100}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{stats.plannedThisWeek === 0 ? "На этой неделе занятий нет" : weeklyGoal - weeklyCompleted > 0 ? `Осталось ${weeklyGoal - weeklyCompleted} ${pluralize(weeklyGoal - weeklyCompleted, "занятие", "занятия", "занятий")}` : "Неделя выполнена"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border/70 px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">МИ</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">Математика + Информатика</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">ЕНТ · {state.settings.examDate.slice(0, 4)}</p>
          </div>
          <Clock3 aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
      </aside>

      <div className="relative z-10 min-h-screen md:pl-[236px]">
        <header className="border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground md:hidden">
                <GraduationCap aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">План подготовки к ЕНТ</p>
                <p className="mt-0.5 hidden text-sm font-medium sm:block">{formatLong(today)}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Badge variant="secondary" className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-foreground sm:px-3 sm:py-1.5 sm:text-xs">
                <Clock3 data-icon="inline-start" />
                <span className="hidden min-[400px]:inline">{daysToExam > 0 ? `${daysToExam} ${pluralize(daysToExam, "день", "дня", "дней")} до ЕНТ` : "Дата ЕНТ прошла — обнови её"}</span>
                <span className="min-[400px]:hidden">{daysToExam > 0 ? `${daysToExam} дн.` : "Дата прошла"}</span>
              </Badge>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-10 lg:px-8">
          <div key={`${screen}-${selectedTopicId}`} className="animate-fade-up">{view}</div>
        </main>
      </div>

      <nav aria-label="Нижняя навигация" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border/80 bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = activeNavigation === item.id
          return (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              aria-current={isActive ? "page" : undefined}
              onClick={() => setScreen(item.id)}
              className={cn(
                "h-auto min-h-14 flex-col gap-1 rounded-xl !px-0.5 py-1.5 text-[9px] leading-tight text-muted-foreground sm:text-[10px]",
                isActive && "bg-primary/5 text-primary",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="line-clamp-2 text-center">{item.label === "Мой маршрут" ? "Маршрут" : item.label}</span>
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
