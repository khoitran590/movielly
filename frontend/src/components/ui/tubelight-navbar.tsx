"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: readonly NavItem[]
  className?: string
  // Badge counts keyed by item url (e.g. pending friend requests).
  badges?: Record<string, number>
}

// Mobile dock. A quiet ink track with a tungsten underline on the active item —
// no tubelight halo, no brand glow.
export function NavBar({ items, className, badges }: NavBarProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "fixed bottom-[var(--mobile-dock-offset)] left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-1.5rem)]",
        className,
      )}
    >
      <div className="glass no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full p-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.url
          const badge = badges?.[item.url] ?? 0

          return (
            <Link
              key={item.name}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex w-[76px] flex-col items-center gap-1 rounded-full px-2 py-2 transition-colors",
                "focus-ring",
                isActive ? "text-screen" : "text-fog hover:text-screen",
              )}
            >
              <span className="relative">
                <Icon size={18} strokeWidth={2} aria-hidden />
                {badge > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ticket px-1 text-caption font-semibold leading-none text-ink"
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-caption font-medium leading-none">{item.name}</span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-tungsten transition-transform"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
