import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ProfileMenu } from '@/app/dashboard/_components/profile-menu'
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav'
import { RefreshButton } from '@/app/dashboard/_components/refresh-button'
import { Card } from '@/components/ui/card'

export default async function OwnerPermissionsPage() {
  const me = await getSession()
  if (!me) {
    return (
      <div className="p-6">
        <p className="mb-4">You are not signed in.</p>
        <Link className="underline" href="/login">Go to Login</Link>
      </div>
    )
  }
  if (!me.isOwner) {
    return (
      <div className="p-6">
        <p className="mb-2">Access denied.</p>
        <p className="text-sm text-muted-foreground">Only the Owner can manage permissions.</p>
      </div>
    )
  }

  const roleMatrix = [
    { role: 'ADMINISTRATOR', capabilities: ['Manage products', 'Manage members', 'Approve loans'] },
    { role: 'CHAIRMAN', capabilities: ['Approve loans', 'View reports'] },
    { role: 'SECRETARY', capabilities: ['Manage communications'] },
    { role: 'TREASURER', capabilities: ['Manage finances'] },
    { role: 'MEMBER', capabilities: ['Apply loans', 'View own loans'] },
  ]

  return (
    <SidebarProvider>
      <div className="grid min-h-svh w-full md:grid-cols-[260px_1fr]">
        <Sidebar>
          <SidebarHeader>
            <Link href="/dashboard" className="px-2 py-2 inline-flex items-center" aria-label="Home">
              <Image src="/images/upendi-landscape.svg" alt="Upendi" width={168} height={34} priority />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav role={me.role} isOwner={me.isOwner} />
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <div className="px-2 text-xs text-muted-foreground">{me.email}</div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-5" />
            <div className="flex-1 font-medium">
              Permissions Management
            </div>
            <ProfileMenu email={me.email} />
          </header>

          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Permissions</h1>
                <p className="text-sm text-muted-foreground">Review roles and capabilities</p>
              </div>
              <RefreshButton />
            </div>

            <Card className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-primary bg-secondary/10">
                    <th className="py-2 px-4">Role</th>
                    <th className="py-2 px-4">Capabilities</th>
                  </tr>
                </thead>
                <tbody>
                  {roleMatrix.map(row => (
                    <tr key={row.role} className="border-t">
                      <td className="py-2 px-4 font-medium">{row.role}</td>
                      <td className="py-2 px-4">{row.capabilities.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
