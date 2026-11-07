import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Priority, TopicStatus } from "@/lib/types"

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={cn("lift gap-0 rounded-2xl border-border/80 bg-card/90 py-0 shadow-sm shadow-black/[0.04] backdrop-blur-sm", className)}>
      {title ? (
        <CardHeader className="flex grid-cols-none grid-rows-none flex-row items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">{title}</CardTitle>
            {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("px-5 pb-5", title ? "pt-0" : "pt-5", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  const copy: Record<TopicStatus, string> = {
    mastered: "Закреплено",
    in_progress: "В процессе",
    needs_review: "Нужен повтор",
    not_started: "Не начато",
  }
  const style: Record<TopicStatus, string> = {
    mastered: "border-success/20 bg-success/10 text-success",
    in_progress: "border-primary/20 bg-primary/10 text-primary",
    needs_review: "border-warning/20 bg-warning/10 text-warning",
    not_started: "border-border bg-muted text-muted-foreground",
  }

  return <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", style[status])}>{copy[status]}</Badge>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const copy: Record<Priority, string> = {
    foundation: "База",
    high: "Ключевая тема",
    normal: "Закрепление",
  }
  const style: Record<Priority, string> = {
    foundation: "border-success/20 bg-success/10 text-success",
    high: "border-primary/20 bg-primary/10 text-primary",
    normal: "border-border bg-muted text-muted-foreground",
  }

  return <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", style[priority])}>{copy[priority]}</Badge>
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border bg-muted/40 px-3.5 py-3 text-xs leading-5 text-muted-foreground">{children}</p>
}
