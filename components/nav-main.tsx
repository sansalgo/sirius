"use client"

import {
  Gift,
  Handshake,
  LayoutDashboard,
  Settings,
  StarIcon,
  Target,
  Users,
  Wallet,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"

const iconMap = {
  dashboard: LayoutDashboard,
  rewards: Gift,
  redemptions: Wallet,
  points: StarIcon,
  recognition: Handshake,
  challenges: Target,
  employees: Users,
  settings: Settings,
} as const

export type NavMainIcon = keyof typeof iconMap

export type NavMainItem = {
  title: string
  url: string
  icon?: NavMainIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({
  items,
}: {
  items: NavMainItem[]
}) {
  const router = useRouter()
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : null

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton onClick={() => router.push(item.url)} tooltip={item.title}>
                {Icon ? <Icon /> : null}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
