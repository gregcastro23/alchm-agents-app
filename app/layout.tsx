import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Alchm Kitchen - Astrological Agents",
  description: "Advanced astrological agents powered by AI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="border-b">
            <div className="container flex items-center justify-between h-16">
              <Link href="/" className="font-bold text-xl">
                Alchm Kitchen
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/astrological-agents" className="text-sm font-medium">
                  Agents
                </Link>
                <Link href="/planetary-agents" className="text-sm font-medium">
                  Planetary Wisdom
                </Link>
                <Link href="/chart-of-the-moment" className="text-sm font-medium">
                  Chart of the Moment
                </Link>
                <Link href="/chart-interpreter" className="text-sm font-medium">
                  Chart Interpreter
                </Link>
                <Link href="/elemental-chart" className="text-sm font-medium">
                  Elemental Chart
                </Link>
                <Link href="/planetary-agents/galileo" className="text-sm font-medium">
                  Galileo Agents
                </Link>
                <Link href="/planetary-agents/model-training" className="text-sm font-medium">
                  Model Training
                </Link>
                <Link href="/planetary-agents/alchm-quantities" className="text-sm font-medium">
                  Alchm Quantities
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
