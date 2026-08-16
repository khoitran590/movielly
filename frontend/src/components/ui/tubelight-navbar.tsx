"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useMedia"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

// Mobile dock. A quiet ink track with a tungsten underline on the active item —
// no tubelight halo, no brand glow.
export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()

  return (
    <nav
      aria-label="Sections"
      className={cn("fixed bottom-0 left-1/2 z-50 mb-5 -translate-x-1/2", className)}
    >
      <div className="glass flex items-center gap-1 rounded-full p-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.url

          return (
            <Link
              key={item.name}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex w-[76px] flex-col items-center gap-1 rounded-full px-2 py-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                isActive ? "text-screen" : "text-fog hover:text-screen",
              )}
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
              <span className="text-[11px] font-medium leading-none">{item.name}</span>
              {isActive && (
                <motion.span
                  layoutId="dock-active"
                  aria-hidden
                  className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-tungsten"
                  initial={false}
                  transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
