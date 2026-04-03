"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Users, Settings, BookOpen, LogOut, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LifeChurchLogo } from "@/components/ui/life-church-logo"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Inicio", roles: ["leader", "coordinator", "volunteer"] },
  { href: "/schedule", icon: Calendar, label: "Programa", roles: ["leader", "coordinator"] },
  { href: "/disponibilidad", icon: CheckSquare, label: "Disponib.", roles: ["leader", "coordinator"] },
  { href: "/sunday", icon: BookOpen, label: "Domingo", roles: ["leader", "coordinator"] },
  { href: "/voluntarios", icon: Users, label: "Voluntarios", roles: ["leader"] },
  { href: "/mi-escala", icon: Calendar, label: "Mi Escala", roles: ["volunteer"] },
  { href: "/configuracion", icon: Settings, label: "Config.", roles: ["leader"] },
]

interface NavProps {
  profile: Profile
}

export function BottomNav({ profile }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleItems = navItems.filter((item) => item.roles.includes(profile.role))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[56px]",
                active ? "text-blue-600" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[56px] text-gray-500"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Salir</span>
        </button>
      </div>
    </nav>
  )
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="bg-black text-white px-4 pt-4 pb-4">
      <LifeChurchLogo variant="white" size="sm" />
      <h1 className="text-xl font-bold mt-2">{title}</h1>
      {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
    </header>
  )
}
