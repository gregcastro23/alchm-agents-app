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

  const navigationGroups = [
    {
      title: "🧠 Core AI",
      items: [
        { href: "/monica-guide", label: "Meet Monica" },
        { href: "/philosophers-stone", label: "The Philosopher's Stone" },
      ]
    },
    {
      title: "🔮 Divination",
      items: [
        { href: "/tarot-dashboard", label: "Tarot Dashboard" },
        { href: "/chart-interpreter", label: "Chart Interpreter" },
        { href: "/moon-phases", label: "Moon Phases" },
      ]
    },
    {
      title: "🌟 Analysis",
      items: [
        { href: "/planetary-agents", label: "Planetary Wisdom" },
        { href: "/", label: "Current Chart" },
        { href: "/elemental-chart", label: "Elemental Chart" },
        { href: "/planetary-agents/alchm-quantities", label: "Alchm Quantities" },
      ]
    },
    {
      title: "⚙️ System",
      items: [
        { href: "/astrological-agents", label: "Agents" },
        { href: "/galileo-setup", label: "Galileo Setup" },
        { href: "/consciousness-survey", label: "Survey" },
        { href: "/universe-learning", label: "Learning" },
      ]
    }
  ]

  // Flatten for mobile view
  const allNavItems = navigationGroups.flatMap(group => group.items)

  return (
    <header className="border-b">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl">
          Alchm ©
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navigationGroups.map((group) => (
            <div key={group.title} className="relative group">
              <span className="text-sm font-medium text-muted-foreground cursor-default">
                {group.title}
              </span>
              <div className="absolute top-full left-0 mt-2 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Simplified Desktop Navigation for medium screens */}
        <nav className="hidden md:flex lg:hidden items-center gap-4">
          {allNavItems.slice(0, 6).map((item) => (
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
          <nav className="container py-4 space-y-4">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2 px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}