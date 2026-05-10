'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle, Menu, X, Rocket, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

const navigationGroups = [
  {
    title: 'Cosmic Tools',
    links: [
      { href: '/time-laboratory', label: 'Time Lab', description: 'Explore cosmic timing and events.' },
      { href: '/transits', label: 'Transits', description: 'Track planetary movements.' },
      { href: '/moon-phases', label: 'Moon Phases', description: 'Track the lunar cycle.' },
      { href: '/chart-of-the-moment', label: 'Chart of Moment', description: 'Current astrological chart.' },
      { href: '/chart-interpreter', label: 'Chart Interpreter', description: 'Interpret your charts.' },
      { href: '/elemental-chart', label: 'Elemental Chart', description: 'Balance of elements.' },
    ]
  },
  {
    title: 'Entities',
    links: [
      { href: '/planetary-council', label: 'Council', description: 'Converse with the planetary governing body.' },
      { href: '/planetary-agents', label: 'Consultations', description: '1-on-1 agent consultations.' },
      { href: '/astrological-agents', label: 'Astrological Agents', description: 'Agents based on astrological archetypes.' },
      { href: '/gallery', label: 'Gallery', description: 'Browse all available AI agents.' },
    ]
  },
  {
    title: 'Mystic Arts',
    links: [
      { href: '/philosophers-stone', label: "Philosopher's Stone", description: 'The ultimate alchemical operation.' },
      { href: '/rune-forge', label: 'Rune Forge', description: 'Cast and interpret ancient runes.' },
      { href: '/runes', label: 'Runes Library', description: 'Learn about individual runes.' },
      { href: '/synthesis-chamber', label: 'Synthesis Chamber', description: 'Combine elements and ideas.' },
      { href: '/tarot-dashboard', label: 'Tarot Dashboard', description: 'Draw cards and seek guidance.' },
    ]
  },
  {
    title: 'Labs & Learning',
    links: [
      { href: '/universe-learning', label: 'Universe Learning', description: 'Educational resources.' },
      { href: '/character-vectors', label: 'Character Vectors', description: 'Underlying agent vectors.' },
      { href: '/consciousness-demo', label: 'Consciousness Demo', description: 'Explore agent consciousness.' },
      { href: '/kinetics-demo', label: 'Kinetics Demo', description: 'Kinetic interactions.' },
      { href: '/alchm-quantities', label: 'Alchemical Quantities', description: 'Measure and manage energies.' },
    ]
  }
]

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground dark:hover:bg-gray-800",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none mb-1">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Function to determine if a group is active based on its links
  const isGroupActive = (links: { href: string }[]) => {
    return links.some(link => pathname === link.href || pathname?.startsWith(`${link.href}/`))
  }

  return (
    <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link
              href="/"
              className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap"
            >
              Planetary Agents
            </Link>
            
            <div className="hidden lg:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {navigationGroups.map((group) => (
                    <NavigationMenuItem key={group.title}>
                      <NavigationMenuTrigger 
                        className={cn(
                          "bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent focus:bg-transparent dark:focus:bg-transparent data-[state=open]:bg-transparent dark:data-[state=open]:bg-transparent",
                          isGroupActive(group.links) 
                            ? 'text-purple-600 dark:text-purple-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {group.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white dark:bg-gray-950 border dark:border-gray-800 shadow-xl rounded-md">
                          {group.links.map((link) => (
                            <ListItem
                              key={link.href}
                              title={link.label}
                              href={link.href}
                              className={
                                pathname === link.href || pathname?.startsWith(`${link.href}/`)
                                  ? 'bg-purple-50 dark:bg-purple-900/20'
                                  : ''
                              }
                            >
                              {link.description}
                            </ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link href="/dashboard">
               <Button variant="ghost" size="icon" aria-label="Dashboard">
                 <Rocket className="h-5 w-5 text-gray-700 dark:text-gray-300" />
               </Button>
            </Link>
            <Link href="/login">
               <Button variant="ghost" size="icon" aria-label="Login">
                 <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
               </Button>
            </Link>
            <Button
              onClick={() => {
                /* Monica chat bubble is always available */
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 whitespace-nowrap hidden lg:flex"
              disabled
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Monica Available
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.title} className="px-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{group.title}</h3>
                <div className="space-y-1 pl-4 border-l-2 border-purple-100 dark:border-purple-900">
                  {group.links.map((link) => {
                    const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-3 py-2 rounded-md transition-colors text-sm ${
                          isActive
                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
            
            <div className="px-4 pt-4 border-t mt-4 space-y-3 pb-6">
              <div className="flex space-x-2">
                <Link href="/dashboard" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    <Rocket className="w-4 h-4 mr-2" /> Dashboard
                  </Button>
                </Link>
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    <User className="w-4 h-4 mr-2" /> Login
                  </Button>
                </Link>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Monica Available
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
