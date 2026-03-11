import {
  StarIcon,
} from "lucide-react"
import type { ComponentProps } from "react"

import { can, type AppRole } from "@/lib/rbac"
import { NavMain, type NavMainItem } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar"

export function AppSidebar({
  role,
  ...props
}: ComponentProps<typeof Sidebar> & { role: AppRole }) {
  const navMain = [
    {
      title: "Leaderboard",
      url: "/dashboard",
      icon: "dashboard",
      visible: can(role, "dashboard.view"),
    },
    {
      title: "Rewards",
      url: "/rewards",
      icon: "rewards",
      visible: can(role, "rewards.view"),
    },
    {
      title: "Redemptions",
      url: "/redemptions",
      icon: "redemptions",
      visible: can(role, "redemptions.view"),
    },
    {
      title: "Points",
      url: "/points",
      icon: "points",
      visible: can(role, "points.view"),
    },
    {
      title: "Recognition",
      url: "/recognition",
      icon: "recognition",
      visible: can(role, "recognition.view"),
    },
    {
      title: "Challenges",
      url: "/challenges",
      icon: "challenges",
      visible: can(role, "challenges.view"),
    },
    {
      title: "Employees",
      url: "/employees",
      icon: "employees",
      visible: can(role, "employees.read"),
    },
    {
      title: "Settings",
      url: "/settings",
      icon: "settings",
      visible: can(role, "settings.view"),
    },
  ] as const

  const visibleNavMain: NavMainItem[] = navMain
    .filter((item) => item.visible)
    .map((item) => ({
      title: item.title,
      url: item.url,
      icon: item.icon,
    }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <StarIcon fill="white" className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">SIRIUS</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
