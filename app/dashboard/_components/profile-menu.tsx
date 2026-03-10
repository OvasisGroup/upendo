"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type Props = { email: string }

export function ProfileMenu({ email }: Props) {
  const initial = email?.[0]?.toUpperCase() ?? "U"
  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-xs">{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm text-muted-foreground max-w-[160px] truncate">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.href = "/dashboard")}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = "/members")}>My Profile</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
