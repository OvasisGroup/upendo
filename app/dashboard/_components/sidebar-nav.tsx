"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Home, Landmark, Users, Boxes, Building2, GitBranch, UserCog, ShieldCheck, Settings, ClipboardList } from "lucide-react"

type Props = { role: string; isOwner?: boolean }

export function SidebarNav({ role, isOwner }: Props) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {role === "SECRETARY" && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/secretary")}>
              <Link href="/secretary" className="flex items-center gap-2">
                <ClipboardList />
                <span>Secretary Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive("/loans")}>
            <Link href="/loans" className="flex items-center gap-2">
              <Landmark />
              <span>Loans</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {role !== "MEMBER" && (
          <>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/members")}>
                <Link href="/members" className="flex items-center gap-2">
                  <Users />
                  <span>Members</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/products")}>
                <Link href="/products" className="flex items-center gap-2">
                  <Boxes />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/saccos")}>
                <Link href="/saccos" className="flex items-center gap-2">
                  <Building2 />
                  <span>SACCOs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/clusters")}> 
                <Link href="/clusters" className="flex items-center gap-2">
                  <GitBranch />
                  <span>Clusters</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
        {isOwner && (
          <>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/owner/users")}> 
                <Link href="/owner/users" className="flex items-center gap-2">
                  <UserCog />
                  <span>Users</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/owner/permissions")}> 
                <Link href="/owner/permissions" className="flex items-center gap-2">
                  <ShieldCheck />
                  <span>Permissions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")}> 
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
