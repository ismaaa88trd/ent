import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const geist = { variable: "" }

export const metadata: Metadata = {
  title: "ЕНТ: Маршрут — план подготовки",
  description: "Удобный персональный план подготовки к ЕНТ: темы, повторы, пробники и фокус-сессии.",
  applicationName: "ЕНТ: Маршрут",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0e0b16" }],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="ent-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
