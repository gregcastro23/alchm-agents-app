"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, MenuIcon, XIcon } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navigation = [
    { href: "/monica-guide", label: "💚 Meet Monica" },
    { href: "/tarot-dashboard", label: "🔮 Tarot Dashboard" },
    { href: "/consciousness-survey", label: "🧠 Consciousness AI" },
    { href: "/chart-of-the-moment", label: "Chart of the Moment" },
    { href: "/astrological-agents", label: "Agents" },
    { href: "/planetary-agents", label: "Planetary Wisdom" },
    { href: "/chart-interpreter", label: "Chart Interpreter" },
    { href: "/planetary-agents/galileo", label: "Galileo Agents" },
    { href: "/planetary-agents/model-training", label: "Model Training" },
    { href: "/planetary-agents/alchm-quantities", label: "Alchm Quantities" },
    { href: "/galileo-setup", label: "Galileo Setup" },
  ]

  return (
    <header className="border-b">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl">
          Alchm ©
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Theme Toggle */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <MenuIcon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 flex flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}