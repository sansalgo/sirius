"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BadgeCheckIcon,
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { authClient } from "@/lib/auth-client"
import type { AppRole } from "@/lib/rbac"

export function NavUser({
  availablePoints,
  role,
}: {
  availablePoints: number
  role: AppRole
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { data: session } = authClient.useSession()

  const initial = session?.user?.name
    ? session.user.name[0].toUpperCase()
    : "?"

  const handleSignOut = () => {
    startTransition(async () => {
      const { error } = await authClient.signOut()

      if (error) {
        return
      }

      router.push("/login")
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {role === "EMPLOYEE" ? (
        <div className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
          <Wallet className="h-4 w-4" />
          <span className="font-medium">{availablePoints}</span>
        </div>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                router.push("/account")
              }}
            >
              <BadgeCheckIcon />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                router.push("/billing")
              }}
            >
              <CreditCardIcon />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BellIcon />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isPending}
            onSelect={(event) => {
              event.preventDefault()
              handleSignOut()
            }}
          >
            <LogOutIcon />
            {isPending ? "Signing Out..." : "Sign Out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
