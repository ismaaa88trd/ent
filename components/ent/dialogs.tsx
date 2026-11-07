"use client"

import { ArrowRight, Check, MoveRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { topicById } from "@/lib/curriculum"
import { addDays, formatDayMonth } from "@/lib/dates"
import { dayType } from "@/lib/planner"
import { useApp, type FinishTarget } from "@/lib/store"
import type { PlanItem } from "@/lib/types"

export function targetFromItem(item: PlanItem, plannedMinutes: number): FinishTarget | null {
  if (!item.topicId) return null
  return {
    itemKey: item.key,
    topicId: item.topicId,
    kind: item.kind === "review" ? "review" : "study",
    sessionNo: item.sessionNo,
    reviewTaskId: item.reviewTaskId,
    plannedMinutes,
  }
}

/** Выбор результата после занятия: понял / есть ошибки / перенести. */
export function ResultDialog({
  open,
  onOpenChange,
  target,
  elapsedMinutes,
  stuck,
  onFinished,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: FinishTarget | null
  elapsedMinutes?: number
  stuck?: string
  onFinished: () => void
}) {
  const { finish } = useApp()
  if (!target) return null
  const topic = topicById[target.topicId]

  function choose(outcome: "understood" | "errors" | "postpone") {
    finish(outcome, target!, { elapsedMinutes, stuck })
    onOpenChange(false)
    onFinished()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Как прошло занятие?</DialogTitle>
          <DialogDescription>{topic?.title}. Любой вариант нормален — план подстроится.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => choose("understood")} className="h-auto justify-between rounded-xl py-3 text-left">
            <span className="flex items-center gap-2"><Check data-icon="inline-start" />Сделано — понял</span>
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button type="button" variant="outline" onClick={() => choose("errors")} className="h-auto justify-between rounded-xl py-3 text-left">
            <span className="flex items-center gap-2"><RotateCcw data-icon="inline-start" />Есть ошибки — вернуть на повтор</span>
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => choose("postpone")} className="h-auto justify-start rounded-xl py-3 text-muted-foreground">
            <MoveRight data-icon="inline-start" />Перенести — вернусь позже
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Спокойный перенос: на резервный день или в ближайшее свободное окно. */
export function MoveDialog({ item, onClose }: { item: PlanItem | null; onClose: () => void }) {
  const { moveItem, today, state } = useApp()
  if (!item) return null

  const base = item.date > today ? item.date : today
  let reserve = addDays(base, 1)
  for (let i = 1; i < 21; i++) {
    const date = addDays(base, i)
    if (dayType(date, state.settings) === "reserve") {
      reserve = date
      break
    }
  }
  const isReview = item.kind === "review"

  function apply(mode: "reserve" | "next") {
    moveItem(item!.key, item!.date, mode)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Перенести занятие</DialogTitle>
          <DialogDescription>Такое бывает. План пересчитается, порядок тем не собьётся.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border/70 bg-muted/50 p-3.5 text-xs font-medium">{item.title}</div>
        <div className="flex flex-col gap-2">
          {!isReview ? (
            <Button type="button" onClick={() => apply("reserve")} className="h-auto justify-between rounded-xl py-3 text-left">
              <span>На резервный день<span className="ml-1 font-normal opacity-80">· {formatDayMonth(reserve)}</span></span>
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : null}
          <Button type="button" variant={isReview ? "default" : "outline"} onClick={() => apply("next")} className="h-auto justify-between rounded-xl py-3 text-left">
            <span>{isReview ? "На завтра" : "На ближайшее свободное окно"}</span>
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
