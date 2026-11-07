"use client"

import { useEffect, useMemo, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
    </div>
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted ? resolvedTheme === "dark" : true
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="size-9 rounded-xl border-border/80 bg-card/70 transition-transform hover:rotate-12"
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}

type OrbRing = { label: string; done: number; total: number }

/** «Живая» модель маршрута: три кольца-предмета с орбитами. Проценты — доля выполненных сессий, не прогноз. */
export function RouteOrb({ rings, size = 132 }: { rings: OrbRing[]; size?: number }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80)
    return () => window.clearTimeout(t)
  }, [])
  const totalDone = rings.reduce((s, r) => s + r.done, 0)
  const total = rings.reduce((s, r) => s + r.total, 0)
  const percent = total ? Math.round((totalDone / total) * 100) : 0
  const radii = [58, 44, 30]
  const colors = ["var(--primary)", "var(--chart-4)", "var(--success)"]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Выполнено ${totalDone} из ${total} сессий маршрута`}>
      <div className="absolute inset-3 rounded-full bg-primary/10 blur-xl" />
      <svg viewBox="0 0 140 140" className="relative size-full -rotate-90">
        {rings.map((ring, i) => {
          const r = radii[i]
          const c = 2 * Math.PI * r
          const frac = ring.total ? ring.done / ring.total : 0
          return (
            <g key={ring.label}>
              <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="6" opacity="0.7" />
              <circle
                cx="70" cy="70" r={r} fill="none" stroke={colors[i]} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={ready ? c * (1 - Math.max(frac, frac > 0 ? 0.02 : 0)) : c}
                style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.2,0.7,0.2,1) ${i * 150}ms` }}
              />
            </g>
          )
        })}
      </svg>
      <div className="spin-slow absolute inset-0" aria-hidden="true">
        <span className="absolute left-1/2 top-[1px] size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
      </div>
      <div className="spin-reverse absolute inset-[11px]" aria-hidden="true">
        <span className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-chart-4 shadow-[0_0_8px_var(--chart-4)]" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold leading-none tracking-tight">{percent}%</span>
        <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.12em] text-muted-foreground">маршрут</span>
      </div>
    </div>
  )
}

/** Лёгкий салют при завершении сессии. */
export function Burst({ tick }: { tick: number }) {
  const [visible, setVisible] = useState(false)
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4
        const dist = 110 + Math.random() * 190
        const palette = ["var(--primary)", "var(--chart-4)", "var(--success)", "var(--warning)", "var(--chart-5)"]
        return { id: i, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 40, rot: Math.round(Math.random() * 540 - 270), color: palette[i % palette.length], delay: Math.random() * 120 }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  )
  useEffect(() => {
    if (!tick) return
    setVisible(true)
    const t = window.setTimeout(() => setVisible(false), 1600)
    return () => window.clearTimeout(t)
  }, [tick])
  if (!visible) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2">
        {particles.map((p) => (
          <span key={p.id} className="burst-particle" style={{ background: p.color, animationDelay: `${p.delay}ms`, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px`, ["--rot" as string]: `${p.rot}deg` }} />
        ))}
      </div>
    </div>
  )
}
