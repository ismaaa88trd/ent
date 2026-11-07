"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCap, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AmbientBackground, ThemeToggle } from "@/components/ent/visuals"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.message ?? "Не получилось войти.")
        setLoading(false)
        return
      }
      router.replace(params.get("next") || "/")
      router.refresh()
    } catch {
      setError("Нет связи с сервером. Попробуй ещё раз.")
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBackground />
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="relative z-10 w-full max-w-sm animate-fade-up rounded-2xl border border-border/80 bg-card/90 p-6 shadow-lg shadow-black/[0.08] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30 animate-glow">
            <GraduationCap aria-hidden="true" className="size-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">ЕНТ: Маршрут</h1>
          <p className="mt-1 text-xs text-muted-foreground">Личный план — вход только для тебя</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password" className="text-xs">Пароль</FieldLabel>
              <div className="relative">
                <Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-xl bg-background pl-9 text-sm"
                  placeholder="Введи пароль"
                  required
                />
              </div>
            </Field>
          </FieldGroup>
          {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading || !password} className="h-11 rounded-xl">
            {loading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Lock data-icon="inline-start" />}
            Войти
          </Button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
